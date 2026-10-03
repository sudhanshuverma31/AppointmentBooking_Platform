import { Router } from 'express';
import { getNotifications, markAsRead, streamNotifications } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// SSE stream — auth handled inside controller via ?token= query param
router.get('/stream', streamNotifications);

// REST endpoints
router.get('/', authenticate, getNotifications);
router.patch('/:id/read', authenticate, markAsRead);

export default router;
