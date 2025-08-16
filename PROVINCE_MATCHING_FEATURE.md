# Province Matching Feature for FBR Integration

## Overview

This feature automatically matches a seller's province with the FBR (Federal Board of Revenue) province list and uses the corresponding `stateProvinceCode` for rate selection API calls. This eliminates the need for manual province selection and ensures accurate rate fetching based on the seller's actual location.

## How It Works

### 1. Province Matching Logic

The system automatically:
- Fetches provinces from the FBR API (`https://gw.fbr.gov.pk/pdi/v1/provinces`)
- Matches the seller's province with the FBR province list
- Returns the matching `stateProvinceCode` for use in rate selection

### 2. Smart Matching Algorithm

The matching algorithm handles various scenarios:

#### Exact Matches
- "SINDH" → matches "SINDH" (code: 8)
- "PUNJAB" → matches "PUNJAB" (code: 7)

#### Case Variations
- "sindh" → matches "SINDH"
- "Punjab" → matches "PUNJAB"

#### Common Variations
- "SINDH PROVINCE" → matches "SINDH"
- "KPK" → matches "KHYBER PAKHTUNKHWA"
- "FEDERAL" → matches "CAPITAL TERRITORY"
- "AJK" → matches "AZAD JAMMU AND KASHMIR"

#### Fuzzy Matching
- Partial matches and close variations are automatically detected

### 3. Rate Selection Integration

Once the province code is determined:
- The system automatically calls the rate selection API
- Uses the correct `stateProvinceCode` in the `originationSupplier` parameter
- Falls back to manual province selection if seller province matching fails

## API Endpoints Used

### 1. Provinces API
```
GET https://gw.fbr.gov.pk/pdi/v1/provinces
```

**Response Format:**
```json
[
  {
    "stateProvinceCode": 7,
    "stateProvinceDesc": "PUNJAB"
  },
  {
    "stateProvinceCode": 8,
    "stateProvinceDesc": "SINDH"
  }
]
```

### 2. Rate Selection API
```
GET https://gw.fbr.gov.pk/pdi/v2/SaleTypeToRate?date=24-Feb-2024&transTypeId={transactionTypeId}&originationSupplier={stateProvinceCode}
```

## Implementation Details

### 1. Core Utility Functions

#### `getSellerProvinceCode(sellerProvince, environment)`
- Takes a seller's province string
- Returns the matching FBR `stateProvinceCode`
- Handles caching and error fallbacks

#### `getRatesForSellerProvince(sellerProvince, transactionTypeId, environment)`
- Combines province matching with rate fetching
- Automatically determines the correct province code
- Returns rates for the seller's province

#### `findMatchingProvince(sellerProvince, provinces)`
- Core matching algorithm
- Handles exact, case-insensitive, and fuzzy matching
- Supports common variations and abbreviations

### 2. Caching Strategy

- Provinces are cached in localStorage for 60 minutes
- Reduces API calls and improves performance
- Automatic fallback to cached data if API fails

### 3. Error Handling

- Graceful fallback to manual province selection
- Comprehensive error logging for debugging
- User-friendly error messages

## Usage Examples

### 1. Basic Province Matching

```javascript
import { getSellerProvinceCode } from '../utils/provinceMatcher';

// Get province code for seller
const provinceCode = await getSellerProvinceCode("SINDH");
console.log(provinceCode); // Output: 8
```

### 2. Rate Fetching with Seller Province

```javascript
import { getRatesForSellerProvince } from '../utils/provinceMatcher';

// Automatically fetch rates for seller's province
const rates = await getRatesForSellerProvince("SINDH", "80");
console.log(rates); // Array of rates for SINDH province
```

### 3. Integration in RateSelector Component

```jsx
<RateSelector
  index={index}
  item={item}
  handleItemChange={handleItemChange}
  transactionTypeId={formData.transactionTypeId}
  selectedProvince={formData.sellerProvince}
  sellerProvince={formData.sellerProvince} // New prop
/>
```

## Supported Provinces

| Province Name | FBR Code | Common Variations |
|---------------|----------|-------------------|
| SINDH | 8 | SINDH, SINDH PROVINCE, SINDH PROV |
| PUNJAB | 7 | PUNJAB, PUNJAB PROVINCE, PUNJAB PROV |
| KHYBER PAKHTUNKHWA | 9 | KPK, KHYBER PAKHTUNKHWA PROVINCE |
| BALOCHISTAN | 6 | BALOCHISTAN, BALOCHISTAN PROVINCE |
| CAPITAL TERRITORY | 5 | FEDERAL, ISLAMABAD, FEDERAL TERRITORY |
| GILGIT BALTISTAN | 10 | GB, GILGIT BALTISTAN PROVINCE |
| AZAD JAMMU AND KASHMIR | 11 | AJK, AZAD JAMMU & KASHMIR |

## Testing

### 1. Test Component

Use the `ProvinceMatcherTest` component to test the functionality:

```jsx
import ProvinceMatcherTest from '../component/ProvinceMatcherTest';

// Add to your page for testing
<ProvinceMatcherTest />
```

### 2. Manual Testing

Test with various province inputs:
- "SINDH" → should return code 8
- "sindh" → should return code 8
- "SINDH PROVINCE" → should return code 8
- "KPK" → should return code 9

## Benefits

### 1. Automation
- No manual province selection required
- Automatic rate fetching based on seller location
- Reduced user errors

### 2. Accuracy
- Ensures correct province codes are used
- Eliminates mismatched province/rate combinations
- Consistent with FBR system

### 3. User Experience
- Seamless integration with existing forms
- Fallback to manual selection if needed
- Clear error messages and feedback

### 4. Performance
- Intelligent caching reduces API calls
- Fast province matching algorithm
- Efficient rate fetching

## Configuration

### 1. Environment Variables

The system automatically detects the environment:
- Development: Uses sandbox tokens
- Production: Uses production tokens

### 2. Cache Settings

Default cache expiry: 60 minutes
```javascript
// Customize cache duration
const provinces = await getProvinces("sandbox", 120); // 2 hours
```

### 3. Token Management

Automatically uses the appropriate token from:
- Tenant context
- localStorage fallback
- Environment detection

## Troubleshooting

### 1. Common Issues

#### Province Not Found
- Check if the province name is in the supported list
- Verify spelling and case sensitivity
- Check browser console for detailed error logs

#### Rate Fetching Fails
- Ensure transaction type ID is valid
- Check if FBR API is accessible
- Verify token validity and permissions

#### Cache Issues
- Clear localStorage if provinces seem outdated
- Check cache expiry settings
- Force refresh by calling `fetchProvincesFromFBR()`

### 2. Debug Information

Enable detailed logging:
```javascript
// Check console for detailed matching information
console.log("Province matching debug info available");
```

### 3. Fallback Behavior

If seller province matching fails:
1. System falls back to manual province selection
2. User can still select province manually
3. Rate fetching continues to work as before

## Future Enhancements

### 1. Additional Matching
- Support for more province variations
- Regional dialect support
- Historical name variations

### 2. Performance Optimization
- Advanced caching strategies
- Background province updates
- Predictive province loading

### 3. User Interface
- Province selection suggestions
- Auto-complete functionality
- Province validation indicators

## Support

For issues or questions:
1. Check the browser console for error logs
2. Verify FBR API connectivity
3. Test with the `ProvinceMatcherTest` component
4. Review this documentation

## Changelog

### Version 1.0.0
- Initial implementation of province matching
- Integration with RateSelector component
- Comprehensive caching and error handling
- Test component for validation
