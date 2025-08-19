import { createTenantConnection } from './src/config/mysql.js';
import { createBuyerModel } from './src/model/mysql/tenant/Buyer.js';
import { createInvoiceModel } from './src/model/mysql/tenant/Invoice.js';
import { createInvoiceItemModel } from './src/model/mysql/tenant/InvoiceItem.js';
import Tenant from './src/model/mysql/Tenant.js';
import { masterSequelize } from './src/config/mysql.js';
import dotenv from 'dotenv';

dotenv.config();

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

  // Get current database schema for a table
  async getTableSchema(sequelize, tableName) {
    try {
      const [results] = await sequelize.query(
        `DESCRIBE \`${tableName}\``,
        { type: 'SELECT' }
      );
      return results;
    } catch (error) {
      console.error(`❌ Error getting schema for table ${tableName}:`, error);
      return [];
    }
  }

  // Compare model definition with database schema
  compareSchemaWithModel(modelDefinition, dbSchema) {
    const missingColumns = [];
    const dbColumns = new Set(dbSchema.map(col => col.Field));

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
        
        if (dbSchema.length === 0) {
          console.log(`⚠️  Table ${table.name} doesn't exist, skipping...`);
          continue;
        }
        
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
          
          // Create missing columns
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
      
      const results = [];
      
      // Check each tenant
      for (const tenant of tenants) {
        const result = await this.checkAndFixTenantSchema(tenant);
        results.push(result);
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
      
    } catch (error) {
      console.error('❌ Fatal error:', error);
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
      this.tenantConnections.clear();
      
      await masterSequelize.close();
      console.log('✅ Closed master database connection');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }
}

// Run the script
async function main() {
  const checker = new DatabaseSchemaChecker();
  
  try {
    await checker.checkAllTenants();
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⚠️  Received SIGINT, cleaning up...');
  const checker = new DatabaseSchemaChecker();
  await checker.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Received SIGTERM, cleaning up...');
  const checker = new DatabaseSchemaChecker();
  await checker.cleanup();
  process.exit(0);
});

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default DatabaseSchemaChecker;
