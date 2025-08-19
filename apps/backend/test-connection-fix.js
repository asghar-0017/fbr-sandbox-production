import DatabaseSchemaChecker from './check-missing-columns.js';
import { masterSequelize } from './src/config/mysql.js';

console.log('🧪 Testing Connection Fix...\n');

async function testConnectionFix() {
  try {
    console.log('1️⃣ Testing master connection...');
    await masterSequelize.authenticate();
    console.log('✅ Master connection is working');
    
    console.log('\n2️⃣ Testing schema checker in app mode (should not close master connection)...');
    const appChecker = new DatabaseSchemaChecker(false); // false = not standalone
    
    // Simulate what happens in the main app
    await appChecker.checkAllTenants();
    
    console.log('\n3️⃣ Testing master connection after schema check...');
    await masterSequelize.authenticate();
    console.log('✅ Master connection still working after schema check');
    
    console.log('\n4️⃣ Testing schema checker in standalone mode (should close master connection)...');
    const standaloneChecker = new DatabaseSchemaChecker(true); // true = standalone
    
    try {
      await standaloneChecker.checkAllTenants();
      
      console.log('\n5️⃣ Testing master connection after standalone schema check...');
      await masterSequelize.authenticate();
      console.log('❌ Master connection should be closed but is still working');
    } catch (error) {
      if (error.message.includes('ConnectionManager.getConnection was called after the connection manager was closed')) {
        console.log('✅ Master connection properly closed in standalone mode');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    console.log('\n🎉 Connection fix test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testConnectionFix();
