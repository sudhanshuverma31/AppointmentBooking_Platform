import { Router } from 'express';
import {
  getOwners,
  getOwnerById,
  updateOwnerProfile,
  toggleOwnerStatus,
  updateAvailability,
  getOwnerDashboard,
  downloadPdfReport,
} from '../controllers/ownerController.js';
import { authenticate, authorize, attachOwnerProfile } from '../middleware/auth.js';
import { cacheMiddleware, invalidateCache } from '../middleware/cacheMiddleware.js';

const router = Router();

// Public doctor/provider listings cached for 10 minutes (600s)
router.get('/', cacheMiddleware(600, 'owners'), getOwners);
router.get('/dashboard', authenticate, authorize(['OWNER']), attachOwnerProfile, getOwnerDashboard);
router.get('/pdf-report', authenticate, authorize(['OWNER']), attachOwnerProfile, downloadPdfReport);
router.get('/:id', cacheMiddleware(600, 'owner-detail'), getOwnerById);

// Owner profile/availability updates invalidate doctor list and detail caches
router.put('/profile', authenticate, authorize(['OWNER']), attachOwnerProfile, invalidateCache('owners', 'owner-detail'), updateOwnerProfile);
router.patch('/status', authenticate, authorize(['OWNER']), attachOwnerProfile, invalidateCache('owners', 'owner-detail'), toggleOwnerStatus);
router.put('/availability', authenticate, authorize(['OWNER']), attachOwnerProfile, invalidateCache('owners', 'owner-detail', 'available-slots'), updateAvailability);

export default router;

