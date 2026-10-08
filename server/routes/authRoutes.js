import express from 'express';
import { login, register, logout, getMe, getAllUsers, deleteUser } from '../controllers/authController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
router.get('/me', protectAdmin, getMe);
router.get('/users', protectAdmin, getAllUsers);
router.delete('/users/:id', protectAdmin, deleteUser);

export default router;

