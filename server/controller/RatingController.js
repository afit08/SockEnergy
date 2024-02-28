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

const { body, validationResult } = require('express-validator');

const createValidationRules = [
  body('rat_count').notEmpty().escape().withMessage('Rating Count is required'),
  body('rat_desc')
    .notEmpty()
    .escape()
    .withMessage('Rating Description is required'),
  body('rat_prod_id').notEmpty().escape().withMessage('Product ID is required'),
  body('rat_fopa_id')
    .notEmpty()
    .escape()
    .withMessage('Form Payment ID is required'),
];

const createRating = async (req, res) => {
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
    const { rat_count, rat_desc, rat_prod_id, rat_fopa_id } = req.body;

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
    const result = await req.context.models.rating.create({
      rat_count: rat_count,
      rat_desc: rat_desc,
      rat_image: fileName,
      rat_user_id: req.user.user_id,
      rat_prod_id: rat_prod_id,
      rat_fopa_id: rat_fopa_id,
    });

    return res.status(200).json({
      message: 'Create Rating Successfully!!!',
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

const detailRating = async (req, res) => {
  try {
    const isValidUUID = uuidv4.validate(req.params.id);

    if (!isValidUUID) {
      return res.status(400).json({
        message: 'Invalid ID parameter',
      });
    }

    const data_product = await sequelize.query(
      `
            SELECT
            a.cart_id,
            a.cart_qty,
            a.cart_fopa_id,
            b.prod_id,
            b.prod_name,
            b.prod_image,
            b.prod_price
            FROM carts a
            INNER JOIN products b ON b.prod_id = a.cart_prod_id
            WHERE cart_fopa_id = :id
            and prod_id = :ids
        `,
      {
        replacements: { id: req.params.id, ids: req.params.ids },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    return res.status(200).json({
      message: 'Detail Rating',
      data: data_product,
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

const ListRating = async (req, res) => {
  try {
    const result = await sequelize.query(
      `
        select 
        a.rat_id,
        a.rat_desc,
        a.rat_image,
        b.user_id,
        b.user_personal_name,
        c.prod_id,
        c.prod_name
        from rating a
        inner join users b on b.user_id =  a.rat_user_id
        inner join products c on c.prod_id = a.rat_prod_id
      `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    );

    return res.status(200).json({
      message: 'Detail Rating For Users',
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
  createRating,
  detailRating,
  ListRating,
};
