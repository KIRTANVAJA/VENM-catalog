import express from 'express';
import { getMedia, createMedia, deleteMedia } from '../controllers/mediaController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getMedia);
router.post('/', protectAdmin, createMedia);
router.delete('/:id', protectAdmin, deleteMedia);

export default router;
