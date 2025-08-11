import express from 'express';
import * as invoiceController from '../controller/mysql/invoiceController.js';
import { identifyTenant } from '../middleWare/tenantMiddleware.js';
import { authenticateToken } from '../middleWare/authMiddleware.js';

const router = express.Router();

// ✅ Public route — NO middleware
router.get('/print-invoice/:id', invoiceController.printInvoice);

// ✅ Apply middleware only for protected routes
router.use(authenticateToken, identifyTenant);

// ✅ Protected routes
router.post('/invoices', invoiceController.createInvoice);
router.post('/invoices/save', invoiceController.saveInvoice);
router.post('/invoices/save-validate', invoiceController.saveAndValidateInvoice);

router.get('/invoices', invoiceController.getAllInvoices);
router.get('/invoices/number/:invoiceNumber', invoiceController.getInvoiceByNumber);
router.get('/invoices/stats/summary', invoiceController.getInvoiceStats);
router.get('/dashboard/summary', invoiceController.getDashboardSummary);
router.get('/invoices/:id', invoiceController.getInvoiceById);
router.put('/invoices/:id', invoiceController.updateInvoice);
router.delete('/invoices/:id', invoiceController.deleteInvoice);
router.post('/invoices/:id/submit', invoiceController.submitSavedInvoice);

export default router;


// 👇 Export the public route separately
export const publicInvoiceRoutes = express.Router();
publicInvoiceRoutes.get('/print-invoice/:id', invoiceController.printInvoice);