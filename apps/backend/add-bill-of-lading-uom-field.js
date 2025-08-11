import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function addBillOfLadingUoMField() {
  let connection;
  
  try {
    // Connect to the database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'fbr_integrations'
    });

    console.log('Connected to database');

    // Add the billOfLadingUoM column to invoice_items table
    const alterQuery = `
      ALTER TABLE invoice_items 
      ADD COLUMN billOfLadingUoM VARCHAR(50) NULL
    `;

    await connection.execute(alterQuery);
    console.log('Successfully added billOfLadingUoM field to invoice_items table');

  } catch (error) {
    console.error('Error adding billOfLadingUoM field:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the migration
addBillOfLadingUoMField()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 