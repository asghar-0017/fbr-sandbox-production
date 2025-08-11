# FBR API Integration - Auto Registration Type Filling

## Overview

This feature automatically fetches and fills the registration type when a user enters an NTN (National Tax Number) or CNIC (Computerized National Identity Card) in the buyer registration forms.

## Features

### 1. Automatic Registration Type Detection
- When a user enters an NTN/CNIC (minimum 13 characters), the system automatically calls the FBR API
- The registration type field is automatically populated based on the API response
- Visual feedback with loading spinner during API call

### 2. API Integration
- Uses the FBR API endpoint: `https://gw.fbr.gov.pk/dist/v1/Get_Reg_Type`
- POST request with Bearer token authentication
- Request body: `{ "Registration_No": "NTN_OR_CNIC" }`

### 3. Response Handling
- Success response: `{ "statuscode": "00", "REGISTRATION_NO": "4220181848433", "REGISTRATION_TYPE": "Registered" }`
- Error handling for various scenarios (invalid NTN, network errors, authentication failures)

## Implementation Details

### Files Modified

1. **FBRService.js** (`src/API/FBRService.js`)
   - Updated `checkRegistrationStatus` to use POST method
   - Added `getRegistrationType` function for auto-filling
   - Enhanced error handling

2. **RegisterUser.jsx** (`src/pages/RegisterUser.jsx`)
   - Added `handleNTNCNICChange` function
   - Auto-fetch registration type when NTN/CNIC length >= 13
   - Added loading spinner and success notifications
   - Updated UI with helpful placeholders

3. **BuyerModal.jsx** (`src/component/BuyerModal.jsx`)
   - Added same auto-fill functionality for modal form
   - Consistent user experience across components

### API Usage

```javascript
// Example API call
const result = await getRegistrationType("4220181848433");

if (result.success) {
  console.log("Registration Type:", result.registrationType);
  // Auto-fill the form field
  setFormData(prev => ({ 
    ...prev, 
    buyerRegistrationType: result.registrationType 
  }));
}
```

### User Experience

1. **Input Field**: User enters NTN/CNIC in the designated field
2. **Auto-Trigger**: When length reaches 13+ characters, API call is triggered
3. **Loading State**: Spinner appears in the input field
4. **Success**: Registration type field is automatically filled
5. **Notification**: Success message is shown to user
6. **Error Handling**: Errors are logged but don't interrupt user flow

## Configuration

### Required Environment
- Valid FBR API token in the tenant configuration
- Network access to FBR API endpoints
- Proper CORS configuration

### Token Management
The system uses the existing token management from `API_CONFIG.getCurrentToken("sandbox")` to authenticate with the FBR API.

## Error Scenarios

1. **Invalid NTN/CNIC**: API returns non-"00" status code
2. **Network Issues**: Connection timeouts or network errors
3. **Authentication**: Invalid or expired API token
4. **API Unavailable**: FBR service downtime

## Testing

A test component (`FBRTestComponent.jsx`) is available to verify the API integration:

```javascript
import FBRTestComponent from './component/FBRTestComponent';

// Use in your app for testing
<FBRTestComponent />
```

## Future Enhancements

1. **Caching**: Cache API responses to reduce redundant calls
2. **Batch Validation**: Validate multiple NTN/CNIC at once
3. **Offline Support**: Store recent lookups for offline access
4. **Rate Limiting**: Implement proper rate limiting for API calls

## Security Considerations

- API tokens are managed securely through the existing token system
- No sensitive data is logged or stored unnecessarily
- Error messages don't expose internal system details
- All API calls are made over HTTPS

## Troubleshooting

### Common Issues

1. **API Not Responding**
   - Check network connectivity
   - Verify FBR API status
   - Check token validity

2. **Auto-fill Not Working**
   - Ensure NTN/CNIC is at least 13 characters
   - Check browser console for errors
   - Verify API token is loaded

3. **Wrong Registration Type**
   - Verify NTN/CNIC is correct
   - Check FBR system for latest data
   - Contact FBR support if data seems incorrect
