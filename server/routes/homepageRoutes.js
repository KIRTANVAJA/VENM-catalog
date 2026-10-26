import express from 'express';
import { getHomepageSections, updateHomepageSections, resolveLocalImagePath } from '../controllers/homepageController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getHomepageSections);
router.put('/', protectAdmin, updateHomepageSections);
router.post('/resolve-image', protectAdmin, resolveLocalImagePath);

export default router;
