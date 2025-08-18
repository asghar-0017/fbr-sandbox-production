#!/usr/bin/env node

/**
 * Migration Script: Add advanceIncomeTax Field to invoice_items Table
 *
 * Adds DECIMAL(10,2) NULL column `advanceIncomeTax` to `invoice_items` across all tenant databases.
 *
 * Usage: node add-advance-income-tax-field.js
 */

import mysql2 from "mysql2/promise";
import config from "./src/config/index.js";
import { fileURLToPath } from "url";
import path from "path";

const dbConfig = {
  host: config.mysql.host,
  user: config.mysql.username,
  password: config.mysql.password,
  port: config.mysql.port,
};

export async function runAddAdvanceIncomeTaxMigration() {
  const connection = await mysql2.createConnection(dbConfig);

  try {
    console.log("🚀 Starting advanceIncomeTax migration on invoice_items...");

    // Get all databases
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

        // Check if table exists
        const [tables] = await connection.query(
          `SHOW TABLES LIKE 'invoice_items'`
        );
        if (tables.length === 0) {
          console.log(
            `   ⚠️  Table invoice_items not found in ${dbName}, skipping`
          );
          continue;
        }

        // Check if the column already exists
        const [columns] = await connection.query(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'invoice_items' AND COLUMN_NAME = 'advanceIncomeTax'`,
          [dbName]
        );

        if (columns.length > 0) {
          console.log(
            `   ✅ advanceIncomeTax column already exists in ${dbName}. Skipping.`
          );
          continue;
        }

        // Add the column to invoice_items
        await connection.query(
          `ALTER TABLE invoice_items ADD COLUMN advanceIncomeTax DECIMAL(10,2) NULL AFTER fedPayable`
        );
        console.log(
          `   ✅ Added advanceIncomeTax column to invoice_items in ${dbName}`
        );
      } catch (err) {
        console.error(`   ❌ Error processing ${dbName}:`, err.message);
      }
    }

    console.log("\n✅ Migration complete.");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

// Run directly if invoked via "node add-advance-income-tax-field.js"
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename)
) {
  runAddAdvanceIncomeTaxMigration().catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  });
}
