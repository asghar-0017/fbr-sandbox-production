#!/usr/bin/env node

// Set environment variables
process.env.MYSQL_HOST = 'localhost';
process.env.MYSQL_PORT = '3307';
process.env.MYSQL_USER = 'root';
process.env.MYSQL_PASSWORD = 'root';
process.env.MYSQL_MASTER_DB = 'fbr_master';

// Import and run the migration
import('./add-system-invoice-id-field.js')
  .then(module => module.addSystemInvoiceIdField())
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
