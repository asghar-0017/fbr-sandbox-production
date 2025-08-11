import Tenant from '../src/model/mysql/Tenant.js';
import { masterSequelize } from '../src/config/mysql.js';

async function activateAllTenants() {
  try {
    console.log('🔍 Checking for inactive tenants...');
    
    // Find all tenants
    const allTenants = await Tenant.findAll();
    console.log(`📊 Found ${allTenants.length} total tenants`);
    
    // Find inactive tenants
    const inactiveTenants = await Tenant.findAll({
      where: { is_active: false }
    });
    
    console.log(`❌ Found ${inactiveTenants.length} inactive tenants`);
    
    if (inactiveTenants.length > 0) {
      console.log('🔄 Activating all inactive tenants...');
      
      // Update all tenants to be active
      await Tenant.update(
        { is_active: true },
        { where: { is_active: false } }
      );
      
      console.log('✅ All tenants have been activated!');
    } else {
      console.log('✅ All tenants are already active!');
    }
    
    // Show final status
    const activeTenants = await Tenant.findAll({
      where: { is_active: true }
    });
    
    console.log(`📈 Final count: ${activeTenants.length} active tenants`);
    
    // Close database connection
    await masterSequelize.close();
    console.log('🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error activating tenants:', error);
    process.exit(1);
  }
}

// Run the script
activateAllTenants(); 