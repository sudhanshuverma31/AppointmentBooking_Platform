export type UserRole = 'USER' | 'OWNER' | 'ADMIN';
export type AppointmentMode = 'TIME' | 'TOKEN';
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
export type KYCStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'FAILED';
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED' | 'NO_SHOW';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  mobile?: string;
  avatar?: string;
}

export interface WorkingHour {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
  isActive: boolean;
}

export interface Owner {
  _id: string;
  userId: string;
  fullName: string;
  email: string;
  mobile: string;
  title: string;
  description: string;
  categoryId: Category | string;
  secondaryCategoryIds?: (Category | string)[];
  profileImage?: string;
  bannerImages?: string[];
  outletName: string;
  country: string;
  state: string;
  district?: string;
  address: string;
  appointmentMode: AppointmentMode;
  slotDurationMinutes: number;
  dailyCapacity: number;
  workingHours: WorkingHour[];
  activeStatus: 'ACTIVE' | 'INACTIVE';
  inactiveReason?: string;
  verificationStatus: VerificationStatus;
  verificationReason?: string;
  kycStatus: KYCStatus;
  kycProvider?: string;
  kycReferenceId?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  _id: string;
  userId: User | string;
  ownerId: Owner | string;
  categoryId: Category | string;
  customerName: string;
  age: number;
  gender: string;
  phone?: string;
  reason: string;
  appointmentDate: string;
  appointmentTime?: string;
  appointmentMode: AppointmentMode;
  tokenNumber?: number;
  status: AppointmentStatus;
  ownerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationRequest {
  _id: string;
  ownerId: Owner | string;
  identityType: string;
  kycReferenceId: string;
  businessDocUrl?: string;
  licenseNumber?: string;
  documentType?: string;
  additionalNotes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'INFO_REQUESTED';
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  timestamp: string;
}

export interface Report {
  _id: string;
  reporterUserId: User;
  ownerId: Owner;
  reason: string;
  description: string;
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  resolutionNotes?: string;
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'APPOINTMENT' | 'VERIFICATION' | 'SYSTEM';
  read: boolean;
  createdAt: string;
}
