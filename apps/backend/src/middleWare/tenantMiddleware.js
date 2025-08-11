import TenantDatabaseService from '../service/TenantDatabaseService.js';

// Middleware to identify tenant and attach database to request
export const identifyTenant = async (req, res, next) => {
  try {
    let tenantId;

    // If user is authenticated as tenant, get tenant ID from token
    if (req.userType === 'tenant' && req.user && req.user.tenantId) {
      tenantId = req.user.tenantId;
    } else if (req.userType === 'tenant' && req.user && req.user.sellerNtnCnic) {
      // Fallback: if tenantId is not available but sellerNtnCnic is, we can look up the tenant
      try {
        const tenant = await TenantDatabaseService.getTenantBySellerId(req.user.sellerNtnCnic);
        if (tenant) {
          tenantId = tenant.tenant_id;
        }
      } catch (error) {
        console.error('Error looking up tenant by seller NTN/CNIC:', error);
      }
    }
    
    // If still no tenantId, try to get it from request parameters
    if (!tenantId) {
      tenantId = req.headers['x-tenant-id'] || 
                  req.query.tenantId || 
                  req.body.tenantId ||
                  req.params.tenantId ||
                  req.params.tenant_id;
    }

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    // Get tenant database connection and models
    const tenantDb = await TenantDatabaseService.getTenantDatabase(tenantId);
    
    if (!tenantDb) {
      return res.status(404).json({
        success: false,
        message: 'Tenant database not found'
      });
    }
    
    // Attach tenant information to request
    req.tenant = tenantDb.tenant;
    req.tenantDb = tenantDb.sequelize;
    req.tenantModels = tenantDb.models;

    next();
  } catch (error) {
    console.error('Error identifying tenant:', error);
    return res.status(404).json({
      success: false,
      message: 'Tenant not found or inactive'
    });
  }
};

// Middleware to identify tenant by seller NTN/CNIC
export const identifyTenantBySeller = async (req, res, next) => {
  try {
    const sellerNtnCnic = req.headers['x-seller-ntn-cnic'] || 
                         req.query.sellerNtnCnic || 
                         req.body.sellerNtnCnic ||
                         req.params.sellerNtnCnic;

    if (!sellerNtnCnic) {
      return res.status(400).json({
        success: false,
        message: 'Seller NTN/CNIC is required'
      });
    }

    // Get tenant by seller NTN/CNIC
    const tenant = await TenantDatabaseService.getTenantBySellerId(sellerNtnCnic);
    
    // Get tenant database connection and models
    const tenantDb = await TenantDatabaseService.getTenantDatabase(tenant.tenant_id);
    
    // Attach tenant information to request
    req.tenant = tenantDb.tenant;
    req.tenantDb = tenantDb.sequelize;
    req.tenantModels = tenantDb.models;

    next();
  } catch (error) {
    console.error('Error identifying tenant by seller:', error);
    return res.status(404).json({
      success: false,
      message: 'Seller not found or inactive'
    });
  }
};

// Optional tenant middleware (for routes that can work with or without tenant)
export const optionalTenant = async (req, res, next) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 
                    req.query.tenantId || 
                    req.body.tenantId ||
                    req.params.tenantId;

    if (tenantId) {
      const tenantDb = await TenantDatabaseService.getTenantDatabase(tenantId);
      req.tenant = tenantDb.tenant;
      req.tenantDb = tenantDb.sequelize;
      req.tenantModels = tenantDb.models;
    }

    next();
  } catch (error) {
    console.error('Error with optional tenant identification:', error);
    // Continue without tenant (for admin routes)
    next();
  }
}; 