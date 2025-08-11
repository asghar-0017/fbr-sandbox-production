// Simple script to test backend connectivity
const https = require("https");

const testBackend = async () => {
  const baseUrl = "https://fbrtestcase.inplsoftwares.online";

  console.log("Testing backend connectivity...");
  console.log("Base URL:", baseUrl);

  // Test basic connectivity
  try {
    console.log("\n1. Testing basic connectivity...");
    const response = await fetch(`${baseUrl}/api/health`);
    console.log("Health check status:", response.status);
    const text = await response.text();
    console.log("Response:", text.substring(0, 200));
  } catch (error) {
    console.error("Health check failed:", error.message);
  }

  // Test HS codes endpoint
  try {
    console.log("\n2. Testing HS codes endpoint...");
    const response = await fetch(
      `${baseUrl}/api/hs-codes?environment=sandbox&forceRefresh=false`
    );
    console.log("HS codes endpoint status:", response.status);
    const text = await response.text();
    console.log("Response:", text.substring(0, 200));
  } catch (error) {
    console.error("HS codes endpoint failed:", error.message);
  }

  // Test with a dummy token
  try {
    console.log("\n3. Testing HS codes endpoint with dummy token...");
    const response = await fetch(
      `${baseUrl}/api/hs-codes?environment=sandbox&forceRefresh=false`,
      {
        headers: {
          Authorization: "Bearer dummy-token",
          "Content-Type": "application/json",
        },
      }
    );
    console.log("HS codes endpoint with token status:", response.status);
    const text = await response.text();
    console.log("Response:", text.substring(0, 200));
  } catch (error) {
    console.error("HS codes endpoint with token failed:", error.message);
  }
};

testBackend().catch(console.error);
