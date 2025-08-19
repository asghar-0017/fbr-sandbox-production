import { createTenantConnection } from './src/config/mysql.js';
import { createBuyerModel } from './src/model/mysql/tenant/Buyer.js';
import { createInvoiceModel } from './src/model/mysql/tenant/Invoice.js';
import { createInvoiceItemModel } from './src/model/mysql/tenant/InvoiceItem.js';
import Tenant from './src/model/mysql/Tenant.js';
import { masterSequelize } from './src/config/mysql.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🚀 Starting database schema check for all tenants...\n');

// Database Schema Checker Class
class DatabaseSchemaChecker {
  constructor() {
    this.tenantConnections = new Map();
  }

  // Get all active tenants
  async getAllTenants() {
    try {
      const tenants = await Tenant.findAll({
        where: { is_active: true },
        attributes: ['tenant_id', 'database_name'],
        raw: true
      });
      console.log(`✅ Found ${tenants.length} active tenants`);
      return tenants;
    } catch (error) {
      console.error('❌ Error fetching tenants:', error);
      throw error;
    }
  }

  // Check if table exists
  async tableExists(sequelize, tableName) {
    try {
      const [results] = await sequelize.query(
        `SHOW TABLES LIKE '${tableName}'`,
        { type: 'SELECT' }
      );
      return results && results.length > 0;
    } catch (error) {
      console.error(`❌ Error checking if table ${tableName} exists:`, error);
      return false;
    }
  }

  // Get current database schema for a table
  async getTableSchema(sequelize, tableName) {
    try {
      // First check if table exists
      const tableExists = await this.tableExists(sequelize, tableName);
      if (!tableExists) {
        console.log(`⚠️  Table ${tableName} doesn't exist`);
        return [];
      }

      const [results] = await sequelize.query(
        `DESCRIBE \`${tableName}\``,
        { type: 'SELECT' }
      );
      
      // Ensure we return an array and handle different result formats
      if (Array.isArray(results)) {
        return results;
      } else if (results && Array.isArray(results[0])) {
        return results[0];
      } else if (results && results.length > 0) {
        return results;
      } else {
        console.log(`⚠️  No schema results for table ${tableName}`);
        return [];
      }
    } catch (error) {
      console.error(`❌ Error getting schema for table ${tableName}:`, error);
      return [];
    }
  }

  // Compare model definition with database schema
  compareSchemaWithModel(modelDefinition, dbSchema) {
    const missingColumns = [];
    
    // Debug logging
    console.log(`🔍 Comparing schema for table with ${Object.keys(modelDefinition).length} model columns`);
    console.log(`🔍 Database schema has ${dbSchema ? dbSchema.length : 0} columns`);
    
    // Ensure dbSchema is an array
    if (!Array.isArray(dbSchema)) {
      console.error(`❌ dbSchema is not an array:`, typeof dbSchema, dbSchema);
      return [];
    }
    
    // Create a set of database column names
    const dbColumns = new Set();
    for (const col of dbSchema) {
      if (col && col.Field) {
        dbColumns.add(col.Field);
      }
    }
    
    console.log(`🔍 Found ${dbColumns.size} database columns:`, Array.from(dbColumns));

    // Extract column definitions from model
    const modelColumns = Object.keys(modelDefinition);

    for (const columnName of modelColumns) {
      if (!dbColumns.has(columnName)) {
        missingColumns.push({
          name: columnName,
          definition: modelDefinition[columnName]
        });
      }
    }

    console.log(`🔍 Found ${missingColumns.length} missing columns`);
    return missingColumns;
  }

  // Generate ALTER TABLE statement for missing column
  generateAlterTableStatement(tableName, columnName, columnDefinition) {
    const { type, allowNull, defaultValue, unique, primaryKey, autoIncrement } = columnDefinition;
    
    let columnDef = `\`${columnName}\` ${type}`;
    
    if (primaryKey) {
      columnDef += ' PRIMARY KEY';
    }
    
    if (autoIncrement) {
      columnDef += ' AUTO_INCREMENT';
    }
    
    if (allowNull === false) {
      columnDef += ' NOT NULL';
    }
    
    if (defaultValue !== undefined) {
      if (typeof defaultValue === 'string') {
        columnDef += ` DEFAULT '${defaultValue}'`;
      } else {
        columnDef += ` DEFAULT ${defaultValue}`;
      }
    }
    
    if (unique) {
      columnDef += ' UNIQUE';
    }

    return `ALTER TABLE \`${tableName}\` ADD COLUMN ${columnDef}`;
  }

  // Create missing columns for a table
  async createMissingColumns(sequelize, tableName, missingColumns) {
    const createdColumns = [];
    
    for (const column of missingColumns) {
      try {
        const alterStatement = this.generateAlterTableStatement(tableName, column.name, column.definition);
        console.log(`🔧 Executing: ${alterStatement}`);
        
        await sequelize.query(alterStatement);
        createdColumns.push(column.name);
        console.log(`✅ Created column: ${column.name}`);
      } catch (error) {
        console.error(`❌ Failed to create column ${column.name}:`, error);
      }
    }
    
    return createdColumns;
  }

  // Check and fix schema for a specific tenant
  async checkAndFixTenantSchema(tenant) {
    const { database_name } = tenant;
    console.log(`\n🔍 Checking schema for tenant: ${database_name}`);
    
    try {
      // Create connection to tenant database
      const sequelize = createTenantConnection(database_name);
      await sequelize.authenticate();
      console.log(`✅ Connected to tenant database: ${database_name}`);
      
      // Create models to get their definitions
      const Buyer = createBuyerModel(sequelize);
      const Invoice = createInvoiceModel(sequelize);
      const InvoiceItem = createInvoiceItemModel(sequelize);
      
      // Get model definitions
      const buyerDefinition = Buyer.rawAttributes;
      const invoiceDefinition = Invoice.rawAttributes;
      const invoiceItemDefinition = InvoiceItem.rawAttributes;
      
      // Check each table
      const tables = [
        { name: 'buyers', model: buyerDefinition, displayName: 'Buyers' },
        { name: 'invoices', model: invoiceDefinition, displayName: 'Invoices' },
        { name: 'invoice_items', model: invoiceItemDefinition, displayName: 'Invoice Items' }
      ];
      
      let totalMissingColumns = 0;
      let totalCreatedColumns = 0;
      
      for (const table of tables) {
        console.log(`\n📋 Checking table: ${table.displayName} (${table.name})`);
        
        // Get current database schema
        const dbSchema = await this.getTableSchema(sequelize, table.name);
        
        if (!dbSchema || dbSchema.length === 0) {
          console.log(`⚠️  Table ${table.name} doesn't exist or has no columns, skipping...`);
          continue;
        }
        
        console.log(`📋 Table ${table.name} schema:`, dbSchema.length, 'columns found');
        
        // Compare schema with model
        const missingColumns = this.compareSchemaWithModel(table.model, dbSchema);
        
        if (missingColumns.length === 0) {
          console.log(`✅ Table ${table.name} is up to date`);
        } else {
          console.log(`⚠️  Found ${missingColumns.length} missing columns in ${table.name}:`);
          missingColumns.forEach(col => {
            console.log(`   - ${col.name}: ${col.definition.type}`);
          });
          
          totalMissingColumns += missingColumns.length;
          
          // Create missing columns automatically
          console.log(`🔧 Automatically creating ${missingColumns.length} missing columns...`);
          const createdColumns = await this.createMissingColumns(sequelize, table.name, missingColumns);
          totalCreatedColumns += createdColumns.length;
          
          if (createdColumns.length > 0) {
            console.log(`✅ Successfully created ${createdColumns.length} columns in ${table.name}`);
          }
        }
      }
      
      // Store connection for cleanup
      this.tenantConnections.set(database_name, sequelize);
      
      console.log(`\n📊 Summary for ${database_name}:`);
      console.log(`   - Missing columns found: ${totalMissingColumns}`);
      console.log(`   - Columns created: ${totalCreatedColumns}`);
      
      return {
        tenant: database_name,
        missingColumns: totalMissingColumns,
        createdColumns: totalCreatedColumns
      };
      
    } catch (error) {
      console.error(`❌ Error checking schema for tenant ${database_name}:`, error);
      return {
        tenant: database_name,
        error: error.message
      };
    }
  }

  // Main method to check all tenants
  async checkAllTenants() {
    console.log('🚀 Starting database schema check for all tenants...\n');
    
    try {
      // Test master database connection
      await masterSequelize.authenticate();
      console.log('✅ Master database connection established');
      
      // Get all active tenants
      const tenants = await this.getAllTenants();
      
      if (tenants.length === 0) {
        console.log('ℹ️  No active tenants found');
        return;
      }
      
      console.log(`🔍 Will check ${tenants.length} tenant databases...`);
      const results = [];
      
      // Check each tenant
      for (const tenant of tenants) {
        try {
          console.log(`\n${'='.repeat(40)}`);
          console.log(`🔍 Processing tenant: ${tenant.database_name}`);
          console.log(`${'='.repeat(40)}`);
          
          const result = await this.checkAndFixTenantSchema(tenant);
          results.push(result);
        } catch (error) {
          console.error(`❌ Failed to process tenant ${tenant.database_name}:`, error);
          results.push({
            tenant: tenant.database_name,
            error: error.message
          });
        }
      }
      
      // Print summary
      console.log('\n' + '='.repeat(60));
      console.log('📋 FINAL SUMMARY');
      console.log('='.repeat(60));
      
      let totalMissing = 0;
      let totalCreated = 0;
      let errors = 0;
      
      results.forEach(result => {
        if (result.error) {
          console.log(`❌ ${result.tenant}: ERROR - ${result.error}`);
          errors++;
        } else {
          console.log(`✅ ${result.tenant}: ${result.missingColumns} missing, ${result.createdColumns} created`);
          totalMissing += result.missingColumns;
          totalCreated += result.createdColumns;
        }
      });
      
      console.log('\n' + '='.repeat(60));
      console.log(`📊 TOTAL: ${totalMissing} missing columns found, ${totalCreated} created, ${errors} errors`);
      console.log('='.repeat(60));
      
      // Auto-success message
      if (totalCreated > 0) {
        console.log('\n🎉 Schema update completed successfully!');
        console.log('✅ All missing columns have been automatically created.');
      } else if (totalMissing === 0) {
        console.log('\n🎉 All databases are already up to date!');
        console.log('✅ No schema changes were needed.');
      }
      
    } catch (error) {
      console.error('❌ Fatal error:', error);
      throw error;
    } finally {
      // Cleanup connections
      await this.cleanup();
    }
  }

  // Cleanup all connections
  async cleanup() {
    console.log('\n🧹 Cleaning up connections...');
    try {
      for (const [databaseName, sequelize] of this.tenantConnections) {
        await sequelize.close();
        console.log(`✅ Closed connection for ${databaseName}`);
      }
      
      await masterSequelize.close();
      console.log('✅ Closed master database connection');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }
}

// Standalone function for direct execution
async function checkAndCreateMissingColumns() {
  const checker = new DatabaseSchemaChecker();
  await checker.checkAllTenants();
}

// Export the class for use in other modules
export default DatabaseSchemaChecker;

// Auto-run only if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Auto-executing database schema check...\n');
  
  // Run the script automatically
  checkAndCreateMissingColumns()
    .then(() => {
      console.log('\n✅ Script execution completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });

  // Handle process termination gracefully
  process.on('SIGINT', async () => {
    console.log('\n⚠️  Received SIGINT, cleaning up...');
    try {
      await masterSequelize.close();
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n⚠️  Received SIGTERM, cleaning up...');
    try {
      await masterSequelize.close();
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
    process.exit(0);
  });
}
