import { Router } from 'express';
import {
  getAvailableSlots,
  createAppointment,
  getUserAppointments,
  getOwnerAppointments,
  updateAppointmentStatus,
  updateOwnerNotes,
} from '../controllers/appointmentController.js';
import { authenticate, authorize, attachOwnerProfile } from '../middleware/auth.js';
import { cacheMiddleware, invalidateCache } from '../middleware/cacheMiddleware.js';
import { bookingLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Available slots cached for 30s (Short TTL)
router.get('/available-slots', cacheMiddleware(30, 'available-slots'), getAvailableSlots);

// Booking appointment uses bookingLimiter to prevent bot slot hoarding
router.post('/', authenticate, bookingLimiter, invalidateCache('available-slots'), createAppointment);
router.get('/my', authenticate, getUserAppointments);
router.get('/owner', authenticate, authorize(['OWNER']), attachOwnerProfile, getOwnerAppointments);
router.patch('/:id/status', authenticate, invalidateCache('available-slots'), updateAppointmentStatus);
router.patch('/:id/notes', authenticate, authorize(['OWNER']), attachOwnerProfile, updateOwnerNotes);

export default router;


