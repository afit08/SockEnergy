import formidable from 'formidable';
require('dotenv').config();
const Minio = require('minio');
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

const uploadSingleFiles = async (req, res, next) => {
  const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_IP,
    port: parseInt(process.env.MINIO_PORT),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS,
    secretKey: process.env.MINIO_SECRET,
  });

  const form = formidable(minioClient);
  let files = [];
  let fields = [];

  form
    .parse(req)
    .on('field', (fieldName, value) => {
      fields.push({ fieldName, value });
    })
    .once('file', (filename, file) => {
      files.push({ filename, file });

      const objectName = file.originalFilename;
      const fileStream = file.filepath;
      const bucketName = 'sock-energy';
      const metaData = {};

      // Determine the Content-Type based on file extension
      const extension = objectName.split('.').pop().toLowerCase();
      if (extension === 'png') {
        metaData['Content-Type'] = 'image/png';
      } else if (extension === 'jpg' || extension === 'jpeg') {
        metaData['Content-Type'] = 'image/jpeg';
      } else if (extension === 'svg') {
        metaData['Content-Type'] = 'image/svg+xml';
      }

      minioClient.fPutObject(
        bucketName,
        objectName,
        fileStream,
        metaData,
        function (err, etag) {
          if (err) {
            form._error(new Error('Failed to upload file to MinIO'));
          } else {
            req.fileAttrb = {
              files: files,
              fields: fields,
            };
            next();
          }
        },
      );
    });
};

const showProductImage = async (req, res) => {
  const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_IP,
    port: parseInt(process.env.MINIO_PORT),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS,
    secretKey: process.env.MINIO_SECRET,
  });

  const filename = req.params.filename;
  const bucketName = 'sock-energy';
  const objectName = `${filename}`;

  const url = await minioClient.presignedGetObject(bucketName, objectName);

  await redisClient.setex('showProductImage', 60, JSON.stringify(url));

  const cachedData = await redisClient.get('showProductImage');
  if (cachedData) {
    res.redirect(url);
  }
};

export default {
  uploadSingleFiles,
  showProductImage,
};
