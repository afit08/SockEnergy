const { Sequelize } = require("sequelize");
import config from "../config/config.js";

const sequelize = new Sequelize(
  config.db_name,
  config.db_username,
  config.db_password,
  {
    logging: false,
    host: process.env.DATABASE_HOST,
    dialect: process.env.DIALECT,
  },
);

// Test the database connection
sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection has been established successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

// Define your models and associations here

module.exports = sequelize; // Export the Sequelize instance
