import DatabaseSchemaChecker from './check-missing-columns.js';

console.log('🧪 Testing Database Schema Checker...\n');

async function testSchemaChecker() {
  try {
    const checker = new DatabaseSchemaChecker(true); // true = standalone mode
    console.log('✅ Schema checker instance created successfully');
    
    // Test the getAllTenants method
    console.log('\n🔍 Testing getAllTenants method...');
    const tenants = await checker.getAllTenants();
    console.log(`✅ Found ${tenants.length} tenants`);
    
    if (tenants.length > 0) {
      console.log('\n🔍 Testing checkAllTenants method...');
      await checker.checkAllTenants();
      console.log('✅ Schema check completed successfully');
    } else {
      console.log('ℹ️  No tenants found, skipping schema check');
    }
    
    console.log('\n🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSchemaChecker();
