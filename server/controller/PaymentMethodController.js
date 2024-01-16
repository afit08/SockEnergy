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
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const createPaymentMethod = async (req, res) => {
  const { payment_name } = req.body;
  try {
    const result = await req.context.models.payment_method.create({
      payment_name: payment_name,
    });

    return res.status(200).json({
      message: 'Create payment method',
      data: result,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

export default {
  allPaymentMethod,
  createPaymentMethod,
};
