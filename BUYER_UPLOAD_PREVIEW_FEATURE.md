# Buyer Upload Preview Feature

## Overview

This feature enhances the CSV buyer upload functionality by providing a preview that shows which records will be skipped because the buyers already exist in the system.

## Features

### 1. Existing Buyer Detection
- Automatically checks for existing buyers during CSV preview
- Identifies buyers with matching NTN/CNIC numbers
- Shows detailed information about existing buyers

### 2. Enhanced Preview Interface
- **Status Column**: Shows "New" or "Skip" status for each record
- **Visual Indicators**: 
  - Orange background for existing buyers
  - Green "New" chips for new buyers
  - Warning "Skip" chips for existing buyers
- **Hover Information**: Shows existing buyer details on hover

### 3. Smart Upload Process
- Only uploads new buyers (skips existing ones automatically)
- Provides clear feedback about what will be uploaded
- Shows summary of new vs existing buyers

## Backend Changes

### New API Endpoint
```
POST /api/tenant/{tenant_id}/buyers/check-existing
```

**Request Body:**
```json
{
  "buyers": [
    {
      "buyerNTNCNIC": "1234567890123",
      "buyerBusinessName": "Test Company",
      "buyerProvince": "PUNJAB",
      "buyerAddress": "123 Test Street",
      "buyerRegistrationType": "Registered"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "existing": [
      {
        "index": 0,
        "row": 1,
        "buyerData": { ... },
        "existingBuyer": {
          "buyerNTNCNIC": "1234567890123",
          "buyerBusinessName": "Existing Company Name"
        }
      }
    ],
    "new": [
      {
        "index": 1,
        "row": 2,
        "buyerData": { ... }
      }
    ],
    "summary": {
      "total": 2,
      "existing": 1,
      "new": 1
    }
  }
}
```

## Frontend Changes

### BuyerUploader Component Updates
- Added `selectedTenant` prop for API calls
- New state management for existing/new buyers
- Enhanced preview table with status indicators
- Improved user feedback and notifications

### Key Features
1. **Automatic Checking**: Checks for existing buyers when file is processed
2. **Visual Feedback**: Clear status indicators in preview table
3. **Smart Upload**: Only uploads new buyers
4. **Detailed Alerts**: Shows information about skipped buyers

## Usage

1. **Upload CSV File**: Select or drag a CSV file with buyer data
2. **Preview Results**: The system automatically checks for existing buyers
3. **Review Status**: See which records are marked as "New" or "Skip"
4. **Upload**: Click "Upload X New Buyers" to proceed with only new records

## Benefits

- **Prevents Duplicates**: Automatically identifies and skips existing buyers
- **Better UX**: Clear visual feedback about what will happen
- **Efficient Processing**: Only processes new buyers, saving time
- **Transparency**: Users know exactly what will be uploaded

## Error Handling

- Graceful handling of API errors during checking
- Fallback behavior if checking fails
- Clear error messages for users
- Continues with upload even if preview checking fails

## Testing

Use the provided test file `test_buyer_upload.js` to test both the check-existing endpoint and the bulk upload functionality.

## Technical Notes

- Uses batch database queries for efficient checking
- Maintains original row order in preview
- Handles edge cases (no NTN/CNIC, duplicate NTN/CNIC in file)
- Compatible with existing validation logic
