import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Owner from '../models/Owner.js';
import Appointment from '../models/Appointment.js';
import VerificationRequest from '../models/VerificationRequest.js';
import { generateAppointmentPdf } from '../services/pdfService.js';
import { memoryStore } from '../config/memoryStore.js';

export const getOwners = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      category,
      country,
      state,
      district,
      verifiedOnly,
      sort = 'recommended',
      page = 1,
      limit = 10,
    } = req.query;

    if (mongoose.connection.readyState === 1) {
      const query: any = {};

      if (name && typeof name === 'string' && name.trim()) {
        const searchRegex = new RegExp(name.trim(), 'i');
        query.$or = [
          { fullName: searchRegex },
          { outletName: searchRegex },
          { title: searchRegex },
          { description: searchRegex },
        ];
      }

      if (category && typeof category === 'string' && category !== 'all') {
        query.$or = [{ categoryId: category }, { secondaryCategoryIds: category }];
      }

      if (country && typeof country === 'string' && country.trim()) {
        query.country = new RegExp(`^${country.trim()}$`, 'i');
      }
      if (state && typeof state === 'string' && state.trim()) {
        query.state = new RegExp(`^${state.trim()}$`, 'i');
      }
      if (district && typeof district === 'string' && district.trim()) {
        query.district = new RegExp(`^${district.trim()}$`, 'i');
      }

      if (verifiedOnly === 'true') {
        query.verificationStatus = 'VERIFIED';
      }

      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit as string, 10) || 10);
      const skip = (pageNum - 1) * limitNum;

      let sortObj: any = { createdAt: -1 };
      if (sort === 'name') sortObj = { fullName: 1 };
      if (sort === 'verified') sortObj = { verificationStatus: -1, createdAt: -1 };

      const total = await Owner.countDocuments(query);
      const owners = await Owner.find(query)
        .populate('categoryId', 'name icon slug')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum);

      if (owners && owners.length > 0) {
        res.json({
          owners,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
          },
        });
        return;
      }
    }

    // Memory Store Fallback Filtering
    let filtered = [...memoryStore.owners];

    if (name && typeof name === 'string' && name.trim()) {
      const q = name.trim().toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.fullName.toLowerCase().includes(q) ||
          o.outletName.toLowerCase().includes(q) ||
          o.title.toLowerCase().includes(q)
      );
    }

    if (category && typeof category === 'string' && category !== 'all') {
      filtered = filtered.filter((o) => (o.categoryId as any)._id === category);
    }

    if (country && typeof country === 'string' && country.trim()) {
      filtered = filtered.filter((o) => o.country.toLowerCase() === country.trim().toLowerCase());
    }
    if (state && typeof state === 'string' && state.trim()) {
      filtered = filtered.filter((o) => o.state.toLowerCase() === state.trim().toLowerCase());
    }
    if (district && typeof district === 'string' && district.trim()) {
      filtered = filtered.filter((o) => o.district?.toLowerCase() === district.trim().toLowerCase());
    }

    if (verifiedOnly === 'true') {
      filtered = filtered.filter((o) => o.verificationStatus === 'VERIFIED');
    }

    res.json({
      owners: filtered,
      pagination: {
        total: filtered.length,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    });
  } catch (err: any) {
    res.json({
      owners: memoryStore.owners,
      pagination: { total: memoryStore.owners.length, page: 1, limit: 10, totalPages: 1 },
    });
  }
};

export const getOwnerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      const owner = await Owner.findById(id)
        .populate('categoryId', 'name icon slug')
        .populate('secondaryCategoryIds', 'name icon slug');

      if (owner) {
        res.json(owner);
        return;
      }
    }

    const memoryOwner = memoryStore.owners.find((o) => o._id === id);
    if (memoryOwner) {
      res.json(memoryOwner);
      return;
    }

    res.status(404).json({ message: 'Owner profile not found' });
  } catch (err: any) {
    const memoryOwner = memoryStore.owners.find((o) => o._id === req.params.id);
    if (memoryOwner) res.json(memoryOwner);
    else res.status(404).json({ message: 'Owner profile not found' });
  }
};

export const updateOwnerProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const owner = req.owner;
    if (!owner) {
      res.status(404).json({ message: 'Owner profile not found' });
      return;
    }

    const {
      fullName,
      title,
      description,
      categoryId,
      secondaryCategoryIds,
      outletName,
      country,
      state,
      district,
      address,
      profileImage,
      bannerImages,
      mobile,
    } = req.body;

    let requiresReverification = false;
    if (owner.verificationStatus === 'VERIFIED') {
      if ((fullName && fullName !== owner.fullName) || (outletName && outletName !== owner.outletName)) {
        requiresReverification = true;
      }
    }

    if (fullName) owner.fullName = fullName;
    if (title) owner.title = title;
    if (description) owner.description = description;
    if (categoryId) owner.categoryId = categoryId;
    if (secondaryCategoryIds) owner.secondaryCategoryIds = secondaryCategoryIds;
    if (outletName) owner.outletName = outletName;
    if (country) owner.country = country;
    if (state) owner.state = state;
    if (district !== undefined) owner.district = district;
    if (address) owner.address = address;
    if (profileImage !== undefined) owner.profileImage = profileImage;
    if (bannerImages !== undefined) owner.bannerImages = bannerImages.slice(0, 5);
    if (mobile) owner.mobile = mobile;

    if (requiresReverification) {
      owner.verificationStatus = 'PENDING';
      owner.verificationReason = 'Sensitive identity field updated. Re-verification required by platform admin.';
    }

    if (mongoose.connection.readyState === 1) {
      await owner.save();
    }

    res.json({
      message: requiresReverification
        ? 'Profile updated. Changing verified name/outlet triggered re-verification.'
        : 'Profile updated successfully',
      owner,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update owner profile' });
  }
};

export const toggleOwnerStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const owner = req.owner;
    if (!owner) {
      res.status(404).json({ message: 'Owner profile not found' });
      return;
    }

    const { activeStatus, inactiveReason } = req.body;
    if (!['ACTIVE', 'INACTIVE'].includes(activeStatus)) {
      res.status(400).json({ message: 'Invalid active status' });
      return;
    }

    owner.activeStatus = activeStatus;
    owner.inactiveReason = activeStatus === 'INACTIVE' ? (inactiveReason || '') : '';

    if (mongoose.connection.readyState === 1) {
      await owner.save();
    }

    res.json({
      message: `Status updated to ${activeStatus}`,
      activeStatus: owner.activeStatus,
      inactiveReason: owner.inactiveReason,
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to toggle active status' });
  }
};

export const updateAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const owner = req.owner;
    if (!owner) {
      res.status(404).json({ message: 'Owner profile not found' });
      return;
    }

    const { appointmentMode, slotDurationMinutes, dailyCapacity, workingHours } = req.body;

    if (appointmentMode !== undefined && !['TIME', 'TOKEN'].includes(appointmentMode)) {
      res.status(400).json({ message: 'Appointment mode must be TIME or TOKEN' });
      return;
    }

    if (dailyCapacity !== undefined && (!Number.isInteger(Number(dailyCapacity)) || Number(dailyCapacity) < 1)) {
      res.status(400).json({ message: 'Daily token capacity must be a positive whole number' });
      return;
    }

    if (slotDurationMinutes !== undefined && (!Number.isInteger(Number(slotDurationMinutes)) || Number(slotDurationMinutes) < 1)) {
      res.status(400).json({ message: 'Slot duration must be a positive whole number' });
      return;
    }

    if (appointmentMode !== undefined) {
      owner.appointmentMode = appointmentMode;
    }
    if (slotDurationMinutes !== undefined) owner.slotDurationMinutes = Number(slotDurationMinutes);
    if (dailyCapacity !== undefined) owner.dailyCapacity = Number(dailyCapacity);
    if (workingHours && Array.isArray(workingHours)) {
      owner.workingHours = workingHours;
    }

    if (mongoose.connection.readyState === 1) {
      await owner.save();
    }

    res.json({
      message: 'Appointment & Availability settings updated',
      owner,
    });
  } catch (err: any) {
    console.error('Failed to update availability:', err?.message || err);
    res.status(500).json({ message: err?.message || 'Failed to update availability' });
  }
};

export const getOwnerDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const owner = req.owner || (memoryStore.owners[0] as any);
    const todayStr = new Date().toISOString().split('T')[0];

    let todayAppointments: any[] = [];
    let totalAppointments = 0;

    if (mongoose.connection.readyState === 1) {
      todayAppointments = await Appointment.find({
        ownerId: owner._id,
        appointmentDate: todayStr,
      }).sort({ createdAt: -1 });

      totalAppointments = await Appointment.countDocuments({ ownerId: owner._id });
    } else {
      todayAppointments = memoryStore.appointments.filter(a => a.ownerId === owner._id && a.appointmentDate === todayStr);
      totalAppointments = memoryStore.appointments.filter(a => a.ownerId === owner._id).length;
    }

    const totalToday = todayAppointments.length;
    const todayPending = todayAppointments.filter((a) => a.status === 'PENDING').length;
    const todayConfirmed = todayAppointments.filter((a) => a.status === 'CONFIRMED').length;
    const todayCompleted = todayAppointments.filter((a) => a.status === 'COMPLETED').length;
    const todayCancelled = todayAppointments.filter((a) => a.status === 'CANCELLED' || a.status === 'REJECTED').length;

    res.json({
      owner,
      metrics: {
        totalToday,
        todayPending,
        todayConfirmed,
        todayCompleted,
        todayCancelled,
        totalAppointments,
      },
      todayAppointments,
      hasPendingVerificationDoc: owner.verificationStatus === 'PENDING',
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to load owner dashboard' });
  }
};

export const downloadPdfReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const owner = req.owner || (memoryStore.owners[0] as any);
    const appointments = memoryStore.appointments as any;

    generateAppointmentPdf(res, owner, appointments, 'Appointment History Report');
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to generate PDF report' });
  }
};
