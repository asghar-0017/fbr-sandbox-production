import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Tenant from '../../model/mysql/Tenant.js';
import TenantDatabaseService from '../../service/TenantDatabaseService.js';

// Tenant login
export const tenantLogin = async (req, res) => {
  try {
    const { sellerNTNCNIC, password } = req.body;

    // Validate required fields
    if (!sellerNTNCNIC || !password) {
      return res.status(400).json({
        success: false,
        message: 'Seller NTN/CNIC and password are required'
      });
    }

    // Find tenant by seller NTN/CNIC
    const tenant = await Tenant.findOne({
      where: { 
        seller_ntn_cnic: sellerNTNCNIC,
        is_active: true 
      }
    });

    if (!tenant) {
      return res.status(401).json({
        success: false,
        message: 'Invalid seller NTN/CNIC or password'
      });
    }

    // For now, we'll use a simple password check
    // In production, you should hash passwords and store them securely
    // For demo purposes, we'll use the sellerNTNCNIC as password
    if (password !== sellerNTNCNIC) {
      return res.status(401).json({
        success: false,
        message: 'Invalid seller NTN/CNIC or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        tenantId: tenant.tenant_id,
        sellerNtnCnic: tenant.seller_ntn_cnic,
        type: 'tenant'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      message: 'Tenant login successful',
      data: {
        token,
        tenant: {
          tenant_id: tenant.tenant_id,
          sellerNTNCNIC: tenant.seller_ntn_cnic,
          sellerBusinessName: tenant.seller_business_name,
          sellerProvince: tenant.seller_province,
          sellerAddress: tenant.seller_address,
          sandboxTestToken: tenant.sandboxTestToken,
          sandboxProductionToken: tenant.sandboxProductionToken
        }
      }
    });
  } catch (error) {
    console.error('Error in tenant login:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
};

// Verify tenant token
export const verifyTenantToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'tenant') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    // Verify tenant still exists and is active
    const tenant = await Tenant.findOne({
      where: { 
        tenant_id: decoded.tenantId,
        is_active: true 
      }
    });

    if (!tenant) {
      return res.status(401).json({
        success: false,
        message: 'Tenant not found or inactive'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        tenant: {
          tenant_id: tenant.tenant_id,
          sellerNTNCNIC: tenant.seller_ntn_cnic,
          sellerBusinessName: tenant.seller_business_name,
          sellerProvince: tenant.seller_province,
          sellerAddress: tenant.seller_address,
          sandboxTestToken: tenant.sandboxTestToken,
          sandboxProductionToken: tenant.sandboxProductionToken
        }
      }
    });
  } catch (error) {
    console.error('Error verifying tenant token:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: error.message
    });
  }
};

// Get tenant profile
export const getTenantProfile = async (req, res) => {
  try {
    const tenant = req.tenant;

    res.status(200).json({
      success: true,
      data: {
        tenant: {
          tenant_id: tenant.tenant_id,
          sellerNTNCNIC: tenant.seller_ntn_cnic,
          sellerBusinessName: tenant.seller_business_name,
          sellerProvince: tenant.seller_province,
          sellerAddress: tenant.seller_address,
          sandboxTestToken: tenant.sandboxTestToken,
          sandboxProductionToken: tenant.sandboxProductionToken
        }
      }
    });
  } catch (error) {
    console.error('Error getting tenant profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving tenant profile',
      error: error.message
    });
  }
}; 