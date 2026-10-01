import express from 'express';
import {
  getCampaigns,
  getActiveCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign
} from '../controllers/campaignController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getCampaigns);
router.get('/active', getActiveCampaign);

// Protected Admin Routes
router.post('/', protectAdmin, createCampaign);
router.put('/:id', protectAdmin, updateCampaign);
router.delete('/:id', protectAdmin, deleteCampaign);

export default router;
