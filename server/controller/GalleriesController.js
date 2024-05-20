const sequelize = require('../helpers/queryConn.js');
const Redis = require('ioredis');
const redisClient = new Redis({
  host: process.env.IP_REDIS,
  port: process.env.PORT_REDIS,
});
const uuidv4 = require('uuid');
const minioClient = require('../helpers/MinioConnection');

redisClient.on('error', (err) => {
  console.error('Error connecting to Redis:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

const { body, validationResult } = require('express-validator');

const createValidationRules = [
  body('gall_name').notEmpty().escape().withMessage('Galleri name is required'),
];

const allGalleries = async (req, res) => {
  try {
    let limit = parseInt(req.query.limit) || 10; // Default limit to 10 if not provided
    let page = parseInt(req.query.page) || 1; // Default page to 1 if not provided
    let start = (page - 1) * limit;
    let end = page * limit;

    const result = await req.context.models.galleries.findAndCountAll({
      order: [['gall_created_at', 'desc']],
      offset: start,
      limit: limit,
    });

    const countFiltered = result.count;

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
      'showAllGalleries',
      60,
      JSON.stringify(result, pagination),
    );

    const cachedData = await redisClient.get('showAllGalleries');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'Show All Galleries',
        data: parsedData,
        status: 200,
        pagination: pagination,
      });
    }

    return res.status(200).json({
      message: 'Show All Galleries',
      data: result.rows,
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

const allGalleriesSearch = async (req, res) => {
  const { search } = req.body;
  let limit = parseInt(req.query.limit) || 10; // Default limit to 10 if not provided
  let page = parseInt(req.query.page) || 1; // Default page to 1 if not provided
  let start = (page - 1) * limit;
  let end = page * limit;

  try {
    const result = await sequelize.query(
      `
                select * from galleries
                where lower(gall_name) like lower('%${search}%')
                limit :limit offset :start
            `,
      {
        replacements: { limit, start },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    const countResult = await sequelize.query(
      `
                select count(*) as total from galleries
                where lower(gall_name) like lower('%${search}%')
            `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    );

    const countFiltered = countResult[0].total;

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
      message: 'Search Galleries',
      data: result,
      pagination: pagination,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const createGalleries = async (req, res) => {
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
    const { gall_name } = req.body;

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

    const result = await req.context.models.galleries.create({
      gall_name: gall_name,
      gall_image: fileName,
    });

    return res.status(200).json({
      message: 'Create galleri successfully!!!',
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

const detailGalleries = async (req, res) => {
  try {
    const isValidUUID = uuidv4.validate(req.params.id);

    if (!isValidUUID) {
      return res.status(400).json({
        message: 'Invalid ID parameter',
      });
    }

    const result = await req.context.models.galleries.findAll({
      where: { gall_id: req.params.id },
    });

    if (!result) {
      return res.status(404).json({
        message: 'About record not found',
      });
    }

    await redisClient.setex('detailCategories', 60, JSON.stringify(result));

    const cachedData = await redisClient.get('detailCategories');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'Show All Categories',
        data: parsedData,
        status: 200,
      });
    }

    return res.status(200).json({
      message: 'Detail Galleries',
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

const updateGalleries = async (req, res) => {
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

    const { gall_name } = req.body;

    const result = await req.context.models.galleries.update(
      {
        gall_name: gall_name,
        gall_image: fileName,
      },
      {
        returning: true,
        where: { gall_id: req.params.id },
      },
    );

    if (result[1][0] == undefined) {
      return res.status(404).json({
        message: 'Not found',
        status: 404,
      });
    }

    return res.status(200).json({
      message: 'Edit gallery successfully!!!',
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

// const updateGalleriesNoImage = async (req, res) => {
//   const { gall_name } = req.body;
//   try {
//     const result = await req.context.models.galleries.update(
//       {
//         gall_name: gall_name,
//       },
//       {
//         returning: true,
//         where: { gall_id: req.params.id },
//       },
//     );

//     return res.status(200).json({
//       message: 'Update Galleries',
//       data: result[1][0],
//     });
//   } catch (error) {
//     return res.status(404).json({
//       message: error.message,
//     });
//   }
// };

const deleteGalleries = async (req, res) => {
  try {
    const isValidUUID = uuidv4.validate(req.params.id);

    if (!isValidUUID) {
      return res.status(400).json({
        message: 'Invalid ID parameter',
      });
    }

    const result = await req.context.models.galleries.destroy({
      where: { gall_id: req.params.id },
    });

    if (result == 0) {
      return res.status(404).json({
        message: 'Not found',
        status: 404,
      });
    }

    return res.status(200).json({
      message: 'Delete gallery successfully!!!',
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
  allGalleries,
  allGalleriesSearch,
  createGalleries,
  detailGalleries,
  updateGalleries,
  // updateGalleriesNoImage,
  deleteGalleries,
};
