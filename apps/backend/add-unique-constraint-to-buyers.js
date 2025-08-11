import mysql from 'mysql2/promise';
import Tenant from './src/model/mysql/Tenant.js';
import config from './src/config/index.js';

// Migration script to add unique constraint to buyerNTNCNIC field
async function addUniqueConstraintToBuyers() {
  try {
    console.log('Starting migration: Adding unique constraint to buyerNTNCNIC field...');
    
    // Get all tenants
    const tenants = await Tenant.findAll();
    console.log(`Found ${tenants.length} tenants to migrate`);
    
    for (const tenant of tenants) {
      try {
        console.log(`Processing tenant: ${tenant.seller_ntn_cnic} (${tenant.database_name})`);
        
        // Connect to tenant's database
        const connection = await mysql.createConnection({
          host: config.mysql.host,
          user: config.mysql.user,
          password: config.mysql.password,
          database: tenant.database_name
        });
        
        // Check if unique constraint already exists
        const [constraints] = await connection.execute(`
          SELECT CONSTRAINT_NAME 
          FROM information_schema.TABLE_CONSTRAINTS 
          WHERE TABLE_SCHEMA = ? 
          AND TABLE_NAME = 'buyers' 
          AND CONSTRAINT_TYPE = 'UNIQUE' 
          AND CONSTRAINT_NAME LIKE '%buyerNTNCNIC%'
        `, [tenant.database_name]);
        
        if (constraints.length > 0) {
          console.log(`  Unique constraint already exists for ${tenant.database_name}`);
          await connection.end();
          continue;
        }
        
        // Check for duplicate NTN values before adding constraint
        const [duplicates] = await connection.execute(`
          SELECT buyerNTNCNIC, COUNT(*) as count 
          FROM buyers 
          WHERE buyerNTNCNIC IS NOT NULL AND buyerNTNCNIC != '' 
          GROUP BY buyerNTNCNIC 
          HAVING COUNT(*) > 1
        `);
        
        if (duplicates.length > 0) {
          console.log(`  WARNING: Found duplicate NTN values in ${tenant.database_name}:`);
          duplicates.forEach(dup => {
            console.log(`    NTN: ${dup.buyerNTNCNIC} - Count: ${dup.count}`);
          });
          console.log(`  Skipping unique constraint for ${tenant.database_name} due to duplicates`);
          await connection.end();
          continue;
        }
        
        // Add unique constraint
        await connection.execute(`
          ALTER TABLE buyers 
          ADD CONSTRAINT uk_buyer_ntn_cnic UNIQUE (buyerNTNCNIC)
        `);
        
        console.log(`  Successfully added unique constraint to ${tenant.database_name}`);
        await connection.end();
        
      } catch (error) {
        console.error(`  Error processing tenant ${tenant.seller_ntn_cnic}:`, error.message);
        continue;
      }
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addUniqueConstraintToBuyers()
    .then(() => {
      console.log('Migration script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

export default addUniqueConstraintToBuyers; 