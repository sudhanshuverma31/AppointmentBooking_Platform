import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, XCircle, CheckCircle2, AlertCircle, Bell, User as UserIcon, Wifi } from 'lucide-react';
import { appointmentApi } from '../services/api';
import { Appointment } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { VerifiedBadge } from '../components/VerifiedBadge';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const { notifications, unreadCount, isConnected, markRead, markAllRead } = useNotifications();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const aptRes = await appointmentApi.getUserAppointments();
      setAppointments(aptRes.data);
    } catch (err) {
      setErrorMsg('Failed to load user appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await appointmentApi.updateStatus(id, 'CANCELLED');
      fetchAppointments();
    } catch (err) {
      alert('Failed to cancel appointment');
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (statusFilter === 'ALL') return true;
    return apt.status === statusFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 text-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* User Profile Banner */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">{user?.name}</h1>
              <p className="text-xs text-gray-500">{user?.email} • {user?.mobile || 'No mobile listed'}</p>
              <span className="inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Customer Account
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Appointments Feed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span>My Appointments ({filteredAppointments.length})</span>
              </h2>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-32 bg-white rounded-2xl border border-gray-200 animate-pulse" />
                ))}
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-xs text-gray-500">
                No appointments found under current filter.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((apt) => {
                  const ownerObj = typeof apt.ownerId === 'object' ? (apt.ownerId as any) : null;

                  return (
                    <div
                      key={apt._id}
                      className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-base text-gray-900">
                              {ownerObj?.outletName || 'Service Provider'}
                            </h3>
                            {ownerObj && <VerifiedBadge status={ownerObj.verificationStatus} size="sm" />}
                          </div>
                          <p className="text-xs font-semibold text-emerald-700">{ownerObj?.fullName}</p>
                          <p className="text-[11px] text-gray-500">{ownerObj?.title}</p>
                        </div>

                        {/* Status Tag */}
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                            apt.status === 'CONFIRMED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : apt.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : apt.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-xl text-xs grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <div>
                          <span className="text-gray-400 block text-[10px] uppercase font-bold">Date</span>
                          <span className="font-bold text-gray-900">{apt.appointmentDate}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px] uppercase font-bold">Slot / Token</span>
                          <span className="font-bold text-emerald-700">
                            {apt.appointmentMode === 'TOKEN' ? `Token #${apt.tokenNumber}` : apt.appointmentTime}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px] uppercase font-bold">Reason</span>
                          <span className="font-medium text-gray-800 truncate block">{apt.reason}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      {['PENDING', 'CONFIRMED'].includes(apt.status) && (
                        <div className="pt-2 text-right">
                          <button
                            onClick={() => handleCancelAppointment(apt._id)}
                            className="px-3.5 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition"
                          >
                            Cancel Appointment
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Live Notifications Feed */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600" />
                <span>Activity & Notifications</span>
                {isConnected && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold ml-1">
                    <Wifi className="w-3 h-3" /> Live
                  </span>
                )}
              </h2>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="text-xs text-emerald-600 hover:underline font-medium"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-center text-xs text-gray-500 py-6">No recent notifications</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => !n.read && markRead(n._id)}
                    className={`py-3 text-xs space-y-1 rounded-lg px-1 transition ${
                      !n.read ? 'bg-emerald-50/60 font-semibold cursor-pointer' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-gray-900">{n.title}</p>
                      {!n.read && (
                        <span className="w-2 h-2 mt-0.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-gray-600 text-[11px]">{n.message}</p>
                    <span className="text-[10px] text-gray-400 block">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
