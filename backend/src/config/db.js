const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), override: true });

if (!process.env.DB_NAME || !process.env.DB_USER) {
  console.error('Database env vars missing. Check backend/.env for DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT.');
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    dialect: 'mysql',
    logging: false,
  }
);

sequelize
  .authenticate()
  .then(() => {
    console.log('Database connection established successfully');
  })
  .catch((error) => {
    console.error('Error connecting to the database:', error.message || error);
    process.exit(1);
  });

module.exports = sequelize;
