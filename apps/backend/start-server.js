#!/usr/bin/env node

// Set environment variables for development
process.env.MYSQL_HOST = 'localhost';
process.env.MYSQL_PORT = '3306';
process.env.MYSQL_USER = 'root';
process.env.MYSQL_PASSWORD = '';
process.env.MYSQL_MASTER_DB = 'fbr_master';
process.env.JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';
process.env.NODE_ENV = 'development';
process.env.PORT = '5150';

console.log('🚀 Starting FBR Integration Backend Server...');
console.log('📋 Environment Variables Set:');
console.log(`   MYSQL_HOST: ${process.env.MYSQL_HOST}`);
console.log(`   MYSQL_PORT: ${process.env.MYSQL_PORT}`);
console.log(`   MYSQL_USER: ${process.env.MYSQL_USER}`);
console.log(`   MYSQL_MASTER_DB: ${process.env.MYSQL_MASTER_DB}`);
console.log(`   PORT: ${process.env.PORT}`);
console.log('');

// Import and start the server
import('./index.js')
  .then(() => {
    console.log('✅ Server started successfully!');
  })
  .catch(error => {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  });
