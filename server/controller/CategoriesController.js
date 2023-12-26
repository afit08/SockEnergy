const sequelize = require('../helpers/queryConn.js');

const createCategories = async (req, res) => {
  const { files, fields } = req.fileAttrb;

  try {
    const result = await req.context.models.categories.create({
      cate_name: fields[0].value,
      cate_image: files[0].file.originalFilename,
    });

    return res.status(200).json({
      message: 'Create Categories',
      data: result,
    });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

const allCategories = async (req, res) => {
  try {
    let limit = parseInt(req.query.limit) || 10; // Default limit to 10 if not provided
    let page = parseInt(req.query.page) || 1; // Default page to 1 if not provided
    let start = (page - 1) * limit;
    let end = page * limit;

    const result = await req.context.models.categories.findAll({
      order: [['cate_created_at', 'DESC']],
      offset: start,
      limit: limit,
    });

    const countResult = await req.context.models.categories.findAndCountAll({});
    // console.log(countResult);
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
      message: 'Show All Categories',
      data: result,
      pagination: pagination,
    });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

const allCategoriesSearch = async (req, res) => {
  try {
    const { search } = req.body;
    let limit = parseInt(req.query.limit) || 10; // Default limit to 10 if not provided
    let page = parseInt(req.query.page) || 1; // Default page to 1 if not provided
    let start = (page - 1) * limit;
    let end = page * limit;

    const result = await sequelize.query(
      `
        select * from categories 
        where lower(cate_name) like lower('%${search}%')
        limit :limit offset :start
      `,
      {
        replacements: { limit, start },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    const countResult = await sequelize.query(
      `
        select * from categories 
        where lower(cate_name) like lower('%${search}%')
      `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    );
    // console.log(countResult);
    const countFiltered = countResult.length;

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
      message: 'Show All Categories',
      data: result,
      pagination: pagination,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const detailCategories = async (req, res) => {
  try {
    const result = await req.context.models.categories.findAll({
      where: { cate_id: req.params.id },
      attributes: ['cate_id', 'cate_name', 'cate_image'],
    });

    return res.status(200).json({
      message: 'Detail Categories',
      data: result,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const editCategories = async (req, res) => {
  try {
    const { files, fields } = req.fileAttrb;

    const result = await req.context.models.categories.update(
      {
        cate_name: fields[0].value,
        cate_image: files[0].file.originalFilename,
      },
      {
        returning: true,
        where: { cate_id: req.params.id },
      },
    );

    return res.status(200).json({
      message: 'Edit Categories',
      data: result[1][0],
    });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

const deleteCategories = async (req, res) => {
  try {
    const result = await req.context.models.categories.destroy({
      where: { cate_id: req.params.id },
    });

    return res.status(200).json({
      message: 'Delete Categories',
      data: result,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const detailProduct = async (req, res) => {
  try {
    const result = await req.context.models.categories.findAll({
      where: { cate_id: req.params.id },
      include: [
        {
          model: req.context.models.products,
          as: 'products',
          attributes: [
            'prod_id',
            'prod_name',
            'prod_image',
            'prod_price',
            'prod_desc',
            'prod_stock',
            'prod_weight',
          ],
        },
      ],
    });

    return res.status(200).json({
      message: 'Detail Product',
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const editCategoriesNoImage = async (req, res) => {
  try {
    const { cate_name } = req.body;

    const result = await req.context.models.categories.update(
      {
        cate_name: cate_name,
      },
      {
        returning: true,
        where: { cate_id: req.params.id },
      },
    );

    return res.status(200).json({
      message: 'Edit Categories No Image',
      data: result[1][0],
    });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

export default {
  createCategories,
  allCategories,
  editCategories,
  editCategoriesNoImage,
  deleteCategories,
  detailCategories,
  allCategoriesSearch,
  detailProduct,
};
