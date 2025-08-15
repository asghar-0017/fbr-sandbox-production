import axios from 'axios';

// Test the new transaction types API endpoint
const testTransactionTypesAPI = async () => {
  try {
    console.log('Testing Transaction Types API...');
    
    // You'll need to replace these with actual values from your system
    const baseURL = 'http://localhost:3000'; // Adjust port if different
    const tenantId = 'your_tenant_id_here'; // Replace with actual tenant ID
    const authToken = 'your_auth_token_here'; // Replace with actual auth token
    
    console.log('Base URL:', baseURL);
    console.log('Tenant ID:', tenantId);
    console.log('Auth Token:', authToken ? 'Available' : 'Not available');
    
    if (!tenantId || tenantId === 'your_tenant_id_here') {
      console.error('Please update the tenantId in this test file');
      return;
    }
    
    if (!authToken || authToken === 'your_auth_token_here') {
      console.error('Please update the authToken in this test file');
      return;
    }
    
    const response = await axios.get(`${baseURL}/api/tenant/${tenantId}/transaction-types`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ API Response Data:', response.data);
    
    if (response.data.success) {
      console.log('✅ Transaction Types fetched successfully!');
      console.log('✅ Count:', Array.isArray(response.data.data) ? response.data.data.length : 'Not an array');
      
      if (Array.isArray(response.data.data) && response.data.data.length > 0) {
        console.log('✅ Sample Transaction Type:', response.data.data[0]);
      }
    } else {
      console.log('❌ API returned success: false');
      console.log('❌ Message:', response.data.message);
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
