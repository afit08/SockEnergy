const Redis = require('ioredis');
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
  body('role_name').notEmpty().escape().withMessage('Name is required'),
];

const createRoles = async (req, res) => {
  try {
    await Promise.all(
      createValidationRules.map((validation) => validation.run(req)),
    );

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role_name } = req.body;

    const result = await req.context.models.roles.create({
      role_name: role_name,
    });

    return res.status(200).json({
      message: 'Create roles successfully!!!',
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
};

const allRoles = async (req, res) => {
  try {
    const result = await req.context.models.roles.findAll({});

    await redisClient.setex('allRoles', 60, JSON.stringify(result));

    const cachedData = await redisClient.get('allRoles');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'show all data roles',
        data: parsedData,
        status: 200,
      });
    }

    return res.status(200).json({
      message: 'show all data roles',
      data: result,
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message, status: 500 });
  }
};

export default {
  createRoles,
  allRoles,
};
