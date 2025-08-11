# Tenant Selection System Guide

## Overview

The FBR Integration System now includes a tenant selection system that allows administrators to view and select from existing tenants (sellers) with separate databases for each tenant's invoices and buyers.

## Features

### For Administrators

1. **Tenant Selection Dashboard**
   - View all available tenants
   - Select a tenant to work with
   - View tenant information and status

2. **Tenant Selection**
   - Admins must select a tenant before accessing tenant-specific features
   - Selected tenant information is displayed in the header
   - Each tenant has its own separate database

3. **Multi-tenant Operations**
   - Create invoices for the selected tenant
   - Manage buyers for the selected tenant
   - View invoice history for the selected tenant
   - All operations are isolated to the selected tenant's database

### For Tenants (Direct Login)

1. **Direct Access**
   - Tenants can login directly using their NTN/CNIC and password
   - Access is limited to their own data only
   - No tenant selection required

## User Interface

### Admin Interface

1. **Navigation**
   - "Select Tenant" appears in the sidebar for admin users
   - Shows currently selected tenant in the header
   - All tenant-specific pages show a prompt if no tenant is selected

2. **Tenant Selection Page**
   - Grid view of all available tenants with status indicators
   - Select button for each tenant
   - View tenant information and details

3. **Tenant Dashboard**
   - Shows selected tenant information
   - Displays statistics (buyer count, invoice count)
   - Quick access to tenant operations

### Tenant Interface

1. **Direct Access**
   - Login with NTN/CNIC and password
   - Immediate access to their data
   - No tenant selection required

## Database Architecture

### Multi-tenant Database Design

1. **Main Database**
   - Contains tenant information
   - Admin user accounts
   - Authentication data

2. **Tenant Databases**
   - Each tenant has a separate database
   - Contains tenant-specific invoices and buyers
   - Isolated data for security and performance

### Database Naming Convention

- Tenant databases follow the pattern: `tenant_{tenant_id}_{timestamp}`
- Example: `tenant_123_1703123456789`

## API Endpoints

### Admin Tenant Selection

- `GET /tenants` - Get all tenants
- `GET /tenants/:id` - Get tenant by ID
- `GET /tenants/:id/stats` - Get tenant statistics

### Tenant-specific Operations

- `GET /buyers` - Get buyers for selected tenant
- `POST /buyers` - Create buyer for selected tenant
- `GET /invoices` - Get invoices for selected tenant
- `POST /invoices` - Create invoice for selected tenant

## Security Features

1. **Role-based Access**
   - Admin users can manage all tenants
   - Tenant users can only access their own data
   - Proper authentication and authorization

2. **Data Isolation**
   - Each tenant's data is completely isolated
   - No cross-tenant data access
   - Secure database connections

3. **Token Management**
   - Separate tokens for admin and tenant users
   - Automatic tenant ID inclusion in requests
   - Secure token validation

## Usage Workflow

### For Administrators

1. **Login as Admin**
   - Use admin credentials to login
   - Access to tenant selection features

2. **Select a Tenant**
   - Navigate to "Select Tenant"
   - Click "Select" on the desired tenant
   - Tenant information appears in header

3. **Perform Operations**
   - Create invoices for the selected tenant
   - Manage buyers for the selected tenant
   - View tenant-specific data

4. **Switch Tenants**
   - Return to "Select Tenant"
   - Select a different tenant
   - All operations now work with the new tenant

### For Tenants

1. **Direct Login**
   - Use tenant login page
   - Enter NTN/CNIC and password
   - Immediate access to their data

2. **Manage Data**
   - Create and manage invoices
   - Add and edit buyers
   - View invoice history

## Technical Implementation

### Frontend Components

1. **TenantSelectionProvider**
   - Manages selected tenant state
   - Persists selection in localStorage
   - Provides tenant context to components

2. **TenantSelectionPrompt**
   - Shows prompt when no tenant is selected
   - Redirects to tenant selection
   - Wraps tenant-specific components

3. **TenantManagement**
   - Main tenant selection interface
   - View available tenants
   - Tenant selection functionality

4. **TenantDashboard**
   - Shows selected tenant information
   - Displays tenant statistics
   - Quick access to operations

### Backend Integration

1. **API Interceptors**
   - Automatically includes tenant ID in requests
   - Handles authentication tokens
   - Manages tenant context

2. **Database Service**
   - Creates tenant-specific databases
   - Manages database connections
   - Handles data isolation

## Configuration

### Environment Variables

- `VITE_SERVER_API_LOCAL` - Backend API URL
- Database configuration for tenant databases

### Database Setup

- Main database for tenant management
- Dynamic tenant database creation
- Proper indexing and optimization

## Troubleshooting

### Common Issues

1. **No Tenant Selected**
   - Navigate to "Tenant Management"
   - Select a tenant to work with
   - Check if tenant is active

2. **Data Not Loading**
   - Verify tenant selection
   - Check API connectivity
   - Ensure proper authentication

3. **Permission Errors**
   - Verify user role (admin vs tenant)
   - Check authentication tokens
   - Ensure proper authorization

### Support

For technical support or questions about the tenant management system, please contact the development team. 