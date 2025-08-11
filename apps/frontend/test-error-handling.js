// Test file to demonstrate enhanced FBR API error handling
// This file shows how the error handling works for different types of FBR API errors

// Example FBR API error responses that the enhanced error handling can process:

// 1. Validation Error with item-specific details
const validationErrorExample = {
  status: 200,
  data: {
    validationResponse: {
      statusCode: "01",
      error: "Invoice validation failed",
      invoiceStatuses: [
        {
          itemSNo: 1,
          error: "Invalid HS Code for item 1",
        },
        {
          itemSNo: 2,
          error: "Quantity must be greater than 0",
        },
      ],
    },
  },
};

// 2. Simple validation error
const simpleValidationError = {
  status: 200,
  data: {
    validationResponse: {
      statusCode: "01",
      error: "Seller NTN/CNIC is invalid",
    },
  },
};

// 3. Direct error response
const directErrorResponse = {
  status: 400,
  data: {
    error: "Invalid invoice data format",
    message: "Please check your invoice structure",
  },
};

// 4. Network error
const networkError = {
  code: "ERR_NETWORK",
  message: "Network Error",
};

// 5. Timeout error
const timeoutError = {
  code: "ECONNABORTED",
  message: "Request timeout",
};

// Function to simulate error processing (similar to what's implemented in the forms)
function processFBRError(error) {
  let errorTitle = "Error";
  let errorMessage = "Failed to process FBR request";
  let errorDetails = [];

  // Check if it's a validation error from FBR
  const errorResponse = error.response?.data;

  if (errorResponse) {
    // Handle FBR API validation errors
    const fbrError =
      errorResponse?.validationResponse?.error ||
      errorResponse?.error ||
      errorResponse?.message;

    if (fbrError) {
      errorTitle = "FBR Validation Error";
      errorMessage = fbrError;

      // Check for item-specific errors in validation response
      if (errorResponse.validationResponse?.invoiceStatuses) {
        errorResponse.validationResponse.invoiceStatuses.forEach(
          (status, index) => {
            if (status.error) {
              errorDetails.push(`Item ${index + 1}: ${status.error}`);
            }
          }
        );
      }
    } else {
      // Handle other API response errors
      if (errorResponse.errors && Array.isArray(errorResponse.errors)) {
        errorDetails = errorResponse.errors;
      } else if (errorResponse.message) {
        errorMessage = errorResponse.message;
      }
    }
  } else {
    // Handle network and other errors
    if (error.code === "ECONNABORTED") {
      errorTitle = "Request Timeout";
      errorMessage = "FBR API request timed out. Please try again.";
    } else if (error.code === "ERR_NETWORK") {
      errorTitle = "Network Error";
      errorMessage =
        "Unable to connect to FBR API. Please check your internet connection.";
    } else if (error.message) {
      errorMessage = error.message;
    }
  }

  // Combine error message with details
  const fullErrorMessage =
    errorDetails.length > 0
      ? `${errorMessage}\n\nDetails:\n${errorDetails.join("\n")}`
      : errorMessage;

  return {
    title: errorTitle,
    message: fullErrorMessage,
    hasDetails: errorDetails.length > 0,
  };
}

// Test the error processing function
console.log("=== Testing Enhanced FBR Error Handling ===");

console.log("\n1. Validation Error with Item Details:");
const result1 = processFBRError({ response: validationErrorExample });
console.log("Title:", result1.title);
console.log("Message:", result1.message);
console.log("Has Details:", result1.hasDetails);

console.log("\n2. Simple Validation Error:");
const result2 = processFBRError({ response: simpleValidationError });
console.log("Title:", result2.title);
console.log("Message:", result2.message);
console.log("Has Details:", result2.hasDetails);

console.log("\n3. Direct Error Response:");
const result3 = processFBRError({ response: directErrorResponse });
console.log("Title:", result3.title);
console.log("Message:", result3.message);
console.log("Has Details:", result3.hasDetails);

console.log("\n4. Network Error:");
const result4 = processFBRError(networkError);
console.log("Title:", result4.title);
console.log("Message:", result4.message);
console.log("Has Details:", result4.hasDetails);

console.log("\n5. Timeout Error:");
const result5 = processFBRError(timeoutError);
console.log("Title:", result5.title);
console.log("Message:", result5.message);
console.log("Has Details:", result5.hasDetails);

console.log("\n=== Error Handling Test Complete ===");

// Export for use in other files if needed
export { processFBRError };
