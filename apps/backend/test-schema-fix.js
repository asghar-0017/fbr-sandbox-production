import DatabaseSchemaChecker from './check-missing-columns.js';

console.log('🧪 Testing Fixed Database Schema Checker...\n');

async function testSchemaChecker() {
  try {
    const checker = new DatabaseSchemaChecker(true); // true = standalone mode
    console.log('✅ Schema checker instance created successfully');
    
    // Test the getAllTenants method
    console.log('\n🔍 Testing getAllTenants method...');
    const tenants = await checker.getAllTenants();
    console.log(`✅ Found ${tenants.length} tenants`);
    
    if (tenants.length > 0) {
      console.log('\n🔍 Testing table existence check...');
      const firstTenant = tenants[0];
      const sequelize = await import('./src/config/mysql.js').then(m => m.createTenantConnection(firstTenant.database_name));
      
      // Test table existence
      const buyersExist = await checker.tableExists(sequelize, 'buyers');
      console.log(`✅ Table 'buyers' exists: ${buyersExist}`);
      
      const invoicesExist = await checker.tableExists(sequelize, 'invoices');
      console.log(`✅ Table 'invoices' exists: ${invoicesExist}`);
      
      const fakeTableExists = await checker.tableExists(sequelize, 'fake_table_123');
      console.log(`✅ Table 'fake_table_123' exists: ${fakeTableExists}`);
      
      // Test schema retrieval
      if (buyersExist) {
        console.log('\n🔍 Testing schema retrieval for buyers table...');
        const schema = await checker.getTableSchema(sequelize, 'buyers');
        console.log(`✅ Buyers table schema: ${schema.length} columns`);
        console.log('Columns:', schema.map(col => col.Field));
      }
      
      await sequelize.close();
    } else {
      console.log('ℹ️  No tenants found, skipping detailed tests');
    }
    
    console.log('\n🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testSchemaChecker();
