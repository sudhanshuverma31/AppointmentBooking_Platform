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

const router = Router();

router.get('/available-slots', getAvailableSlots);
router.post('/', authenticate, createAppointment);
router.get('/my', authenticate, getUserAppointments);
router.get('/owner', authenticate, authorize(['OWNER']), attachOwnerProfile, getOwnerAppointments);
router.patch('/:id/status', authenticate, updateAppointmentStatus);
router.patch('/:id/notes', authenticate, authorize(['OWNER']), attachOwnerProfile, updateOwnerNotes);

export default router;
