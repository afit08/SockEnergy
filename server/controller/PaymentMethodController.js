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
  body('payment_name')
    .notEmpty()
    .escape()
    .withMessage('Payment name is required'),
];

const allPaymentMethod = async (req, res) => {
  try {
    const result = await req.context.models.payment_method.findAll({});

    await redisClient.setex('allPaymentMethod', 60, JSON.stringify(result));

    const cachedData = await redisClient.get('allPaymentMethod');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return res.status(200).json({
        message: 'Show all payment method',
        data: parsedData,
      });
    }

    return res.status(200).json({
      message: 'Show all payment method',
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

const createPaymentMethod = async (req, res) => {
  try {
    await Promise.all(
      createValidationRules.map((validation) => validation.run(req)),
    );

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { payment_name } = req.body;

    const result = await req.context.models.payment_method.create({
      payment_name: payment_name,
    });

    return res.status(200).json({
      message: 'Create payment method',
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
  allPaymentMethod,
  createPaymentMethod,
};
