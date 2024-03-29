require('dotenv').config();
const config = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  db_name: process.env.DATABASE,
  db_username: process.env.DATABASE_USER,
  db_password: process.env.DATABASE_PASSWORD,
  URL_DOMAIN: process.env.URL_DOMAIN,
  URL_IMAGE: process.env.URL_IMAGE,
  URL_API: process.env.URL_API,
  UPLOAD_DIR: process.env.UPLOAD_DIR,
  secret_key: process.env.SECRET_KEY,
  secret_iv: process.env.SECRET_IV,
  ecnryption_method: process.env.ECNRYPTION_METHOD,
};

export default config;
