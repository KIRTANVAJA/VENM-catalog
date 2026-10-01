import express from 'express';
import {
  getCollections,
  getCollectionBySlug,
  createCollection,
  updateCollection,
  deleteCollection
} from '../controllers/collectionController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getCollections);
router.get('/:slug', getCollectionBySlug);

// Protected Admin Routes
router.post('/', protectAdmin, createCollection);
router.put('/:id', protectAdmin, updateCollection);
router.delete('/:id', protectAdmin, deleteCollection);

export default router;
