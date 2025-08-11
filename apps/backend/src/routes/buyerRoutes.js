import express from 'express';
import * as buyerController from '../controller/mysql/buyerController.js';
import { identifyTenant } from '../middleWare/tenantMiddleware.js';
import { authenticateToken } from '../middleWare/authMiddleware.js';

const router = express.Router();

// All buyer routes require authentication and tenant identification
router.use(authenticateToken);
router.use(identifyTenant);

// Buyer management routes (tenant-specific)
router.post('/buyers', buyerController.createBuyer);
router.get('/buyers', buyerController.getAllBuyers);
router.get('/buyers/:id', buyerController.getBuyerById);
router.put('/buyers/:id', buyerController.updateBuyer);
router.delete('/buyers/:id', buyerController.deleteBuyer);
router.get('/buyers/province/:province', buyerController.getBuyersByProvince);

export default router; 