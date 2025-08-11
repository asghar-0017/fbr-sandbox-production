import { masterSequelize } from './src/config/mysql.js';
import Tenant from './src/model/mysql/Tenant.js';

async function checkTenants() {
  try {
    await masterSequelize.authenticate();
    console.log('Database connected.');
    
    const tenants = await Tenant.findAll({ 
      where: { is_active: true },
      raw: true 
    });
    
    console.log('Tenants found:', tenants.length);
    console.log('Tenant data:', JSON.stringify(tenants, null, 2));
    
    await masterSequelize.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTenants(); 