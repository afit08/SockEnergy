const sequelize = require('../helpers/queryConn.js');
const uuidv4 = require('uuid');
const Redis = require('ioredis');
const redisClient = new Redis({
  host: process.env.IP_REDIS,
  port: process.env.PORT_REDIS,
});
const minioClient = require('../helpers/MinioConnection');

redisClient.on('error', (err) => {
  console.error('Error connecting to Redis:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

const { body, validationResult } = require('express-validator');

const createValidationRules = [
  body('cate_name')
    .notEmpty()
    .escape()
    .withMessage('Categori name is required'),
];

const searcValidation = [body('search').escape()];

const createCategories = async (req, res) => {
  try {
    // Validate and sanitize input
    await Promise.all(
      createValidationRules.map((validation) => validation.run(req)),
    );

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    const { cate_name } = req.body;

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

    const result = await req.context.models.categories.create({
      cate_name: cate_name,
      cate_image: fileName,
    });

    return res.status(200).json({
      message: 'Create categories successfully!!!',
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
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

    await redisClient.setex(
      'showAllCategories',
      60,
      JSON.stringify(result, pagination),
    );

    const cachedData = await redisClient.get('showAllCategories');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'Show All Categories',
        data: parsedData,
        status: 200,
        pagination: pagination,
      });
    }

    return res.status(200).json({
      message: 'Show All Categories',
      data: result,
      status: 200,
      pagination: pagination,
    });
  } catch (error) {
    return res.status(404).json({ message: error.message, status: 500 });
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
      message: 'Search All Categories',
      data: result,
      pagination: pagination,
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

const detailCategories = async (req, res) => {
  try {
    const isValidUUID = uuidv4.validate(req.params.id);

    if (!isValidUUID) {
      return res.status(400).json({
        message: 'Invalid ID parameter',
      });
    }

    const result = await req.context.models.categories.findAll({
      where: { cate_id: req.params.id },
      attributes: ['cate_id', 'cate_name', 'cate_image'],
    });

    await redisClient.setex('detailCategories', 60, JSON.stringify(result));

    const cachedData = await redisClient.get('detailCategories');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'Detail Categories',
        data: parsedData,
        status: 200,
      });
    }
    return res.status(200).json({
      message: 'Detail Categories',
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

const editCategories = async (req, res) => {
  try {
    // Validate and sanitize input
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

    const { cate_name } = req.body;

    const result = await req.context.models.categories.update(
      {
        cate_name: cate_name,
        cate_image: fileName,
      },
      {
        returning: true,
        where: { cate_id: req.params.id },
      },
    );

    if (result[1][0] == undefined) {
      return res.status(404).json({
        message: 'Not found',
        status: 404,
      });
    }

    return res.status(200).json({
      message: 'Edit categori successfully!!!',
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message, status: 500 });
  }
};

const deleteCategories = async (req, res) => {
  try {
    const isValidUUID = uuidv4.validate(req.params.id);

    if (!isValidUUID) {
      return res.status(400).json({
        message: 'Invalid ID parameter',
      });
    }

    const result = await req.context.models.categories.destroy({
      where: { cate_id: req.params.id },
    });

    if (result == 0) {
      return res.status(404).json({
        message: 'Not found',
        status: 404,
      });
    }

    return res.status(200).json({
      message: 'Delete Category Successfully!!!',
      status: 200,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
      status: 500,
    });
  }
};

const detailProduct = async (req, res) => {
  try {
    const isValidUUID = uuidv4.validate(req.params.id);

    if (!isValidUUID) {
      return res.status(400).json({
        message: 'Invalid ID parameter',
      });
    }

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

    await redisClient.setex('detailProduct', 60, JSON.stringify(result));

    const cachedData = await redisClient.get('detailProduct');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'Detail Product',
        data: parsedData,
        status: 200,
      });
    }

    return res.status(200).json({
      message: 'Detail Product',
      status: 200,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

// const editCategoriesNoImage = async (req, res) => {
//   try {
//     const { cate_name } = req.body;

//     const result = await req.context.models.categories.update(
//       {
//         cate_name: cate_name,
//       },
//       {
//         returning: true,
//         where: { cate_id: req.params.id },
//       },
//     );

//     return res.status(200).json({
//       message: 'Edit Categories No Image',
//       data: result[1][0],
//     });
//   } catch (error) {
//     return res.status(404).json({ message: error.message });
//   }
// };

const allCategoriesCustomer = async (req, res) => {
  try {
    let limit = parseInt(req.query.limit) || 10; // Default limit to 10 if not provided
    let page = parseInt(req.query.page) || 1; // Default page to 1 if not provided
    let start = (page - 1) * limit;
    let end = page * limit;

    const result = await req.context.models.categories.findAll({
      order: [['cate_created_at', 'DESC']],
      include: [
        {
          model: req.context.models.products,
          as: 'products',
          attributes: ['prod_id', 'prod_name'],
        },
      ],
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

    await redisClient.setex(
      'showAllCategoriesCustomer',
      60,
      JSON.stringify(result, pagination),
    );

    const cachedData = await redisClient.get('showAllCategoriesCustomer');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'Show All Categories Customer',
        status: 200,
        data: parsedData,
        pagination: pagination,
      });
    }

    return res.status(200).json({
      message: 'Show All Categories Customer',
      data: result,
      status: 200,
      pagination: pagination,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

const detailCategoriesCustomer = async (req, res) => {
  try {
    const result = await req.context.models.categories.findOne({
      where: { cate_id: req.params.id },
      include: [
        {
          model: req.context.models.products,
          as: 'products',
        },
      ],
    });

    await redisClient.setex(
      'detailCategoriesCustomer',
      60,
      JSON.stringify(result),
    );

    const cachedData = await redisClient.get('detailCategoriesCustomer');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'Show All Categories Customer',
        data: parsedData,
        status: 200,
      });
    }

    return res.status(200).json({
      message: 'Detail Categories Customer',
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
  createCategories,
  allCategories,
  editCategories,
  // editCategoriesNoImage,
  deleteCategories,
  detailCategories,
  allCategoriesSearch,
  detailProduct,
  allCategoriesCustomer,
  detailCategories,
  detailCategoriesCustomer,
};
