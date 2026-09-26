import { Router } from 'express';
import {
  submitVerification,
  getVerificationStatus,
} from '../controllers/verificationController.js';
import { authenticate, authorize, attachOwnerProfile } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.post(
  '/submit',
  authenticate,
  authorize(['OWNER']),
  attachOwnerProfile,
  upload.single('businessDocument'),
  submitVerification
);

router.get(
  '/status',
  authenticate,
  authorize(['OWNER']),
  attachOwnerProfile,
  getVerificationStatus
);

export default router;
