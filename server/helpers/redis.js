// Separate module for Redis setup
// redis.js

const redis = require('redis');

function createRedisClient() {
  const client = redis.createClient({
    host: '127.0.0.1',
    port: 6379,
    // Add any other configuration options as needed
  });

  client.on('error', (err) => {
    console.error(`Redis Error: ${err}`);
  });

  return client;
}

export default createRedisClient;
