import express from 'express';
import * as tenantAuthController from '../controller/mysql/tenantAuthController.js';
import { identifyTenant } from '../middleWare/tenantMiddleware.js';
import { authenticateToken } from '../middleWare/authMiddleware.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/login', tenantAuthController.tenantLogin);
router.get('/verify-token', tenantAuthController.verifyTenantToken);

// Protected routes (require tenant authentication)
router.use(authenticateToken);
router.use(identifyTenant);
router.get('/profile', tenantAuthController.getTenantProfile);

export default router; 