import express from 'express';
import { getHomepageSections, updateHomepageSections } from '../controllers/homepageController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getHomepageSections);
router.put('/', protectAdmin, updateHomepageSections);

export default router;
