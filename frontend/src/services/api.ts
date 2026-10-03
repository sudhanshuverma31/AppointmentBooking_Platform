import axios from 'axios';
import { clientCache } from './clientCache';
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

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Keep array-based UI state safe when APIs return a wrapped or empty response. */
export function asArray<T>(value: unknown, key?: string): T[] {
  if (Array.isArray(value)) return value as T[];
  if (key && value && typeof value === 'object') {
    const wrapped = (value as Record<string, unknown>)[key];
    if (Array.isArray(wrapped)) return wrapped as T[];
    if (wrapped && typeof wrapped === 'object') return asArray<T>(wrapped);
  }
  if (value && typeof value === 'object') {
    const wrapped = (value as Record<string, unknown>).data;
    if (Array.isArray(wrapped)) return wrapped as T[];
    if (wrapped && typeof wrapped === 'object') return asArray<T>(wrapped);
  }
  return [];
}

// Request interceptor to attach JWT Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('care_sync_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Helper to wrap Axios GET calls with ClientCache
 */
async function cachedGet<T>(url: string, params?: any, ttlSeconds: number = 300): Promise<{ data: T }> {
  const cacheKey = `${url}?${params ? JSON.stringify(params) : ''}`;
  const cached = clientCache.get<T>(cacheKey);
  if (cached !== null) {
    return { data: cached };
  }

  const response = await api.get<T>(url, { params });
  clientCache.set(cacheKey, response.data, ttlSeconds);
  return response;
}

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

// CATEGORY APIs (1 Hour Cache)
export const categoryApi = {
  getCategories: async () => {
    const response = await cachedGet<Category[] | { categories?: Category[] }>('/categories', undefined, 3600);
    return { ...response, data: asArray<Category>(response.data, 'categories') };
  },
  getAllAdmin: async () => {
    const response = await cachedGet<Category[] | { categories?: Category[] }>('/categories/admin', undefined, 300);
    return { ...response, data: asArray<Category>(response.data, 'categories') };
  },
  create: async (data: any) => {
    const res = await api.post<Category>('/categories', data);
    clientCache.invalidate('/categories');
    return res;
  },
  update: async (id: string, data: any) => {
    const res = await api.put<Category>(`/categories/${id}`, data);
    clientCache.invalidate('/categories');
    return res;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/categories/${id}`);
    clientCache.invalidate('/categories');
    return res;
  },
};

// OWNER APIs (5 Minutes Cache)
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
  }) => cachedGet<{ owners: Owner[]; pagination: any } | Owner[]>('/owners', params, 300).then((response) => {
    const owners = asArray<Owner>(response.data, 'owners');
    const raw = response.data as any;
    return {
      ...response,
      data: {
        owners,
        pagination: Array.isArray(raw) ? { total: owners.length, totalPages: 1, limit: owners.length } : raw?.pagination || { total: owners.length, totalPages: 1, limit: owners.length },
      },
    };
  }),

  getOwnerById: (id: string) => cachedGet<Owner>(`/owners/${id}`, undefined, 300),
  updateProfile: async (data: any) => {
    const res = await api.put<{ message: string; owner: Owner }>('/owner/profile', data);
    clientCache.invalidate('/owners');
    return res;
  },
  toggleStatus: async (data: { activeStatus: string; inactiveReason?: string }) => {
    const res = await api.patch('/owner/status', data);
    clientCache.invalidate('/owners');
    return res;
  },
  updateAvailability: async (data: any) => {
    const res = await api.put('/owner/availability', data);
    clientCache.invalidate('/owners');
    clientCache.invalidate('/appointments/available-slots');
    return res;
  },
  getDashboard: () => api.get<any>('/owner/dashboard'),
  downloadPdfReport: (params?: { startDate?: string; endDate?: string; status?: string }) =>
    api.get('/owner/pdf-report', { params, responseType: 'blob' }),
};

// APPOINTMENT APIs (30 Seconds Cache for Slots)
export const appointmentApi = {
  getAvailableSlots: (ownerId: string, date: string) =>
    cachedGet<any>('/appointments/available-slots', { ownerId, date }, 30),
  createAppointment: async (data: any) => {
    const res = await api.post<{ message: string; appointment: Appointment }>('/appointments', data);
    clientCache.invalidate('/appointments/available-slots');
    clientCache.invalidate('/appointments/my');
    return res;
  },
  getUserAppointments: async () => {
    const response = await api.get<Appointment[] | { appointments?: Appointment[] }>('/appointments/my');
    return { ...response, data: asArray<Appointment>(response.data, 'appointments') };
  },
  getOwnerAppointments: async (params?: { status?: string; date?: string; search?: string }) => {
    const response = await api.get<Appointment[] | { appointments?: Appointment[] }>('/appointments/owner', { params });
    return { ...response, data: asArray<Appointment>(response.data, 'appointments') };
  },
  updateStatus: async (id: string, status: string) => {
    const res = await api.patch<{ message: string; appointment: Appointment }>(`/appointments/${id}/status`, { status });
    clientCache.invalidate('/appointments/available-slots');
    return res;
  },
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

// ADMIN APIs (10 Minutes Cache for Metrics)
export const adminApi = {
  getMetrics: () => cachedGet<any>('/admin/metrics', undefined, 600),
  getPendingVerifications: async () => {
    const response = await api.get<VerificationRequest[] | { verifications?: VerificationRequest[] }>('/admin/verifications');
    return { ...response, data: asArray<VerificationRequest>(response.data, 'verifications') };
  },
  reviewVerification: (requestId: string, data: { action: string; adminNotes?: string }) =>
    api.post(`/admin/verifications/${requestId}/review`, data),
  getOwners: async (params?: { status?: string; search?: string }) => {
    const response = await api.get<Owner[] | { owners?: Owner[] }>('/admin/owners', { params });
    return { ...response, data: asArray<Owner>(response.data, 'owners') };
  },
  toggleSuspendOwner: (ownerId: string, data: { suspend: boolean; reason?: string }) =>
    api.patch(`/admin/owners/${ownerId}/suspend`, data),
  getReports: async () => {
    const response = await api.get<Report[] | { reports?: Report[] }>('/admin/reports');
    return { ...response, data: asArray<Report>(response.data, 'reports') };
  },
  resolveReport: (reportId: string, data: { status: string; resolutionNotes?: string; suspendOwner?: boolean }) =>
    api.post(`/admin/reports/${reportId}/resolve`, data),
  getAuditLogs: async () => {
    const response = await api.get<AuditLog[] | { auditLogs?: AuditLog[] }>('/admin/audit-logs');
    return { ...response, data: asArray<AuditLog>(response.data, 'auditLogs') };
  },
  getCacheStats: () => api.get<any>('/admin/cache-stats'),
  flushCache: () => api.delete<any>('/admin/cache-flush'),
};

// NOTIFICATION APIs
export const notificationApi = {
  getNotifications: async () => {
    const response = await api.get<{ notifications?: NotificationItem[]; unreadCount?: number }>('/notifications');
    return {
      ...response,
      data: {
        ...response.data,
        notifications: asArray<NotificationItem>(response.data, 'notifications'),
        unreadCount: response.data?.unreadCount || 0,
      },
    };
  },
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
};


// REPORT API
export const reportApi = {
  createReport: (data: { ownerId: string; reason: string; description: string }) =>
    api.post('/reports', data),
};

export default api;
