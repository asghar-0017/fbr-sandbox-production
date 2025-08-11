# Quick Start Guide - MySQL Multi-Tenant System

## 🚀 Fresh MySQL Multi-Tenant Implementation

Your FBR Integration system has been completely rebuilt with MySQL multi-tenant architecture!

## 📋 What's New

### ✅ Pure MySQL System
- ✅ `mysql2` - MySQL driver
- ✅ `sequelize` - MySQL ORM
- ✅ Multi-tenant database architecture
- ✅ New MySQL models, routes, and controllers
- ✅ Authentication system
- ✅ Tenant management

## 🛠️ Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file with:
```env
# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your-mysql-password
MYSQL_MASTER_DB=fbr_master

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# Application Configuration
NODE_ENV=development
PORT=5173
```

### 3. Setup MySQL System
```bash
npm run setup-mysql
```

### 4. Start the Server
```bash
npm start
```

## 🔗 New API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/profile` - Get admin profile
- `PUT /api/auth/profile` - Update admin profile
- `PUT /api/auth/change-password` - Change password

### Tenant Management (Admin Only)
- `POST /api/admin/tenants` - Create new tenant
- `GET /api/admin/tenants` - Get all tenants
- `GET /api/admin/tenants/:tenantId` - Get tenant details
- `PUT /api/admin/tenants/:tenantId` - Update tenant
- `DELETE /api/admin/tenants/:tenantId` - Deactivate tenant

### Buyer Management (Tenant-Specific)
- `POST /api/tenant/:tenantId/buyers` - Create buyer
- `GET /api/tenant/:tenantId/buyers` - Get buyers
- `GET /api/tenant/:tenantId/buyers/:id` - Get buyer
- `PUT /api/tenant/:tenantId/buyers/:id` - Update buyer
- `DELETE /api/tenant/:tenantId/buyers/:id` - Delete buyer

### Invoice Management (Tenant-Specific)
- `POST /api/tenant/:tenantId/invoices` - Create invoice
- `GET /api/tenant/:tenantId/invoices` - Get invoices
- `GET /api/tenant/:tenantId/invoices/:id` - Get invoice
- `PUT /api/tenant/:tenantId/invoices/:id` - Update invoice
- `DELETE /api/tenant/:tenantId/invoices/:id` - Delete invoice

## 🎯 Key Features

### Multi-Tenant Architecture
- Each seller gets their own database
- Complete data isolation
- Automatic tenant routing
- Scalable design

### Authentication & Security
- JWT-based authentication
- Session management
- Role-based access control
- Secure password handling

### Data Management
- Structured MySQL tables
- Foreign key relationships
- Transaction support
- Optimized queries

## 📊 Database Structure

### Master Database (`fbr_master`)
- `tenants` - Tenant information
- `admin_users` - Admin accounts
- `admin_sessions` - Admin sessions

### Tenant Database (`fbr_tenant_[seller_id]`)
- `buyers` - Customer data
- `invoices` - Invoice data
- `invoice_items` - Invoice line items

## 🧪 Testing

### 1. Create Admin Account
The system automatically creates a default admin:
- Email: `admin@fbr.com`
- Password: `admin123`

### 2. Login
```bash
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fbr.com","password":"admin123"}'
```

### 3. Create Tenant
```bash
curl -X POST http://localhost:5173/api/admin/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"seller_ntn_cnic":"123456789","seller_business_name":"Test Company"}'
```

## 🎉 Benefits

1. **Complete Data Isolation** - Each seller's data is separate
2. **Better Performance** - Optimized MySQL queries
3. **Enhanced Security** - Multi-tenant security
4. **Scalability** - Easy to add new sellers
5. **Compliance** - Better for regulatory requirements
6. **Individual Backups** - Per-tenant database backups

## 🆘 Support

If you encounter any issues:
1. Check the error logs
2. Verify MySQL connection
3. Ensure environment variables are set
4. Test with sample data first

Your system is now a pure MySQL multi-tenant system! 🚀 