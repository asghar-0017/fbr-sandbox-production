import express from 'express';
import * as tenantController from '../controller/mysql/tenantController.js';
import { authenticateToken, requireAdmin } from '../middleWare/authMiddleware.js';

const router = express.Router();

// All tenant routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

// Tenant management routes (admin only)
router.post('/tenants', tenantController.createTenant);
router.get('/tenants', tenantController.getAllTenants);
router.get('/tenants/:tenantId', tenantController.getTenantById);
router.get('/tenants/:tenantId/stats', tenantController.getTenantStats);
router.put('/tenants/:tenantId', tenantController.updateTenant);
router.delete('/tenants/:tenantId', tenantController.deactivateTenant);

export default router; 