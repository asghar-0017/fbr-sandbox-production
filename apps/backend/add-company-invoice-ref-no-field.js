#!/usr/bin/env node

/**
 * Migration Script: Add companyInvoiceRefNo Field to Invoices Table
 *
 * This script adds a new companyInvoiceRefNo field to the invoices table
 * for all existing tenants.
 *
 * Usage: node add-company-invoice-ref-no-field.js
 */

import mysql2 from "mysql2/promise";
import config from "./src/config/index.js";

const dbConfig = {
  host: config.mysql.host,
  user: config.mysql.username,
  password: config.mysql.password,
  port: config.mysql.port,
};

async function addCompanyInvoiceRefNoField() {
  const connection = await mysql2.createConnection(dbConfig);

  try {
    console.log("🚀 Starting company invoice ref no field migration...");

    // Get all tenant databases
    const [databases] = await connection.query("SHOW DATABASES");
    const tenantDatabases = databases
      .map((db) => db.Database)
      .filter(
        (dbName) =>
          dbName.startsWith("tenant_") ||
          dbName === "innovative123" ||
          dbName === "hydra" ||
          dbName === "hydra2"
      );

    console.log(
      `📋 Found ${tenantDatabases.length} tenant databases to migrate`
    );

    for (const dbName of tenantDatabases) {
      console.log(`\n🔄 Processing database: ${dbName}`);

      try {
        await connection.query(`USE \`${dbName}\``);

        // Check if the column already exists
        const [columns] = await connection.query(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = '${dbName}' AND TABLE_NAME = 'invoices' AND COLUMN_NAME = 'companyInvoiceRefNo'
        `);

        if (columns.length > 0) {
          console.log(
            `   ✅ companyInvoiceRefNo column already exists in ${dbName}`
          );
          continue;
        }

        // Add the companyInvoiceRefNo column
        await connection.query(`
          ALTER TABLE invoices 
          ADD COLUMN companyInvoiceRefNo VARCHAR(100) NULL
        `);
        console.log(`   ✅ Added companyInvoiceRefNo column to ${dbName}`);
      } catch (error) {
        console.error(`   ❌ Error processing ${dbName}:`, error.message);
      }
    }

    console.log("\n✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

// Run the migration
addCompanyInvoiceRefNoField().catch(console.error);
