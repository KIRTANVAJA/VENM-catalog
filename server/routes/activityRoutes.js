import express from 'express';
import { getActivityLogs, getDashboardStats, streamActivity } from '../controllers/activityController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/logs', protectAdmin, getActivityLogs);
router.get('/dashboard-stats', protectAdmin, getDashboardStats);
router.get('/stream', protectAdmin, streamActivity);

export default router;
