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

const router = Router();

router.get('/', getOwners);
router.get('/dashboard', authenticate, authorize(['OWNER']), attachOwnerProfile, getOwnerDashboard);
router.get('/pdf-report', authenticate, authorize(['OWNER']), attachOwnerProfile, downloadPdfReport);
router.get('/:id', getOwnerById);

router.put('/profile', authenticate, authorize(['OWNER']), attachOwnerProfile, updateOwnerProfile);
router.patch('/status', authenticate, authorize(['OWNER']), attachOwnerProfile, toggleOwnerStatus);
router.put('/availability', authenticate, authorize(['OWNER']), attachOwnerProfile, updateAvailability);

export default router;
