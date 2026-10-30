import express from 'express';
import {
  getInvoices,
  getNextNumber,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  downloadInvoicePdf,
  getInvoiceSettings,
  updateInvoiceSettings
} from '../controllers/invoiceController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Strict Admin-only access guard
router.use(protectAdmin);

// Invoice CRUD & Operations
router.get('/', getInvoices);
router.get('/next-number', getNextNumber);
router.get('/settings', getInvoiceSettings);
router.put('/settings', updateInvoiceSettings);
router.get('/:id', getInvoiceById);
router.post('/', createInvoice);
router.put('/:id', updateInvoice);
router.patch('/:id/status', updateInvoiceStatus);
router.delete('/:id', deleteInvoice);
router.get('/:id/pdf', downloadInvoicePdf);

export default router;
