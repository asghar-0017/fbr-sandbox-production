import { masterSequelize } from './src/config/mysql.js';
import dotenv from 'dotenv';

dotenv.config();

const cleanupIndexes = async () => {
  try {
    console.log('🔧 Starting index cleanup...');
    
    // Test connection
    await masterSequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Get all indexes on the tenants table
    const [indexes] = await masterSequelize.query(`
      SHOW INDEX FROM tenants
    `);
    
    console.log('📋 Current indexes on tenants table:');
    indexes.forEach(index => {
      console.log(`  - ${index.Key_name} (${index.Column_name})`);
    });
    
    // Remove some unnecessary indexes to make room
    const indexesToRemove = [
      'idx_tenants_created_at',
      'idx_tenants_updated_at'
    ];
    
    for (const indexName of indexesToRemove) {
      try {
        await masterSequelize.query(`
          DROP INDEX ${indexName} ON tenants
        `);
        console.log(`✅ Removed index: ${indexName}`);
      } catch (error) {
        console.log(`⚠️ Could not remove index ${indexName}: ${error.message}`);
      }
    }
    
    // Now try to add the unique constraint
    try {
      await masterSequelize.query(`
        ALTER TABLE tenants 
        ADD UNIQUE KEY unique_seller_ntn_cnic (sellerNTNCNIC)
      `);
      console.log('✅ Unique constraint added successfully');
    } catch (error) {
      console.log('⚠️ Still could not add unique constraint:', error.message);
    }
    
    console.log('🎉 Index cleanup completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error cleaning up indexes:', error);
    process.exit(1);
  }
};

cleanupIndexes(); 