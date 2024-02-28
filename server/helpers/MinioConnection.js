const Minio = require('minio');
require('dotenv').config();

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_IP,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS,
  secretKey: process.env.MINIO_SECRET,
});

module.exports = minioClient;
