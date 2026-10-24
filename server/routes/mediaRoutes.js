import express from 'express';
import {
  getMedia,
  createMedia,
  deleteMedia,
  getUploadSignature
} from '../controllers/mediaController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Upload signature generation (Admin protected)
router.get('/upload-signature', protectAdmin, getUploadSignature);
router.post('/upload-signature', protectAdmin, getUploadSignature);

router.get('/', getMedia);
router.post('/', protectAdmin, createMedia);
router.delete('/:id', protectAdmin, deleteMedia);

export default router;
