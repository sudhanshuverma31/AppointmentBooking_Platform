import { Router } from 'express';
import {
  getAdminMetrics,
  getPendingVerifications,
  reviewVerification,
  getAdminOwners,
  toggleOwnerSuspend,
  getAdminReports,
  resolveReport,
  getAuditLogs,
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, authorize(['ADMIN']));

router.get('/metrics', getAdminMetrics);
router.get('/verifications', getPendingVerifications);
router.post('/verifications/:requestId/review', reviewVerification);
router.get('/owners', getAdminOwners);
router.patch('/owners/:ownerId/suspend', toggleOwnerSuspend);
router.get('/reports', getAdminReports);
router.post('/reports/:reportId/resolve', resolveReport);
router.get('/audit-logs', getAuditLogs);

export default router;
