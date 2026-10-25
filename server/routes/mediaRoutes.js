import express from 'express';
import {
  getMedia,
  createMedia,
  deleteMedia,
  getUploadSignature,
  getCloudinaryDiagnosticStatus
} from '../controllers/mediaController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Upload signature generation & diagnostic (Admin protected)
router.get('/upload-signature', protectAdmin, getUploadSignature);
router.post('/upload-signature', protectAdmin, getUploadSignature);
router.get('/cloudinary-diagnostic', protectAdmin, getCloudinaryDiagnosticStatus);

router.get('/', getMedia);
router.post('/', protectAdmin, createMedia);
router.delete('/:id', protectAdmin, deleteMedia);

export default router;
