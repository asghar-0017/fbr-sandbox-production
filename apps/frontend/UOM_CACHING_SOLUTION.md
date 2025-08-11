# UOM Caching Solution

## Problem

The FBR API endpoint `pdi/v2/HS_UOM` was returning 500 Internal Server Error, causing the Unit of Measurement (UOM) dropdowns to fail and display no options to users.

## Solution Overview

Implemented a comprehensive UOM caching system that provides:

1. **Caching**: Stores UOM data locally to reduce API calls
2. **Fallback Data**: Provides common UOM options when API fails
3. **Retry Logic**: Attempts API calls multiple times before falling back
4. **Error Handling**: Graceful degradation when API is unavailable

## Implementation Details

### 1. Enhanced hsCodeCache.js

- Added UOM-specific caching methods
- Implemented fallback UOM data for common scenarios
- Added retry logic with exponential backoff
- Integrated with existing HS code caching infrastructure

### 2. Updated Components

- **UnitOfMeasurement.jsx**: Now uses caching system instead of direct API calls
- **BillOfLadingUoM.jsx**: Updated to use the same caching system
- **HSCodeDebugger.jsx**: Enhanced with UOM cache management features

### 3. Fallback Data

The system includes fallback UOM data for:

- Common HS codes (0101.10.00, 0101.90.00, etc.)
- Default comprehensive list of UOM options
- Special cases like "Bill of lading" and "SqY"

## Key Features

### Caching

- **Memory Cache**: Stores UOM data in memory for fast access
- **Local Storage**: Persists cache across browser sessions
- **Cache Validation**: 24-hour cache expiration
- **Per-HS-Code Caching**: Each HS code is cached individually

### Error Handling

- **Retry Logic**: Up to 3 attempts with increasing delays
- **Graceful Fallback**: Uses fallback data when API fails
- **Loading States**: Shows loading indicators during API calls
- **Error Logging**: Comprehensive error tracking

### Performance

- **Reduced API Calls**: Cached data eliminates redundant requests
- **Parallel Loading**: Multiple UOM requests don't block each other
- **Fast Fallback**: Immediate response with fallback data

## Usage

### Basic Usage

```javascript
import hsCodeCache from "../utils/hsCodeCache";

// Get UOM for an HS code
const uomData = await hsCodeCache.getUOM("0101.10.00");
```

### Cache Management

```javascript
// Refresh cache for specific HS code
await hsCodeCache.refreshUOMCache("0101.10.00");

// Clear all UOM cache
hsCodeCache.clearUOMCache();

// Get cache status
const status = hsCodeCache.getUOMCacheStatus();
```

### Debugging

Use the enhanced HSCodeDebugger component to:

- Monitor cache status
- Test UOM fetching
- Manage cache operations
- View cached HS codes

## Benefits

1. **Reliability**: System continues working even when FBR API is down
2. **Performance**: Faster response times with cached data
3. **User Experience**: No more empty dropdowns or loading failures
4. **Maintainability**: Centralized UOM management
5. **Debugging**: Comprehensive monitoring and debugging tools

## Configuration

### Cache Duration

Default cache duration is 24 hours. Can be modified in `hsCodeCache.js`:

```javascript
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
```

### Retry Settings

Retry configuration in `fetchUOMFromAPI` method:

```javascript
const maxRetries = 3;
const retryDelay = 1000; // 1 second base delay
```

### Fallback Data

Add new fallback UOM data in the `FALLBACK_UOM_DATA` object:

```javascript
const FALLBACK_UOM_DATA = {
  YOUR_HS_CODE: [
    { uoM_ID: "kg", description: "Kilogram" },
    { uoM_ID: "pcs", description: "Pieces" },
  ],
};
```

## Monitoring

The system provides comprehensive logging:

- Cache hits/misses
- API call attempts and failures
- Fallback usage
- Cache operations

Use browser console or the HSCodeDebugger component to monitor system behavior.

## Future Enhancements

1. **Backend Caching**: Implement server-side UOM caching
2. **Smart Fallbacks**: Use HS code patterns to predict UOM options
3. **User Preferences**: Remember user's preferred UOM selections
4. **Bulk Operations**: Cache multiple HS codes simultaneously
5. **Analytics**: Track API failure rates and cache effectiveness
