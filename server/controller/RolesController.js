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

const createRoles = async (req, res) => {
  const { role_name } = req.body;
  try {
    const result = await req.context.models.roles.create({
      role_name: role_name,
    });

    return res.status(200).json({
      message: 'create data roles',
      data: result,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
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
      });
    }

    return res.status(200).json({
      message: 'show all data roles',
      data: result,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export default {
  createRoles,
  allRoles,
};
