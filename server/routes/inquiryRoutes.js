import express from 'express';
import {
  createInquiry,
  getMyInquiries,
  getAllInquiries,
  deleteInquiry
} from '../controllers/inquiryController.js';

const router = express.Router();

router.post('/', createInquiry);
router.get('/my', getMyInquiries);
router.get('/', getAllInquiries);
router.delete('/:id', deleteInquiry);

export default router;
