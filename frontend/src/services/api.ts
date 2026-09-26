import axios from 'axios';
import {
  User,
  Owner,
  Category,
  Appointment,
  VerificationRequest,
  AuditLog,
  Report,
  NotificationItem,
} from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('care_sync_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// AUTH APIs
export const authApi = {
  registerUser: (data: any) => api.post('/auth/register', data),
  registerOwner: (data: any) => api.post('/auth/register-owner', data),
  login: (data: any) => api.post('/auth/login', data),
  googleAuth: (data: any) => api.post('/auth/google', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: any) => api.post('/auth/reset-password', data),
  getMe: () => api.get<{ user: User; owner: Owner | null }>('/auth/me'),
};

// CATEGORY APIs
export const categoryApi = {
  getCategories: () => api.get<Category[]>('/categories'),
  getAllAdmin: () => api.get<Category[]>('/categories/admin'),
  create: (data: any) => api.post<Category>('/categories', data),
  update: (id: string, data: any) => api.put<Category>(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// OWNER APIs
export const ownerApi = {
  getOwners: (params: {
    name?: string;
    category?: string;
    country?: string;
    state?: string;
    district?: string;
    verifiedOnly?: boolean;
    sort?: string;
    page?: number;
    limit?: number;
  }) => api.get<{ owners: Owner[]; pagination: any }>('/owners', { params }),

  getOwnerById: (id: string) => api.get<Owner>(`/owners/${id}`),
  updateProfile: (data: any) => api.put<{ message: string; owner: Owner }>('/owner/profile', data),
  toggleStatus: (data: { activeStatus: string; inactiveReason?: string }) => api.patch('/owner/status', data),
  updateAvailability: (data: any) => api.put('/owner/availability', data),
  getDashboard: () => api.get<any>('/owner/dashboard'),
  downloadPdfReport: (params?: { startDate?: string; endDate?: string; status?: string }) =>
    api.get('/owner/pdf-report', { params, responseType: 'blob' }),
};

// APPOINTMENT APIs
export const appointmentApi = {
  getAvailableSlots: (ownerId: string, date: string) =>
    api.get<any>('/appointments/available-slots', { params: { ownerId, date } }),
  createAppointment: (data: any) => api.post<{ message: string; appointment: Appointment }>('/appointments', data),
  getUserAppointments: () => api.get<Appointment[]>('/appointments/my'),
  getOwnerAppointments: (params?: { status?: string; date?: string; search?: string }) =>
    api.get<Appointment[]>('/appointments/owner', { params }),
  updateStatus: (id: string, status: string) => api.patch<{ message: string; appointment: Appointment }>(`/appointments/${id}/status`, { status }),
  updateNotes: (id: string, ownerNotes: string) => api.patch(`/appointments/${id}/notes`, { ownerNotes }),
};

// VERIFICATION APIs
export const verificationApi = {
  submitVerification: (formData: FormData) =>
    api.post('/verification/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getStatus: () => api.get<any>('/verification/status'),
};

// ADMIN APIs
export const adminApi = {
  getMetrics: () => api.get<any>('/admin/metrics'),
  getPendingVerifications: () => api.get<VerificationRequest[]>('/admin/verifications'),
  reviewVerification: (requestId: string, data: { action: string; adminNotes?: string }) =>
    api.post(`/admin/verifications/${requestId}/review`, data),
  getOwners: (params?: { status?: string; search?: string }) => api.get<Owner[]>('/admin/owners', { params }),
  toggleSuspendOwner: (ownerId: string, data: { suspend: boolean; reason?: string }) =>
    api.patch(`/admin/owners/${ownerId}/suspend`, data),
  getReports: () => api.get<Report[]>('/admin/reports'),
  resolveReport: (reportId: string, data: { status: string; resolutionNotes?: string; suspendOwner?: boolean }) =>
    api.post(`/admin/reports/${reportId}/resolve`, data),
  getAuditLogs: () => api.get<AuditLog[]>('/admin/audit-logs'),
};

// NOTIFICATION APIs
export const notificationApi = {
  getNotifications: () => api.get<{ notifications: NotificationItem[]; unreadCount: number }>('/notifications'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
};

// REPORT API
export const reportApi = {
  createReport: (data: { ownerId: string; reason: string; description: string }) =>
    api.post('/reports', data),
};

export default api;
