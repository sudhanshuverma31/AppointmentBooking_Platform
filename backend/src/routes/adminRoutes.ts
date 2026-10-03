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
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';
import { cacheService } from '../services/cacheService.js';

const router = Router();

router.use(authenticate, authorize(['ADMIN']));

// Heavy metrics query cached for 10 minutes (600s)
router.get('/metrics', cacheMiddleware(600, 'admin-metrics'), getAdminMetrics);
router.get('/verifications', getPendingVerifications);
router.post('/verifications/:requestId/review', reviewVerification);
router.get('/owners', getAdminOwners);
router.patch('/owners/:ownerId/suspend', toggleOwnerSuspend);
router.get('/reports', getAdminReports);
router.post('/reports/:reportId/resolve', resolveReport);
router.get('/audit-logs', getAuditLogs);

// Cache inspection & flush endpoints
router.get('/cache-stats', (_req, res) => {
  res.json({ activeKeys: cacheService.size(), status: 'Active' });
});

router.delete('/cache-flush', (_req, res) => {
  cacheService.clear();
  res.json({ message: 'All backend caches cleared successfully' });
});

export default router;


