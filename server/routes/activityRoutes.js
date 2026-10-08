import express from 'express';
import {
  getActivityLogs,
  getDashboardStats,
  getLiveUserAnalytics,
  recordHeartbeat,
  recordProductView,
  streamActivity
} from '../controllers/activityController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/logs', protectAdmin, getActivityLogs);
router.get('/dashboard-stats', protectAdmin, getDashboardStats);
router.get('/live-analytics', protectAdmin, getLiveUserAnalytics);
router.get('/stream', streamActivity);

// Public analytics endpoints from client app
router.post('/heartbeat', recordHeartbeat);
router.post('/product-view', recordProductView);

export default router;
