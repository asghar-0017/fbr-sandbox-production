# Invoice Uploader with Items Feature

## Overview

The Invoice Uploader has been enhanced to support uploading invoice items along with invoice headers. This allows users to upload complete invoice data including multiple items per invoice in a single CSV file.

## Key Features

### 1. **Invoice Header + Items Support**

- Upload complete invoice data including multiple items per invoice
- Each row represents an invoice item with the invoice header repeated
- Automatic grouping of items by invoice number
- Support for all invoice item fields

### 2. **CSV Format**

The CSV now includes both invoice header fields and item fields:

**Invoice Header Fields:**

- `invoice_number` - Unique invoice identifier
- `invoiceType` - Local, Export, or Import
- `invoiceDate` - Date in YYYY-MM-DD format
- `sellerNTNCNIC` - Seller's NTN/CNIC
- `sellerBusinessName` - Seller's business name
- `sellerProvince` - Seller's province
- `sellerAddress` - Seller's address
- `buyerNTNCNIC` - Buyer's NTN/CNIC
- `buyerBusinessName` - Buyer's business name
- `buyerProvince` - Buyer's province
- `buyerAddress` - Buyer's address
- `buyerRegistrationType` - Registered or Unregistered
- `invoiceRefNo` - Invoice reference number
- `companyInvoiceRefNo` - Company invoice reference
- `transctypeId` - Transaction type ID

**Invoice Item Fields:**

- `item_hsCode` - HS Code for the item
- `item_productDescription` - Product description
- `item_rate` - Tax rate
- `item_uoM` - Unit of measurement
- `item_quantity` - Quantity
- `item_unitPrice` - Unit price
- `item_totalValues` - Total value
- `item_valueSalesExcludingST` - Sales value excluding ST
- `item_fixedNotifiedValueOrRetailPrice` - Fixed notified value
- `item_salesTaxApplicable` - Sales tax applicable
- `item_salesTaxWithheldAtSource` - Sales tax withheld
- `item_extraTax` - Extra tax
- `item_furtherTax` - Further tax
- `item_sroScheduleNo` - SRO schedule number
- `item_fedPayable` - FED payable
- `item_discount` - Discount
- `item_saleType` - Sale type (Retail/Wholesale)
- `item_sroItemSerialNo` - SRO item serial number
- `item_billOfLadingUoM` - Bill of lading UoM

### 3. **Data Structure**

Each row in the CSV represents an invoice item. Multiple rows with the same `invoice_number` will be grouped together:

```csv
invoice_number,invoiceType,invoiceDate,...,item_hsCode,item_productDescription,...
INV-001,Local,2024-01-15,...,8471.30.00,Laptop Computer,...
INV-001,Local,2024-01-15,...,8471.30.00,Computer Mouse,...
INV-002,Export,2024-01-16,...,8517.12.00,Mobile Phone,...
```

This creates:

- Invoice INV-001 with 2 items (Laptop Computer, Computer Mouse)
- Invoice INV-002 with 1 item (Mobile Phone)

## Backend Implementation

### 1. **Updated Controller (`bulkCreateInvoices`)**

- Groups invoices by `invoice_number`
- Extracts item data from rows with item fields
- Creates invoices with transactions to handle items
- Validates both invoice header and item data

### 2. **Key Changes**

- **Grouping Logic**: Invoices are grouped by invoice number to handle multiple items
- **Item Extraction**: Item fields are extracted and mapped to the correct structure
- **Transaction Support**: Uses database transactions to ensure data consistency
- **Validation**: Enhanced validation for both invoice and item fields

### 3. **Data Processing Flow**

1. Parse CSV data
2. Group rows by `invoice_number`
3. Extract invoice header from first row of each group
4. Extract item data from all rows in each group
5. Validate invoice header and items
6. Create invoice with transaction
7. Create all items for the invoice
8. Commit transaction

## Frontend Implementation

### 1. **Updated Component (`InvoiceUploader.jsx`)**

- Extended expected columns to include item fields
- Enhanced validation for item data
- Updated template download with sample item data
- Preview table shows all fields including items

### 2. **Validation Enhancements**

- **Required Item Fields**: Product description, quantity, unit price
- **Numeric Validation**: All numeric item fields are validated
- **Data Type Checking**: Ensures proper data types for all fields

### 3. **Template Download**

The template now includes sample data with items:

```csv
invoice_number,invoiceType,...,item_hsCode,item_productDescription,...
INV-001,Local,...,8471.30.00,Laptop Computer,...
INV-001,Local,...,8471.30.00,Computer Mouse,...
```

## Usage Instructions

### 1. **Preparing CSV Data**

1. Download the template: `invoice_template_with_items.csv`
2. Fill in invoice header data (same for all rows of the same invoice)
3. Fill in item-specific data for each row
4. Ensure invoice numbers are consistent for items belonging to the same invoice

### 2. **Upload Process**

1. Click "Upload Invoices" button
2. Select or drag CSV file
3. Review validation results
4. Check preview for existing invoices
5. Confirm upload

### 3. **Validation Rules**

- **Invoice Header**: All required fields must be present
- **Items**: If item data is provided, product description, quantity, and unit price are required
- **Numeric Fields**: All numeric fields must contain valid numbers
- **Duplicates**: Invoice numbers must be unique within the file and database

## Example CSV Structure

```csv
invoice_number,invoiceType,invoiceDate,sellerNTNCNIC,sellerBusinessName,sellerProvince,sellerAddress,buyerNTNCNIC,buyerBusinessName,buyerProvince,buyerAddress,buyerRegistrationType,invoiceRefNo,companyInvoiceRefNo,transctypeId,item_hsCode,item_productDescription,item_rate,item_uoM,item_quantity,item_unitPrice,item_totalValues,item_valueSalesExcludingST,item_fixedNotifiedValueOrRetailPrice,item_salesTaxApplicable,item_salesTaxWithheldAtSource,item_extraTax,item_furtherTax,item_sroScheduleNo,item_fedPayable,item_discount,item_saleType,item_sroItemSerialNo,item_billOfLadingUoM
INV-001,Local,2024-01-15,1234567890123,ABC Trading Company,PUNJAB,123 Main Street Lahore,9876543210987,XYZ Import Export,SINDH,456 Business Avenue Karachi,Registered,REF-001,COMP-001,1,8471.30.00,Laptop Computer,15,Units,5,50000,250000,250000,250000,37500,0,0,0,1,0,0,Retail,1,KG
INV-001,Local,2024-01-15,1234567890123,ABC Trading Company,PUNJAB,123 Main Street Lahore,9876543210987,XYZ Import Export,SINDH,456 Business Avenue Karachi,Registered,REF-001,COMP-001,1,8471.30.00,Computer Mouse,15,Units,10,2000,20000,20000,20000,3000,0,0,0,1,0,0,Retail,2,KG
INV-002,Export,2024-01-16,4567891230456,Global Traders Ltd,KHYBER PAKHTUNKHWA,789 Commerce Road Peshawar,3216549870321,Capital Enterprises,ISLAMABAD CAPITAL TERRITORY,654 Blue Area Islamabad,Unregistered,REF-002,COMP-002,2,8517.12.00,Mobile Phone,17,Units,20,15000,300000,300000,300000,51000,0,0,0,2,0,0,Wholesale,1,PCS
```

## Error Handling

### 1. **Validation Errors**

- Missing required fields
- Invalid data types
- Duplicate invoice numbers
- Invalid provinces or registration types

### 2. **Item-Specific Errors**

- Missing product description when item data is present
- Invalid numeric values for item fields
- Missing quantity or unit price

### 3. **Database Errors**

- Duplicate invoice numbers in database
- Constraint violations
- Transaction failures

## Testing

### 1. **Test Files**

- `test_invoices_with_items.csv` - Sample data with items
- `test_invoice_upload_with_items.js` - Test script for parsing

### 2. **Test Commands**

```bash
# Test CSV parsing
node test_invoice_upload_with_items.js

# Test API endpoint
POST /tenant/{tenant_id}/invoices/bulk
```

## Security Considerations

1. **File Size Limits**: Maximum 1000 invoices per upload
2. **Data Validation**: Comprehensive validation on both client and server
3. **Transaction Safety**: Database transactions ensure data consistency
4. **Input Sanitization**: All input is cleaned and validated

## Performance Considerations

1. **Bulk Operations**: Uses database bulk operations for efficiency
2. **Transaction Management**: Proper transaction handling for data integrity
3. **Memory Management**: Processes data in chunks to avoid memory issues
4. **Error Recovery**: Continues processing even if some records fail

## Future Enhancements

1. **Excel Support**: Full Excel file support with multiple sheets
2. **Advanced Validation**: More sophisticated business rule validation
3. **Batch Processing**: Background processing for large files
4. **Progress Tracking**: Real-time upload progress indicators
5. **Data Mapping**: Custom field mapping for different CSV formats

## Troubleshooting

### Common Issues

1. **Carriage Return Characters**: Ensure CSV files use proper line endings
2. **Encoding Issues**: Use UTF-8 encoding for special characters
3. **Missing Fields**: Ensure all required fields are present
4. **Data Type Errors**: Check numeric fields contain valid numbers

### Debug Information

- Check browser console for client-side errors
- Check server logs for backend errors
- Use test scripts to validate CSV format
- Verify data structure matches expected format

## API Endpoints

### Bulk Upload

```
POST /tenant/{tenant_id}/invoices/bulk
Content-Type: application/json

{
  "invoices": [
    {
      "invoice_number": "INV-001",
      "invoiceType": "Local",
      // ... other invoice fields
      "item_hsCode": "8471.30.00",
      "item_productDescription": "Laptop Computer",
      // ... other item fields
    }
  ]
}
```

### Check Existing

```
POST /tenant/{tenant_id}/invoices/check-existing
Content-Type: application/json

{
  "invoices": [
    {
      "invoice_number": "INV-001",
      // ... other fields
    }
  ]
}
```

This enhanced invoice uploader provides a comprehensive solution for bulk uploading invoices with items, maintaining data integrity and providing excellent user experience.
