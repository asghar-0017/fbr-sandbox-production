import axios from 'axios';

const testTransactionTypesAPI = async () => {
  try {
    console.log('🧪 Testing Transaction Types API...');
    
    const baseURL = 'http://localhost:5151';
    
    // Test 1: Tenant with FBR credentials
    console.log('\n📋 Test 1: Tenant with FBR credentials');
    const tenantWithCredentials = 'test-tenant-1';
    const authToken = 'test-token';
    
    const response1 = await axios.get(`${baseURL}/api/tenant/${tenantWithCredentials}/transaction-types`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API Response Status:', response1.status);
    console.log('✅ Is Fallback:', response1.data.isFallback);
    console.log('✅ Message:', response1.data.message);
    
    // Test 2: Tenant without FBR credentials
    console.log('\n📋 Test 2: Tenant without FBR credentials');
    const tenantWithoutCredentials = 'test-tenant-3'; // This tenant doesn't exist in mock data
    
    const response2 = await axios.get(`${baseURL}/api/tenant/${tenantWithoutCredentials}/transaction-types`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API Response Status:', response2.status);
    console.log('✅ Is Fallback:', response2.data.isFallback);
    console.log('✅ Message:', response2.data.message);
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`   Test 1 (with credentials): ${response1.data.isFallback ? 'Fallback' : 'FBR Data'}`);
    console.log(`   Test 2 (without credentials): ${response2.data.isFallback ? 'Fallback' : 'FBR Data'}`);
    
    if (response1.data.success && response2.data.success) {
      console.log('✅ Both tests passed successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    
    if (error.response) {
      console.error('❌ Response Status:', error.response.status);
      console.error('❌ Response Data:', error.response.data);
    }
  }
};

// Run the test
testTransactionTypesAPI();
