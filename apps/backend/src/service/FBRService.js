import axios from "axios";

// FBR API base URL
const FBR_BASE_URL = "https://gw.fbr.gov.pk";

export const postData = async (
  endpoint,
  data,
  environment = "sandbox",
  token = null
) => {
  if (!token) {
    throw new Error(`No ${environment} token provided for FBR API calls`);
  }

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  try {
    const response = await axios.post(
      `${FBR_BASE_URL}/${endpoint}`,
      data,
      config
    );

    console.log("FBR API Response:", {
      endpoint,
      status: response.status,
      data: response.data,
      dataType: typeof response.data,
      dataLength: response.data ? response.data.length : 0,
      headers: response.headers,
    });

    return response;
  } catch (error) {
    console.error("FBR API Error:", {
      endpoint,
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

export const fetchData = async (
  endpoint,
  environment = "sandbox",
  token = null
) => {
  if (!token) {
    throw new Error(`No ${environment} token provided for FBR API calls`);
  }

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    const response = await axios.get(`${FBR_BASE_URL}/${endpoint}`, config);

    console.log("FBR API Response:", {
      endpoint,
      status: response.status,
      data: response.data,
    });

    return response.data;
  } catch (error) {
    console.error("FBR API Error:", {
      endpoint,
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

// New function to fetch document types from FBR
export const getDocumentTypes = async (environment = "sandbox", token = null) => {
  if (!token) {
    throw new Error(`No ${environment} token provided for FBR API calls`);
  }

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    const response = await axios.get(`${FBR_BASE_URL}/pdi/v1/doctypecode`, config);

    console.log("FBR Document Types API Response:", {
      endpoint: "pdi/v1/doctypecode",
      status: response.status,
      data: response.data,
    });

    return response.data;
  } catch (error) {
    console.error("FBR Document Types API Error:", {
      endpoint: "pdi/v1/doctypecode",
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

// New function to fetch provinces from FBR
export const getProvinces = async (environment = "sandbox", token = null) => {
  if (!token) {
    throw new Error(`No ${environment} token provided for FBR API calls`);
  }

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    const response = await axios.get(`${FBR_BASE_URL}/pdi/v1/provinces`, config);

    console.log("FBR Provinces API Response:", {
      endpoint: "pdi/v1/provinces",
      status: response.status,
      data: response.data,
    });

    return response.data;
  } catch (error) {
    console.error("FBR Provinces API Error:", {
      endpoint: "pdi/v1/provinces",
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

// New function to validate invoice data with FBR
export const validateInvoiceData = async (invoiceData, environment = "sandbox", token = null) => {
  if (!token) {
    throw new Error(`No ${environment} token provided for FBR API calls`);
  }

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  try {
    const response = await axios.post(
      `${FBR_BASE_URL}/pdi/v1/di_data/v1/di/validateinvoicedata`,
      invoiceData,
      config
    );

    console.log("FBR Invoice Validation API Response:", {
      endpoint: "pdi/v1/di_data/v1/di/validateinvoicedata",
      status: response.status,
      data: response.data,
    });

    return response.data;
  } catch (error) {
    console.error("FBR Invoice Validation API Error:", {
      endpoint: "pdi/v1/di_data/v1/di/validateinvoicedata",
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

// New function to submit invoice data to FBR
export const submitInvoiceData = async (invoiceData, environment = "sandbox", token = null) => {
  if (!token) {
    throw new Error(`No ${environment} token provided for FBR API calls`);
  }

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  try {
    const response = await axios.post(
      `${FBR_BASE_URL}/pdi/v1/di_data/v1/di/postinvoicedata`,
      invoiceData,
      config
    );

    console.log("FBR Invoice Submission API Response:", {
      endpoint: "pdi/v1/di_data/v1/di/postinvoicedata",
      status: response.status,
      data: response.data,
    });

    return response.data;
  } catch (error) {
    console.error("FBR Invoice Submission API Error:", {
      endpoint: "pdi/v1/di_data/v1/di/postinvoicedata",
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};
