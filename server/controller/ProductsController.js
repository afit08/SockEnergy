const { Sequelize } = require('sequelize');
const sequelize = require('../helpers/queryConn.js');
const Redis = require('ioredis');
const uuidv4 = require('uuid');
const redisClient = new Redis({
  host: process.env.IP_REDIS,
  port: process.env.PORT_REDIS,
});

redisClient.on('error', (err) => {
  console.error('Error connecting to Redis:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});
const minioClient = require('../helpers/MinioConnection');
const { body, validationResult } = require('express-validator');

const createValidationRules = [
  body('prod_name').notEmpty().escape().withMessage('Product name is required'),
  body('prod_price')
    .notEmpty()
    .escape()
    .withMessage('Product price is required'),
  body('prod_desc')
    .notEmpty()
    .escape()
    .withMessage('Product Description is required'),
  body('prod_cate_id')
    .notEmpty()
    .escape()
    .withMessage('Product Categori ID is required'),
  body('prod_stock')
    .notEmpty()
    .escape()
    .withMessage('Product Stock is required'),
  body('prod_weight')
    .notEmpty()
    .escape()
    .withMessage('Product Weight is required'),
];

const createProduct = async (req, res) => {
  try {
    await Promise.all(
      createValidationRules.map((validation) => validation.run(req)),
    );

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    const {
      prod_name,
      prod_price,
      prod_desc,
      prod_cate_id,
      prod_stock,
      prod_weight,
    } = req.body;

    await new Promise((resolve, reject) => {
      minioClient.putObject(
        'sock-energy',
        fileName,
        fileBuffer,
        (err, etag) => {
          if (err) {
            reject(err);
          } else {
            resolve(etag);
          }
        },
      );
    });

    const result = await req.context.models.products.create({
      prod_name: prod_name,
      prod_price: prod_price,
      prod_desc: prod_desc,
      prod_cate_id: prod_cate_id,
      prod_image: fileName,
      prod_stock: prod_stock,
      prod_weight: prod_weight,
    });

    return res.status(200).json({
      message: 'Create Products Successfully!!!',
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
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
        status: 200,
        pagination: pagination,
      });
    }

    return res.status(200).json({
      message: 'Show All Products (Cached)',
      data: products,
      status: 200,
      pagination: pagination,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message, status: 500 });
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
      select count(*) as count from products a
      inner join categories b on b.cate_id = a.prod_cate_id
      where lower(prod_name) like lower(:id) 
      `,
      {
        replacements: { limit, start, id: `%${search}%` },
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

    await redisClient.setex(
      'searchProduct',
      60,
      JSON.stringify(result, pagination),
    );

    const cachedData = await redisClient.get('searchProduct');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'Search All Products (Cached)',
        data: parsedData,
        pagination: pagination,
      });
    }

    return res.status(200).json({
      message: 'Search All Products',
      data: result,
      status: 200,
      pagination: pagination,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message, status: 500 });
  }
};

const updateProducts = async (req, res) => {
  try {
    await Promise.all(
      createValidationRules.map((validation) => validation.run(req)),
    );

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let fileBuffer, fileName;

    // Check if file is present in the request
    if (req.file) {
      fileBuffer = req.file.buffer;
      fileName = req.file.originalname;

      // Upload file to Minio
      await new Promise((resolve, reject) => {
        minioClient.putObject(
          'sock-energy',
          fileName,
          fileBuffer,
          (err, etag) => {
            if (etag) {
              resolve(etag);
            } else {
              reject(err);
            }
          },
        );
      });
    }

    // Validate that req.params.id is a valid UUID v4
    const isValidUUID = uuidv4.validate(req.params.id);

    if (!isValidUUID) {
      return res.status(400).json({
        message: 'Invalid ID parameter',
      });
    }

    const {
      prod_name,
      prod_price,
      prod_desc,
      prod_cate_id,
      prod_stock,
      prod_weight,
    } = req.body;

    const result = await req.context.models.products.update(
      {
        prod_name: prod_name,
        prod_price: prod_price,
        prod_desc: prod_desc,
        prod_cate_id: prod_cate_id,
        prod_image: fileName,
        prod_stock: prod_stock,
        prod_weight: prod_weight,
      },
      {
        returning: true,
        where: { prod_id: req.params.id },
      },
    );

    if (result[1][0] == undefined) {
      return res.status(404).json({
        message: 'Not found',
        status: 404,
      });
    }

    return res.status(200).json({
      message: 'Update Products Successfully!!!',
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

// const updateProductsNoImage = async (req, res) => {
//   const {
//     prod_name,
//     prod_price,
//     prod_desc,
//     prod_cate_id,
//     prod_stock,
//     prod_weight,
//   } = req.body;

//   try {
//     const result = await req.context.models.products.update(
//       {
//         prod_name: prod_name,
//         prod_price: prod_price,
//         prod_desc: prod_desc,
//         prod_cate_id: prod_cate_id,
//         prod_stock: prod_stock,
//         prod_weight: prod_weight,
//       },
//       {
//         returning: true,
//         where: { prod_id: req.params.id },
//       },
//     );

//     return res.status(200).json({
//       message: 'Update Without Image Products',
//       data: result[1][0],
//     });
//   } catch (error) {
//     return res.status(404).json({ message: error.message });
//   }
// };

const deleteProducts = async (req, res) => {
  try {
    const isValidUUID = uuidv4.validate(req.params.id);

    if (!isValidUUID) {
      return res.status(400).json({
        message: 'Invalid ID parameter',
      });
    }
    const id = req.params.id;
    const result = await req.context.models.products.destroy({
      where: { prod_id: id },
    });

    return res.status(200).json({
      message: 'Delete Product Successfully!!!',
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

const categoriProducts = async (req, res) => {
  try {
    const isValidUUID = uuidv4.validate(req.params.id);

    if (!isValidUUID) {
      return res.status(400).json({
        message: 'Invalid ID parameter',
      });
    }

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

    const countResult = await req.context.models.products.findAndCountAll({
      where: { prod_cate_id: req.params.id },
      include: [
        {
          model: req.context.models.categories,
          as: 'prod_cate',
          attributes: ['cate_id', 'cate_name'],
        },
      ],
    });

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

    await redisClient.setex(
      'categoriProducts',
      60,
      JSON.stringify(result, pagination),
    );

    const cachedData = await redisClient.get('categoriProducts');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'Categori Products (Cached)',
        data: parsedData,
        status: 200,
        pagination: pagination,
      });
    }

    return res.status(200).json({
      message: 'Categories Products',
      data: result,
      status: 200,
      pagination: pagination,
    });
  } catch (error) {
    return res.status(500).json({
      // Changed status code to 500 for server errors
      message: error.message,
      status: 500,
    });
  }
};

const detailProducts = async (req, res) => {
  try {
    const isValidUUID = uuidv4.validate(req.params.id);

    if (!isValidUUID) {
      return res.status(400).json({
        message: 'Invalid ID parameter',
      });
    }
    const result = await req.context.models.products.findAll({
      where: { prod_id: req.params.id },
      include: [
        {
          model: req.context.models.categories,
          as: 'prod_cate',
        },
        {
          model: req.context.models.rating,
          as: 'ratings',
          attributes: ['rat_id', 'rat_count', 'rat_desc', 'rat_image'],
          include: [
            {
              model: req.context.models.users,
              as: 'rat_user',
              attributes: ['user_id', 'user_photo', 'user_personal_name'],
            },
          ],
        },
      ],
    });

    await redisClient.setex('detailProducts', 60, JSON.stringify(result));

    const cachedData = await redisClient.get('detailProducts');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'Detail Products (Cached)',
        data: parsedData,
        status: 200,
      });
    }

    return res.status(200).json({
      message: 'Detail Products',
      data: result,
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

export default {
  createProduct,
  allProducts,
  searchProduct,
  updateProducts,
  // updateProductsNoImage,
  deleteProducts,
  categoriProducts,
  detailProducts,
};
