import axios from 'axios';

// FBR API base URL
const FBR_BASE_URL = 'https://gw.fbr.gov.pk';

export const postData = async (endpoint, data, environment = 'sandbox', token = null) => {
  if (!token) {
    throw new Error(`No ${environment} token provided for FBR API calls`);
  }

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  try {
    const response = await axios.post(
      `${FBR_BASE_URL}/${endpoint}`,
      data,
      config
    );

    console.log('FBR API Response:', {
      endpoint,
      status: response.status,
      data: response.data,
      dataType: typeof response.data,
      dataLength: response.data ? response.data.length : 0,
      headers: response.headers
    });

    return response;
  } catch (error) {
    console.error('FBR API Error:', {
      endpoint,
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

export const fetchData = async (endpoint, environment = 'sandbox', token = null) => {
  if (!token) {
    throw new Error(`No ${environment} token provided for FBR API calls`);
  }

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    const response = await axios.get(
      `${FBR_BASE_URL}/${endpoint}`,
      config
    );

    console.log('FBR API Response:', {
      endpoint,
      status: response.status,
      data: response.data
    });

    return response.data;
  } catch (error) {
    console.error('FBR API Error:', {
      endpoint,
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
}; 