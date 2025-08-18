#!/usr/bin/env node

// Set environment variables (adjust if your DB is different)
process.env.MYSQL_HOST = "localhost";
process.env.MYSQL_PORT = "3307";
process.env.MYSQL_USER = "root";
process.env.MYSQL_PASSWORD = "root";
process.env.MYSQL_MASTER_DB = "fbr_master";

// Import and run the migration script
const { runAddAdvanceIncomeTaxMigration } = await import(
  "./add-advance-income-tax-field.js"
);

try {
  await runAddAdvanceIncomeTaxMigration();
  console.log("advanceIncomeTax column migration completed successfully");
  process.exit(0);
} catch (error) {
  console.error("Migration failed:", error);
  process.exit(1);
}
