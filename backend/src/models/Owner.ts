import mongoose, { Schema, Document } from 'mongoose';

export type AppointmentMode = 'TIME' | 'TOKEN';
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
export type KYCStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'FAILED';

export interface IWorkingHour {
  day: string; // 'Monday', 'Tuesday', etc.
  isOpen: boolean;
  openTime: string; // '09:00'
  closeTime: string; // '18:00'
}

export interface IOwner extends Document {
  userId: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  mobile: string;
  title: string;
  description: string;
  categoryId: mongoose.Types.ObjectId;
  secondaryCategoryIds: mongoose.Types.ObjectId[];
  profileImage: string;
  bannerImages: string[];
  outletName: string;
  country: string;
  state: string;
  district?: string;
  address: string;
  appointmentMode: AppointmentMode;
  slotDurationMinutes: number;
  dailyCapacity: number;
  workingHours: IWorkingHour[];
  activeStatus: 'ACTIVE' | 'INACTIVE';
  inactiveReason?: string;
  verificationStatus: VerificationStatus;
  verificationReason?: string;
  kycStatus: KYCStatus;
  kycProvider?: string;
  kycReferenceId?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WorkingHourSchema = new Schema({
  day: { type: String, required: true },
  isOpen: { type: Boolean, default: true },
  openTime: { type: String, default: '09:00' },
  closeTime: { type: String, default: '17:00' }
}, { _id: false });

const OwnerSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    secondaryCategoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    profileImage: { type: String, default: '' },
    bannerImages: [{ type: String }],
    outletName: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    district: { type: String, trim: true, default: '' },
    address: { type: String, required: true, trim: true },
    appointmentMode: { type: String, enum: ['TIME', 'TOKEN'], default: 'TIME' },
    slotDurationMinutes: { type: Number, default: 30 },
    dailyCapacity: { type: Number, default: 50 },
    workingHours: {
      type: [WorkingHourSchema],
      default: [
        { day: 'Monday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
        { day: 'Tuesday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
        { day: 'Wednesday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
        { day: 'Thursday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
        { day: 'Friday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
        { day: 'Saturday', isOpen: true, openTime: '09:00', closeTime: '13:00' },
        { day: 'Sunday', isOpen: false, openTime: '09:00', closeTime: '13:00' }
      ]
    },
    activeStatus: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    inactiveReason: { type: String, default: '' },
    verificationStatus: {
      type: String,
      enum: ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'],
      default: 'UNVERIFIED'
    },
    verificationReason: { type: String, default: '' },
    kycStatus: {
      type: String,
      enum: ['UNVERIFIED', 'PENDING', 'VERIFIED', 'FAILED'],
      default: 'UNVERIFIED'
    },
    kycProvider: { type: String, default: 'DigiID Provider' },
    kycReferenceId: { type: String, default: '' },
    verifiedAt: { type: Date }
  },
  { timestamps: true }
);

// Indexes for fast searching
OwnerSchema.index({ fullName: 'text', outletName: 'text', title: 'text' });
OwnerSchema.index({ country: 1, state: 1, district: 1 });
OwnerSchema.index({ categoryId: 1 });
OwnerSchema.index({ verificationStatus: 1 });

export default mongoose.model<IOwner>('Owner', OwnerSchema);
