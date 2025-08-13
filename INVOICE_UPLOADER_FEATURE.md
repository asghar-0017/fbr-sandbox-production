# Invoice Uploader Feature

## Overview

The Invoice Uploader feature allows users to bulk upload invoices from CSV files. All uploaded invoices are automatically saved with "draft" status, providing a convenient way to import multiple invoices at once.

## Features

### Frontend Components

- **InvoiceUploader.jsx**: Main upload component with drag-and-drop functionality
- **CSV Template Download**: Users can download a template CSV file with the correct column structure
- **Preview Functionality**: Shows a preview of the data before upload with validation results
- **Duplicate Detection**: Identifies existing invoices and skips them during upload
- **Validation**: Real-time validation of CSV data with detailed error reporting

### Backend Endpoints

- `POST /tenant/{tenant_id}/invoices/bulk`: Bulk create invoices
- `POST /tenant/{tenant_id}/invoices/check-existing`: Check for existing invoices

## CSV Format

### Required Columns

The CSV file must contain the following columns:

| Column             | Required | Description               | Example               |
| ------------------ | -------- | ------------------------- | --------------------- |
| invoice_number     | Yes      | Unique invoice identifier | INV-001               |
| invoiceType        | Yes      | Type of invoice           | Local, Export, Import |
| invoiceDate        | Yes      | Invoice date (YYYY-MM-DD) | 2024-01-15            |
| sellerBusinessName | Yes      | Seller's business name    | ABC Trading Company   |
| sellerProvince     | Yes      | Seller's province         | PUNJAB                |
| buyerBusinessName  | Yes      | Buyer's business name     | XYZ Import Export     |
| buyerProvince      | Yes      | Buyer's province          | SINDH                 |

### Optional Columns

| Column                | Required | Description               | Example                     |
| --------------------- | -------- | ------------------------- | --------------------------- |
| sellerNTNCNIC         | No       | Seller's NTN/CNIC         | 1234567890123               |
| sellerAddress         | No       | Seller's address          | 123 Main Street Lahore      |
| buyerNTNCNIC          | No       | Buyer's NTN/CNIC          | 9876543210987               |
| buyerAddress          | No       | Buyer's address           | 456 Business Avenue Karachi |
| buyerRegistrationType | No       | Buyer registration type   | Registered, Unregistered    |
| invoiceRefNo          | No       | Invoice reference number  | REF-001                     |
| companyInvoiceRefNo   | No       | Company invoice reference | COMP-001                    |
| transctypeId          | No       | Transaction type ID       | 1                           |

## Validation Rules

### Invoice Type

- Must be one of: `Local`, `Export`, `Import`

### Date Format

- Must be in YYYY-MM-DD format
- Example: `2024-01-15`

### Provinces

Valid Pakistani provinces (case-insensitive):

- PUNJAB
- SINDH
- KHYBER PAKHTUNKHWA
- BALOCHISTAN
- ISLAMABAD CAPITAL TERRITORY
- GILGIT-BALTISTAN
- AZAD KASHMIR

### Buyer Registration Type

- Must be one of: `Registered`, `Unregistered`

## Usage

### 1. Access the Upload Feature

- Navigate to "Your Invoices" page
- Click the "Upload Invoices" button in the header

### 2. Download Template (Optional)

- Click "Download CSV Template" to get a sample file
- Use this as a starting point for your data

### 3. Upload CSV File

- Drag and drop a CSV file or click to browse
- The system will validate the file and show a preview
- Review validation results and existing invoice detection

### 4. Confirm Upload

- Click "Upload X New Invoices as Drafts" to proceed
- All valid invoices will be created with "draft" status

## Error Handling

### Validation Errors

- Missing required fields
- Invalid data formats
- Duplicate invoice numbers within the file
- Invalid province names
- Invalid invoice types

### Database Errors

- Duplicate invoice numbers in database
- Database constraint violations
- Connection issues

### Error Reporting

- Detailed error messages for each row
- Summary of successful and failed uploads
- Row numbers for easy identification

## Technical Implementation

### Frontend

- React component with Material-UI
- File drag-and-drop with validation
- Real-time preview with status indicators
- Progress tracking during upload

### Backend

- Express.js endpoints with middleware
- Sequelize ORM for database operations
- Transaction support for data integrity
- Comprehensive error handling and logging

### Database

- All invoices created with `status = "draft"`
- System-generated `system_invoice_id`
- Proper foreign key relationships
- Unique constraints on invoice numbers

## Testing

### Sample Data

Use the provided `test_invoices.csv` file for testing:

```bash
# Test the CSV parsing
node test_invoice_upload.js
```

### API Testing

```bash
# Test bulk upload endpoint
curl -X POST http://localhost:3000/tenant/{tenant_id}/invoices/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d @test_invoices.json
```

## Security Considerations

- Authentication required for all upload operations
- Tenant isolation ensures data privacy
- File size limits (configurable)
- Maximum upload limit of 1000 invoices per batch
- Input sanitization and validation

## Performance

- Batch processing for efficient database operations
- Progress indicators for large uploads
- Optimized database queries
- Memory-efficient file processing

## Troubleshooting

### Common Issues

1. **CSV Format Errors**
   - Ensure all required columns are present
   - Check for proper comma separation
   - Verify date format is YYYY-MM-DD

2. **Validation Failures**
   - Review error messages for specific issues
   - Check province names match valid options
   - Ensure invoice types are correct

3. **Duplicate Errors**
   - Check for existing invoice numbers in database
   - Remove duplicate entries from CSV file

4. **Upload Failures**
   - Verify network connection
   - Check authentication token
   - Ensure tenant is properly selected

## Future Enhancements

- Support for Excel files (.xlsx, .xls)
- Bulk status updates
- Invoice item upload support
- Advanced validation rules
- Import/export templates
- Scheduled bulk uploads
