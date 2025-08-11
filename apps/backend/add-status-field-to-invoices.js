import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const config = {
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: 'root',
  database: 'fbr_master',
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000
};

async function addStatusFieldToInvoices() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(config);
        
    // Get all tenant databases
    const [tenants] = await connection.execute(
      'SELECT tenant_id, database_name FROM tenants WHERE is_active = 1'
    );
    
    console.log(`Found ${tenants.length} active tenants`);
    
    for (const tenant of tenants) {
      console.log(`\nProcessing tenant: ${tenant.tenant_id} (${tenant.database_name})`);
      
      try {
        // Connect to tenant database
        const tenantConfig = {
          ...config,
          database: tenant.database_name
        };
        
        const tenantConnection = await mysql.createConnection(tenantConfig);
        
        // Check if status column exists
        const [columns] = await tenantConnection.execute(
          "SHOW COLUMNS FROM invoices LIKE 'status'"
        );
        
        if (columns.length === 0) {
          console.log('  Adding status column...');
          await tenantConnection.execute(
            "ALTER TABLE invoices ADD COLUMN status ENUM('draft', 'saved', 'validated', 'submitted', 'posted') NOT NULL DEFAULT 'draft'"
          );
        } else {
          console.log('  Status column already exists');
          // Check if 'posted' is in the ENUM, if not update it
          const column = columns[0];
          if (!column.Type.includes("'posted'")) {
            console.log('  Updating status column to include "posted" value...');
            await tenantConnection.execute(
              "ALTER TABLE invoices MODIFY COLUMN status ENUM('draft', 'saved', 'validated', 'submitted', 'posted') NOT NULL DEFAULT 'draft'"
            );
          }
        }
        
        // Check if fbr_invoice_number column exists
        const [fbrColumns] = await tenantConnection.execute(
          "SHOW COLUMNS FROM invoices LIKE 'fbr_invoice_number'"
        );
        
        if (fbrColumns.length === 0) {
          console.log('  Adding fbr_invoice_number column...');
          await tenantConnection.execute(
            "ALTER TABLE invoices ADD COLUMN fbr_invoice_number VARCHAR(100) NULL"
          );
        } else {
          console.log('  fbr_invoice_number column already exists');
        }
        
        // Update existing invoices to have 'submitted' status if they have an invoice_number
        const [updateResult] = await tenantConnection.execute(
          "UPDATE invoices SET status = 'submitted', fbr_invoice_number = invoice_number WHERE status = 'draft' AND invoice_number NOT LIKE 'DRAFT_%' AND invoice_number NOT LIKE 'SAVED_%'"
        );
        
        console.log(`  Updated ${updateResult.affectedRows} existing invoices to 'submitted' status`);
        
        await tenantConnection.end();
        
      } catch (error) {
        console.error(`  Error processing tenant ${tenant.tenant_id}:`, error.message);
      }
    }
    
    console.log('\nMigration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the migration
addStatusFieldToInvoices(); 