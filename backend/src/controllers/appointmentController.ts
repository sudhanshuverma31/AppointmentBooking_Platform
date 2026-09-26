import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import Owner from '../models/Owner.js';
import User from '../models/User.js';
import { sendNotification } from '../services/notificationService.js';
import { memoryStore } from '../config/memoryStore.js';

export const getAvailableSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ownerId, date } = req.query;

    if (!ownerId || !date) {
      res.status(400).json({ message: 'ownerId and date (YYYY-MM-DD) are required' });
      return;
    }

    let owner: any = null;
    if (mongoose.connection.readyState === 1) {
      owner = await Owner.findById(ownerId);
    }
    if (!owner) {
      owner = memoryStore.owners.find((o) => o._id === ownerId);
    }

    if (!owner) {
      res.status(404).json({ message: 'Owner not found' });
      return;
    }

    if (owner.activeStatus === 'INACTIVE') {
      res.json({
        available: false,
        reason: owner.inactiveReason || 'Currently unavailable for appointments.',
        slots: [],
      });
      return;
    }

    const dateObj = new Date(date as string);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[dateObj.getDay()];

    const workingHour = owner.workingHours.find((wh: any) => wh.day === dayName);

    if (!workingHour || !workingHour.isOpen) {
      res.json({
        available: false,
        reason: `Closed on ${dayName}s`,
        slots: [],
      });
      return;
    }

    if (owner.appointmentMode === 'TOKEN') {
      let bookedCount = 0;
      if (mongoose.connection.readyState === 1) {
        bookedCount = await Appointment.countDocuments({
          ownerId: owner._id,
          appointmentDate: date as string,
          status: { $ne: 'CANCELLED' },
        });
      } else {
        bookedCount = memoryStore.appointments.filter(
          (a) => a.ownerId === owner._id && a.appointmentDate === date && a.status !== 'CANCELLED'
        ).length;
      }

      const capacityRemaining = Math.max(0, (owner.dailyCapacity || 50) - bookedCount);
      const isFull = capacityRemaining <= 0;

      res.json({
        mode: 'TOKEN',
        available: !isFull,
        dailyCapacity: owner.dailyCapacity || 50,
        bookedCount,
        capacityRemaining,
        nextToken: bookedCount + 1,
        reason: isFull ? "Today's appointments are full." : undefined,
      });
      return;
    }

    // TIME mode
    const slotDuration = owner.slotDurationMinutes || 30;
    const [startHour, startMin] = workingHour.openTime.split(':').map(Number);
    const [endHour, endMin] = workingHour.closeTime.split(':').map(Number);

    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    const allSlots: string[] = [];
    while (currentMinutes + slotDuration <= endMinutes) {
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;
      const period = h >= 12 ? 'PM' : 'AM';
      const displayHour = h % 12 === 0 ? 12 : h % 12;
      const displayMin = m < 10 ? `0${m}` : m;
      const slotTimeStr = `${displayHour}:${displayMin} ${period}`;

      allSlots.push(slotTimeStr);
      currentMinutes += slotDuration;
    }

    let bookedSlotsSet = new Set<string>();

    if (mongoose.connection.readyState === 1) {
      const booked = await Appointment.find({
        ownerId: owner._id,
        appointmentDate: date as string,
        status: { $ne: 'CANCELLED' },
      }).select('appointmentTime');
      bookedSlotsSet = new Set(booked.map((a) => a.appointmentTime!));
    } else {
      const booked = memoryStore.appointments.filter(
        (a) => a.ownerId === owner._id && a.appointmentDate === date && a.status !== 'CANCELLED'
      );
      bookedSlotsSet = new Set(booked.map((a) => a.appointmentTime!));
    }

    const slots = allSlots.map((timeStr) => ({
      time: timeStr,
      available: !bookedSlotsSet.has(timeStr),
    }));

    res.json({
      mode: 'TIME',
      available: slots.some((s) => s.available),
      slots,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch available slots' });
  }
};

export const createAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user ? req.user._id : 'user_demo_1';
    const { ownerId, customerName, age, gender, phone, reason, appointmentDate, appointmentTime } = req.body;

    if (!ownerId || !customerName || !age || !gender || !reason || !appointmentDate) {
      res.status(400).json({ message: 'All required appointment fields must be provided' });
      return;
    }

    let owner: any = null;
    if (mongoose.connection.readyState === 1) {
      owner = await Owner.findById(ownerId);
    }
    if (!owner) {
      owner = memoryStore.owners.find((o) => o._id === ownerId);
    }

    if (!owner) {
      res.status(404).json({ message: 'Owner profile not found' });
      return;
    }

    if (owner.activeStatus === 'INACTIVE') {
      res.status(400).json({ message: owner.inactiveReason || 'Owner is currently unavailable for appointments' });
      return;
    }

    let tokenNumber = 0;

    if (owner.appointmentMode === 'TOKEN') {
      let bookedCount = 0;
      if (mongoose.connection.readyState === 1) {
        bookedCount = await Appointment.countDocuments({
          ownerId: owner._id,
          appointmentDate,
          status: { $ne: 'CANCELLED' },
        });
      } else {
        bookedCount = memoryStore.appointments.filter(
          (a) => a.ownerId === owner._id && a.appointmentDate === appointmentDate && a.status !== 'CANCELLED'
        ).length;
      }

      if (bookedCount >= (owner.dailyCapacity || 50)) {
        res.status(400).json({ message: "Today's appointments are full for this provider." });
        return;
      }

      tokenNumber = bookedCount + 1;
    } else {
      if (!appointmentTime) {
        res.status(400).json({ message: 'Appointment time slot is required for time-based appointments' });
        return;
      }
    }

    const newAptData = {
      _id: `apt_${Date.now()}`,
      userId,
      ownerId: owner._id,
      categoryId: owner.categoryId,
      customerName,
      age: parseInt(age, 10),
      gender,
      phone: phone || (req.user ? req.user.mobile : ''),
      reason,
      appointmentDate,
      appointmentTime: owner.appointmentMode === 'TIME' ? appointmentTime : undefined,
      appointmentMode: owner.appointmentMode,
      tokenNumber: owner.appointmentMode === 'TOKEN' ? tokenNumber : undefined,
      status: 'PENDING' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (mongoose.connection.readyState === 1) {
      const created = await Appointment.create({
        ...newAptData,
        _id: undefined,
      });
      res.status(201).json({ message: 'Appointment booked successfully', appointment: created });
      return;
    }

    memoryStore.appointments.push(newAptData as any);

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment: newAptData,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to book appointment' });
  }
};

export const getUserAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user ? req.user._id.toString() : 'user_demo_1';
    if (mongoose.connection.readyState === 1) {
      const appointments = await Appointment.find({ userId })
        .populate({
          path: 'ownerId',
          select: 'fullName outletName title address city state district country profileImage verificationStatus activeStatus',
          populate: { path: 'categoryId', select: 'name icon' }
        })
        .sort({ createdAt: -1 });

      res.json(appointments);
      return;
    }

    // Fallback to in-memory store only when DB is not connected
    res.json(memoryStore.appointments.filter((a) => a.userId === userId));
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch appointments' });
  }
};

export const getOwnerAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const owner = req.owner;

    if (!owner) {
      res.status(401).json({ message: 'Owner profile not found' });
      return;
    }

    if (mongoose.connection.readyState === 1) {
      const appointments = await Appointment.find({ ownerId: owner._id })
        .populate('userId', 'name email mobile')
        .sort({ appointmentDate: -1, createdAt: -1 });
      res.json(appointments);
      return;
    }

    // Fallback to in-memory store only when DB is not connected
    res.json(memoryStore.appointments.filter((a) => a.ownerId === owner._id?.toString()));
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch appointments' });
  }
};

export const updateAppointmentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (mongoose.connection.readyState === 1) {
      const appointment = await Appointment.findById(id);
      if (appointment) {
        appointment.status = status;
        await appointment.save();
        res.json({ message: `Appointment status updated to ${status}`, appointment });
        return;
      }
    }

    const apt = memoryStore.appointments.find((a) => a._id === id);
    if (apt) {
      apt.status = status;
      res.json({ message: `Appointment status updated to ${status}`, appointment: apt });
      return;
    }

    res.status(404).json({ message: 'Appointment not found' });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to update status' });
  }
};

export const updateOwnerNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { ownerNotes } = req.body;

    if (mongoose.connection.readyState === 1) {
      const appointment = await Appointment.findById(id);
      if (appointment) {
        appointment.ownerNotes = ownerNotes || '';
        await appointment.save();
        res.json({ message: 'Private notes saved', ownerNotes: appointment.ownerNotes });
        return;
      }
    }

    const apt = memoryStore.appointments.find((a) => a._id === id);
    if (apt) {
      apt.ownerNotes = ownerNotes || '';
      res.json({ message: 'Private notes saved', ownerNotes: apt.ownerNotes });
      return;
    }

    res.status(404).json({ message: 'Appointment not found' });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to update owner notes' });
  }
};
