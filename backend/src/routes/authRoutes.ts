import { Router } from 'express';
import {
  registerUser,
  registerOwner,
  login,
  googleAuth,
  forgotPassword,
  resetPassword,
  getMe,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Apply strict rate limiting to prevent brute-force attacks
router.post('/register', authLimiter, registerUser);
router.post('/register-owner', authLimiter, registerOwner);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleAuth);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.get('/me', authenticate, getMe);

export default router;

