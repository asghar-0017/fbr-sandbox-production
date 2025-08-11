#!/usr/bin/env node

/**
 * Migration Script: Add system_invoice_id Field to Invoices Table
 * 
 * This script adds a new system_invoice_id field to the invoices table
 * for all existing tenants and generates system invoice IDs for existing invoices.
 * 
 * Usage: node add-system-invoice-id-field.js
 */

import mysql2 from 'mysql2/promise';
import config from './src/config/index.js';

const dbConfig = {
  host: config.mysql.host,
  user: config.mysql.username,
  password: config.mysql.password,
  port: config.mysql.port
};

// Helper function to generate system invoice ID
const generateSystemInvoiceId = (sequenceNumber) => {
  return `INV-${sequenceNumber.toString().padStart(4, '0')}`;
};

async function addSystemInvoiceIdField() {
  const connection = await mysql2.createConnection(dbConfig);
  
  try {
    console.log('🚀 Starting system invoice ID field migration...');

    // Get all tenant databases
    const [databases] = await connection.execute('SHOW DATABASES');
    const tenantDatabases = databases
      .map(db => db.Database)
      .filter(dbName => dbName.startsWith('tenant_') || dbName === 'innovative123');

    console.log(`📋 Found ${tenantDatabases.length} tenant databases to migrate`);

    for (const dbName of tenantDatabases) {
      console.log(`\n🔄 Processing database: ${dbName}`);
      
      try {
        await connection.execute(`USE \`${dbName}\``);

        // Check if the column already exists
        const [columns] = await connection.execute(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = '${dbName}' AND TABLE_NAME = 'invoices' AND COLUMN_NAME = 'system_invoice_id'
        `);

        if (columns.length > 0) {
          console.log(`   ✅ system_invoice_id column already exists in ${dbName}`);
          continue;
        }

        // Add the system_invoice_id column
        await connection.execute(`
          ALTER TABLE invoices 
          ADD COLUMN system_invoice_id VARCHAR(20) NULL UNIQUE
        `);
        console.log(`   ✅ Added system_invoice_id column to ${dbName}`);

        // Get all existing invoices and generate system invoice IDs
        const [invoices] = await connection.execute(`
          SELECT id FROM invoices ORDER BY created_at ASC
        `);

        console.log(`   📊 Found ${invoices.length} existing invoices to update`);

        // Update each invoice with a system invoice ID
        for (let i = 0; i < invoices.length; i++) {
          const invoice = invoices[i];
          const systemInvoiceId = generateSystemInvoiceId(i + 1);
          
          await connection.execute(`
            UPDATE invoices 
            SET system_invoice_id = ? 
            WHERE id = ?
          `, [systemInvoiceId, invoice.id]);
        }

        console.log(`   ✅ Updated ${invoices.length} invoices with system invoice IDs in ${dbName}`);

      } catch (error) {
        console.error(`   ❌ Error processing ${dbName}:`, error.message);
      }
    }

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the migration
if (import.meta.url === `file://${process.argv[1]}`) {
  addSystemInvoiceIdField()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export { addSystemInvoiceIdField };
