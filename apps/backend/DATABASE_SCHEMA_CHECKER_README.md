# Database Schema Checker

This script automatically checks for missing columns in all tenant databases and creates them based on the current model definitions.

## What it does

The script performs the following operations:

1. **Connects to the master database** to get a list of all active tenants
2. **For each tenant database**:
   - Connects to the tenant's database
   - Compares the current database schema with the model definitions
   - Identifies missing columns
   - Automatically creates missing columns using `ALTER TABLE` statements
3. **Provides detailed logging** of all operations
4. **Generates a summary report** showing what was found and created

## Tables Checked

The script checks these tables in each tenant database:
- `buyers` - Buyer information table
- `invoices` - Invoice header table  
- `invoice_items` - Invoice line items table

## Prerequisites

- Node.js environment with ES modules support
- MySQL database running
- Environment variables configured (see `.env` file)
- All required dependencies installed

## Environment Variables Required

Make sure your `.env` file contains:

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=your_username
MYSQL_PASSWORD=your_password
MYSQL_MASTER_DB=master_database_name
```

## Usage

### Run the script directly:

```bash
cd apps/backend
node check-missing-columns.js
```

### Run with npm script (if added to package.json):

```bash
npm run check-schema
```

## Output Example

```
🚀 Starting database schema check for all tenants...

✅ Master database connection established
✅ Found 3 active tenants

🔍 Checking schema for tenant: tenant_abc123

✅ Connected to tenant database: tenant_abc123

📋 Checking table: Buyers (buyers)
✅ Table buyers is up to date

📋 Checking table: Invoices (invoices)
⚠️  Found 2 missing columns in invoices:
   - companyInvoiceRefNo: STRING(100)
   - system_invoice_id: STRING(20)
🔧 Executing: ALTER TABLE `invoices` ADD COLUMN `companyInvoiceRefNo` STRING(100)
✅ Created column: companyInvoiceRefNo
🔧 Executing: ALTER TABLE `invoices` ADD COLUMN `system_invoice_id` STRING(20) UNIQUE
✅ Created column: system_invoice_id
✅ Successfully created 2 columns in invoices

📋 Checking table: Invoice Items (invoice_items)
✅ Table invoice_items is up to date

📊 Summary for tenant_abc123:
   - Missing columns found: 2
   - Columns created: 2

============================================================
📋 FINAL SUMMARY
============================================================
📊 TOTAL: 2 missing columns found, 2 created, 0 errors
============================================================

🧹 Cleaning up connections...
✅ Closed connection for tenant_abc123
✅ Closed master database connection
```

## Safety Features

- **Read-only first**: The script first checks what's missing before making any changes
- **Detailed logging**: Every operation is logged for audit purposes
- **Error handling**: Individual column creation failures don't stop the entire process
- **Connection cleanup**: All database connections are properly closed
- **Graceful shutdown**: Handles SIGINT and SIGTERM signals

## What Gets Created

The script automatically creates columns with the correct:
- **Data types** (STRING, TEXT, DECIMAL, etc.)
- **Constraints** (NOT NULL, UNIQUE, PRIMARY KEY)
- **Default values** (if specified in the model)
- **Auto-increment** (for primary keys)

## Troubleshooting

### Common Issues:

1. **Connection errors**: Check your `.env` file and MySQL server status
2. **Permission errors**: Ensure the MySQL user has ALTER privileges on tenant databases
3. **Column already exists**: The script handles this gracefully and skips existing columns

### Debug Mode:

To see more detailed SQL operations, you can modify the script to enable Sequelize logging:

```javascript
const sequelize = createTenantConnection(database_name);
sequelize.options.logging = console.log; // Enable SQL logging
```

## When to Use

- **After model updates**: When you've added new fields to your Sequelize models
- **Database migrations**: To ensure all tenant databases are in sync
- **Regular maintenance**: As part of your database maintenance routine
- **Before deployments**: To ensure all environments have the required schema

## Limitations

- Only works with MySQL databases
- Requires the models to be properly defined in Sequelize
- Cannot modify existing column types or constraints (only adds missing columns)
- Assumes table names match the model's `tableName` property

## Contributing

To add support for additional tables or modify the behavior:

1. Add the new model to the `tables` array in the script
2. Ensure the model has the correct `tableName` property
3. Test with a development database first

## Support

If you encounter issues:
1. Check the console output for specific error messages
2. Verify your database connections and permissions
3. Ensure all required environment variables are set
4. Check that the models are properly imported and defined
