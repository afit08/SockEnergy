const Redis = require('ioredis');
const uuidv4 = require('uuid');
const redisClient = new Redis({
  host: process.env.IP_REDIS,
  port: process.env.PORT_REDIS,
});
const minioClient = require('../helpers/MinioConnection');

const { body, validationResult } = require('express-validator');

const createAboutValidationRules = [
  body('abt_title').notEmpty().escape().withMessage('Title is required'),
  body('abt_desc').notEmpty().escape().withMessage('Description is required'),
  body('abt_lat').notEmpty().escape().withMessage('Latitude must be a number'),
  body('abt_long')
    .notEmpty()
    .escape()
    .withMessage('Longitude must be a number'),
];

const createAbout = async (req, res) => {
  try {
    // Validate and sanitize input
    await Promise.all(
      createAboutValidationRules.map((validation) => validation.run(req)),
    );

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    const { abt_title, abt_desc, abt_lat, abt_long } = req.body;

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

    // Create record in the database
    const result = await req.context.models.about.create({
      abt_title: abt_title,
      abt_desc: abt_desc,
      abt_image: fileName,
      abt_lat: abt_lat,
      abt_long: abt_long,
    });

    return res.status(200).json({
      message: 'Create about successfully!!!',
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error.message,
      status: 500,
    });
  }
};

const allAbout = async (req, res) => {
  try {
    // Use Sequelize's findAll method for fetching all records
    const result = await req.context.models.about.findAll({});

    // Cache the result
    await redisClient.setex('allAbout', 60, JSON.stringify(result));

    const cachedData = await redisClient.get('allAbout');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'All About',
        data: parsedData,
      });
    }

    return res.status(200).json({
      message: 'All About',
      data: result,
    });
  } catch (error) {
    // Handle errors appropriately
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

const oneAbout = async (req, res) => {
  try {
    // Validate that req.params.id is a valid UUID v4
    const isValidUUID = uuidv4.validate(req.params.id);

    if (!isValidUUID) {
      return res.status(400).json({
        message: 'Invalid ID parameter',
      });
    }

    // Use Sequelize's findOne method with parameterized queries
    const result = await req.context.models.about.findOne({
      where: {
        abt_id: req.params.id,
      },
    });

    if (!result) {
      return res.status(404).json({
        message: 'About record not found',
      });
    }

    // Cache the result
    await redisClient.setex('oneAbout', 60, JSON.stringify(result));

    const cachedData = await redisClient.get('oneAbout');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'Find One About',
        data: parsedData,
      });
    }

    return res.status(200).json({
      message: 'Find One About',
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

const updateAbout = async (req, res) => {
  try {
    // Validate and sanitize input
    await Promise.all(
      createAboutValidationRules.map((validation) => validation.run(req)),
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

    const { abt_title, abt_desc, abt_lat, abt_long } = req.body;

    const result = await req.context.models.about.update(
      {
        abt_title: abt_title,
        abt_desc: abt_desc,
        abt_image: fileName, // Will be undefined if no file is uploaded
        abt_lat: abt_lat,
        abt_long: abt_long,
      },
      { returning: true, where: { abt_id: req.params.id } },
    );

    if (result[1][0] == undefined) {
      return res.status(404).json({
        message: 'Not found',
        status: 404,
      });
    }

    return res.status(200).json({
      message: 'Edit about successfully!!!',
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
  createAbout,
  allAbout,
  oneAbout,
  updateAbout,
};
