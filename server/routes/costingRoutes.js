import express from 'express';
import {
  // Categories
  getCostCategories,
  createCostCategory,
  updateCostCategory,
  deleteCostCategory,
  // Settings
  getCostingSettings,
  updateCostingSettings,
  // Product Costing
  getProductCostings,
  getProductCostingById,
  createProductCosting,
  updateProductCosting,
  deleteProductCosting,
  duplicateProductCosting,
  // Order Costing
  getOrderCostings,
  getOrderCostingByInvoiceId,
  saveOrderCosting,
  deleteOrderCosting,
  // Expenses
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  // Overview & Reports
  getCostingOverview,
  getProfitReports,
  exportProfitReportsCSV
} from '../controllers/costingController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Strict Admin-only access guard - prevents internal costs/margins from public exposure
router.use(protectAdmin);

// Overview & Analytics
router.get('/overview', getCostingOverview);
router.get('/reports', getProfitReports);
router.get('/reports/export', exportProfitReportsCSV);

// Costing Settings
router.get('/settings', getCostingSettings);
router.put('/settings', updateCostingSettings);

// Cost Categories
router.get('/categories', getCostCategories);
router.post('/categories', createCostCategory);
router.put('/categories/:id', updateCostCategory);
router.delete('/categories/:id', deleteCostCategory);

// Product Costing Profiles
router.get('/products', getProductCostings);
router.get('/products/:id', getProductCostingById);
router.post('/products', createProductCosting);
router.put('/products/:id', updateProductCosting);
router.delete('/products/:id', deleteProductCosting);
router.post('/products/:id/duplicate', duplicateProductCosting);

// Order Costing
router.get('/orders', getOrderCostings);
router.get('/orders/invoice/:invoiceId', getOrderCostingByInvoiceId);
router.post('/orders', saveOrderCosting);
router.delete('/orders/:id', deleteOrderCosting);

// Expenses
router.get('/expenses', getExpenses);
router.get('/expenses/:id', getExpenseById);
router.post('/expenses', createExpense);
router.put('/expenses/:id', updateExpense);
router.delete('/expenses/:id', deleteExpense);

export default router;

