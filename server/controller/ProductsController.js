const { Sequelize } = require('sequelize');
const sequelize = require('../helpers/queryConn.js');

const createProduct = async (req, res) => {
  const { files, fields } = req.fileAttrb;

  try {
    const result = await req.context.models.products.create({
      prod_name: fields[0].value,
      prod_price: fields[1].value,
      prod_desc: fields[2].value,
      prod_cate_id: fields[3].value,
      prod_image: files[0].file.originalFilename,
      prod_stock: fields[4].value,
      prod_weight: fields[5].value,
    });

    await redisClient.setex('createProduct', 60, JSON.stringify(result));

    const cachedData = await redisClient.get('createProduct');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'Create Products',
        data: parsedData,
      });
    }

    return res.status(200).json({
      message: 'Create Products',
      data: result,
    });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

const allProducts = async (req, res) => {
  try {
    let limit = parseInt(req.query.limit) || 10; // Default limit to 10 if not provided
    let page = parseInt(req.query.page) || 1; // Default page to 1 if not provided
    let start = (page - 1) * limit;
    let end = page * limit;

    const products = await sequelize.query(
      `
      SELECT * FROM products AS a
      INNER JOIN categories AS b ON b.cate_id = a.prod_cate_id
      GROUP BY 
      prod_id,
      prod_name,
      prod_image,
      prod_price,
      prod_desc,
      prod_cate_id,
      prod_created_at,
      prod_stock,
      prod_weight,
      cate_id,
      cate_name,
      cate_created_at,
      cate_image
        ORDER BY prod_created_at DESC
      LIMIT :limit OFFSET :start
      `,
      {
        replacements: { limit, start },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const countResult = await sequelize.query(
      `
        SELECT COUNT(*) as count FROM products AS a
        INNER JOIN categories AS b ON b.cate_id = a.prod_cate_id
        GROUP BY 
        prod_id,
        prod_name,
        prod_image,
        prod_price,
        prod_desc,
        prod_cate_id,
        prod_created_at,
        prod_stock,
        prod_weight,
        cate_id,
        cate_name,
        cate_created_at,
        cate_image
        ORDER BY prod_created_at DESC
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const countFiltered = countResult[0].count;

    let pagination = {};
    pagination.totalRow = parseInt(countFiltered);
    pagination.totalPage = Math.ceil(countFiltered / limit);
    if (end < countFiltered) {
      pagination.next = {
        page: page + 1,
        limit: limit,
      };
    }

    if (start > 0) {
      pagination.prev = {
        page: page - 1,
        limit: limit,
      };
    }

    await redisClient.setex(
      'allProductData',
      60,
      JSON.stringify(products, pagination),
    );

    const cachedData = await redisClient.get('allProductData');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'Show All Products (Cached)',
        data: parsedData,
        pagination: pagination,
      });
    }

    return res.status(200).json({
      message: 'Show All Products (Cached)',
      data: products,
      pagination: pagination,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const searchProduct = async (req, res) => {
  const { search } = req.body;
  try {
    let limit = parseInt(req.query.record);
    let page = parseInt(req.query.page);
    let start = 0 + (page - 1) * limit;
    let end = page * limit;

    const result = await sequelize.query(
      `
                select * from products a
                inner join categories b on b.cate_id = a.prod_cate_id
                where lower(prod_name) like lower(:id) 
            `,
      {
        replacements: { limit, start, id: `%${search}%` },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const countResult = await sequelize.query(
      `
                select count(*) as count from products
            `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    );

    const countFiltered = countResult[0].count;

    let pagination = {};
    pagination.totalRow = parseInt(countFiltered);
    pagination.totalPage = Math.ceil(countFiltered / limit);
    if (end < countFiltered) {
      pagination.next = {
        page: page + 1,
        limit: limit,
      };
    }

    if (start > 0) {
      pagination.prev = {
        page: page - 1,
        limit: limit,
      };
    }

    return res.status(200).json({
      message: 'Search All Products',
      data: result,
      pagination: pagination,
    });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

const updateProducts = async (req, res) => {
  const { files, fields } = req.fileAttrb;

  try {
    const result = await req.context.models.products.update(
      {
        prod_name: fields[0].value,
        prod_price: fields[1].value,
        prod_desc: fields[2].value,
        prod_cate_id: fields[3].value,
        prod_image: files[0].file.originalFilename,
        prod_stock: fields[4].value,
        prod_weight: fields[5].value,
      },
      {
        returning: true,
        where: { prod_id: req.params.id },
      },
    );

    return res.status(200).json({
      message: 'Update With Image Products',
      data: result[1][0],
    });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

const updateProductsNoImage = async (req, res) => {
  const {
    prod_name,
    prod_price,
    prod_desc,
    prod_cate_id,
    prod_stock,
    prod_weight,
  } = req.body;

  try {
    const result = await req.context.models.products.update(
      {
        prod_name: prod_name,
        prod_price: prod_price,
        prod_desc: prod_desc,
        prod_cate_id: prod_cate_id,
        prod_stock: prod_stock,
        prod_weight: prod_weight,
      },
      {
        returning: true,
        where: { prod_id: req.params.id },
      },
    );

    return res.status(200).json({
      message: 'Update Without Image Products',
      data: result[1][0],
    });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

const deleteProducts = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await req.context.models.products.destroy({
      where: { prod_id: id },
    });

    return res.status(200).json({
      message: 'Delete Product',
      data: result,
    });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

const categoriProducts = async (req, res) => {
  try {
    let limit = parseInt(req.query.record);
    let page = parseInt(req.query.page);
    let start = 0 + (page - 1) * limit;
    let end = page * limit;

    const result = await req.context.models.products.findAll({
      where: { prod_cate_id: req.params.id },
      include: [
        {
          model: req.context.models.categories,
          as: 'prod_cate',
          attributes: ['cate_id', 'cate_name'],
        },
      ],
      offset: start,
      limit: limit,
    });

    const countResult = await req.context.models.products.findAndCountAll({});

    const countFiltered = countResult.count;

    let pagination = {};
    pagination.totalRow = parseInt(countFiltered);
    pagination.totalPage = Math.ceil(countFiltered / limit);
    if (end < countFiltered) {
      pagination.next = {
        page: page + 1,
        limit: limit,
      };
    }

    if (start > 0) {
      pagination.prev = {
        page: page - 1,
        limit: limit,
      };
    }

    return res.status(200).json({
      message: 'Categories Products',
      data: result,
      pagination: pagination,
    });
  } catch (error) {
    return res.status(500).json({
      // Changed status code to 500 for server errors
      message: error.message,
    });
  }
};

const detailProducts = async (req, res) => {
  try {
    const result = await req.context.models.products.findAll({
      where: { prod_id: req.params.id },
      include: [
        {
          model: req.context.models.categories,
          as: 'prod_cate',
        },
      ],
    });

    return res.status(200).json({
      message: 'Detail Products',
      data: result,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

export default {
  createProduct,
  allProducts,
  searchProduct,
  updateProducts,
  updateProductsNoImage,
  deleteProducts,
  categoriProducts,
  detailProducts,
};
