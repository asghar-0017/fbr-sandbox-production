import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Master database configuration
export const masterConfig = {
  host: process.env.MYSQL_HOST || '45.55.137.96',
    port: process.env.MYSQL_PORT || 3306,
    username: process.env.MYSQL_USER || 'fr_master_o',
    password: process.env.MYSQL_PASSWORD || 'noLograt$5aion',
  database: process.env.MYSQL_MASTER_DB || 'fr_master',
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    connectTimeout: 10000 // 10 seconds, increase if needed
  },
};

// Master database connection
export const masterSequelize = new Sequelize(masterConfig);

// Function to create tenant database connection
export const createTenantConnection = (databaseName) => {
  return new Sequelize({
    host: process.env.MYSQL_HOST || '45.55.137.96',
    port: process.env.MYSQL_PORT || 3306,
    username: process.env.MYSQL_USER || 'fr_master_o',
    password: process.env.MYSQL_PASSWORD || 'noLograt$5aion',
    database: databaseName,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      connectTimeout: 10000
    }
  });
};

// Test master database connection
export const testMasterConnection = async () => {
  try {
    await masterSequelize.authenticate();
    console.log('✅ Master database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to master database:', error);
    return false;
  }
};

// Initialize master database
export const initializeMasterDatabase = async () => {
  try {
    // Use force: false to prevent automatic schema changes
    await masterSequelize.sync({ force: false });
    console.log('✅ Master database synchronized successfully.');
    return true;
  } catch (error) {
    console.error('❌ Error synchronizing master database:', error);
    return false;
  }
}; 