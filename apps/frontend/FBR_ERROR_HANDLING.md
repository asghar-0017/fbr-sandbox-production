# Enhanced FBR API Error Handling

## Overview

This document describes the enhanced error handling implemented for FBR API calls, specifically for the "Save and Validate" button functionality. The implementation provides detailed error information from FBR API responses to help users understand and resolve validation issues.

## Features

### 1. Comprehensive Error Capture

- **FBR Validation Errors**: Captures and displays validation errors from FBR API responses
- **Item-Specific Errors**: Shows detailed errors for individual invoice items
- **Network Errors**: Handles connection issues and timeouts
- **Authentication Errors**: Manages token and authentication failures

### 2. Enhanced Error Display

- **Wider Popup**: Error messages are displayed in a wider popup (600px) for better readability
- **Formatted Text**: Error details are formatted with proper line breaks and monospace font
- **Categorized Errors**: Different error types have appropriate titles and descriptions

### 3. Detailed Error Information

- **Main Error Message**: Primary error description from FBR
- **Item Details**: Specific errors for each invoice item (if applicable)
- **Technical Details**: Additional error information for debugging

## Implementation Details

### Files Modified

#### 1. `apps/frontend/src/pages/createInvoiceForm.jsx`

- Enhanced `handleSaveAndValidate` function
- Improved error handling for both validation and network errors
- Better error message formatting and display

#### 2. `apps/frontend/src/pages/productionForm.jsx`

- Enhanced validation error handling
- Improved post-submission error handling
- Consistent error display across both forms

#### 3. `apps/frontend/src/API/GetApi.jsx`

- Enhanced error logging for debugging
- Better error response structure analysis
- Improved error categorization

#### 4. `apps/frontend/src/App.css`

- Added CSS for wider error popups
- Improved text formatting for error messages

### Error Types Handled

#### 1. FBR Validation Errors

```javascript
// Example FBR validation error response
{
  status: 200,
  data: {
    validationResponse: {
      statusCode: "01",
      error: "Invoice validation failed",
      invoiceStatuses: [
        {
          itemSNo: 1,
          error: "Invalid HS Code for item 1"
        }
      ]
    }
  }
}
```

#### 2. Network Errors

```javascript
// Network connection error
{
  code: "ERR_NETWORK",
  message: "Network Error"
}
```

#### 3. Timeout Errors

```javascript
// Request timeout error
{
  code: "ECONNABORTED",
  message: "Request timeout"
}
```

#### 4. Authentication Errors

```javascript
// Authentication failure
{
  response: {
    status: 401,
    data: {
      error: "Authentication failed"
    }
  }
}
```

## Usage

### Save and Validate Button

When users click the "Save & Validate" button:

1. **Form Validation**: Basic form validation is performed
2. **FBR API Call**: Invoice data is sent to FBR for validation
3. **Error Processing**: Any errors from FBR are captured and processed
4. **Error Display**: Detailed error information is shown to the user

### Error Display Format

```
FBR Validation Failed

Details:
Item 1: Invalid HS Code for item 1
Item 2: Quantity must be greater than 0
```

## Error Handling Flow

### 1. Validation Phase

```javascript
// FBR validation API call
const validateRes = await postData(
  "di_data/v1/di/validateinvoicedata",
  cleanedData,
  "sandbox"
);

// Process validation response
if (isSuccess) {
  // Continue with save operation
} else {
  // Display detailed error information
}
```

### 2. Error Processing

```javascript
// Extract error information
let errorMessage = "Invoice validation failed.";
let errorDetails = [];

if (hasValidationResponse) {
  const validation = validateRes.data.validationResponse;
  if (validation.error) {
    errorMessage = validation.error;
  }
  // Process item-specific errors
  if (validation.invoiceStatuses) {
    validation.invoiceStatuses.forEach((status, index) => {
      if (status.error) {
        errorDetails.push(`Item ${index + 1}: ${status.error}`);
      }
    });
  }
}
```

### 3. Error Display

```javascript
// Combine and display error information
const fullErrorMessage =
  errorDetails.length > 0
    ? `${errorMessage}\n\nDetails:\n${errorDetails.join("\n")}`
    : errorMessage;

Swal.fire({
  icon: "error",
  title: "FBR Validation Failed",
  text: fullErrorMessage,
  confirmButtonColor: "#d33",
  width: "600px",
  customClass: {
    popup: "swal-wide",
  },
});
```

## Benefits

### 1. User Experience

- **Clear Error Messages**: Users understand exactly what went wrong
- **Actionable Information**: Specific guidance on how to fix issues
- **Professional Display**: Clean, formatted error presentation

### 2. Development Experience

- **Better Debugging**: Enhanced error logging for troubleshooting
- **Consistent Handling**: Uniform error processing across forms
- **Maintainable Code**: Well-structured error handling logic

### 3. Support Experience

- **Detailed Error Information**: Support teams can better assist users
- **Error Categorization**: Different error types are clearly identified
- **Reproducible Issues**: Better error context for issue resolution

## Testing

A test file `test-error-handling.js` is provided to demonstrate the error handling functionality with various error scenarios:

- Validation errors with item details
- Simple validation errors
- Direct error responses
- Network errors
- Timeout errors

Run the test file to see how different error types are processed and displayed.

## Future Enhancements

1. **Error Categorization**: Group similar errors for better organization
2. **Error Suggestions**: Provide suggestions for fixing common errors
3. **Error History**: Track and display error history for debugging
4. **Localization**: Support for multiple languages in error messages
5. **Error Analytics**: Collect error data for improving the system

## Troubleshooting

### Common Issues

1. **Error Not Displaying**: Check browser console for JavaScript errors
2. **Incomplete Error Information**: Verify FBR API response structure
3. **Styling Issues**: Ensure CSS classes are properly loaded

### Debug Steps

1. Check browser console for error logs
2. Verify FBR API response structure
3. Test with different error scenarios
4. Validate CSS styling for error popups
