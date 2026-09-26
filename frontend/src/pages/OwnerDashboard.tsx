import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  ShieldCheck,
  Power,
  FileText,
  User as UserIcon,
  Settings,
  Plus,
  Hash,
} from 'lucide-react';
import { ownerApi, appointmentApi, verificationApi } from '../services/api';
import { Owner, Appointment } from '../types';
import { useAuth } from '../context/AuthContext';
import { VerifiedBadge } from '../components/VerifiedBadge';

export const OwnerDashboard: React.FC = () => {
  const { owner, updateOwnerState } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Active / Inactive State
  const [activeStatus, setActiveStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [inactiveReason, setInactiveReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Private Notes Drawer
  const [editingNotesApt, setEditingNotesApt] = useState<Appointment | null>(null);
  const [notesText, setNotesText] = useState('');

  // Document Upload for Verification
  const [docFile, setDocFile] = useState<File | null>(null);
  const [identityType, setIdentityType] = useState('Aadhaar / Government Verified ID');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState('');

  // Availability Settings
  const [appointmentMode, setAppointmentMode] = useState<'TIME' | 'TOKEN'>('TIME');
  const [dailyCapacity, setDailyCapacity] = useState(50);
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(30);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [dashResult, aptResult] = await Promise.allSettled([
        ownerApi.getDashboard(),
        appointmentApi.getOwnerAppointments(),
      ]);

      if (dashResult.status === 'fulfilled') {
        const dashboard = dashResult.value.data;
        setDashboardData(dashboard);

        if (dashboard.owner) {
          setActiveStatus(dashboard.owner.activeStatus);
          setInactiveReason(dashboard.owner.inactiveReason || '');
          setAppointmentMode(dashboard.owner.appointmentMode || 'TIME');
          setDailyCapacity(dashboard.owner.dailyCapacity || 50);
          setSlotDurationMinutes(dashboard.owner.slotDurationMinutes || 30);
        }
      } else {
        setErrorMsg('Failed to load owner dashboard details');
      }

      if (aptResult.status === 'fulfilled') {
        setAppointments(aptResult.value.data);
      } else {
        setAppointments([]);
        setErrorMsg('Failed to load appointment queue');
      }
    } catch (err: any) {
      setErrorMsg('Failed to load owner dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    setUpdatingStatus(true);
    const newStatus = activeStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await ownerApi.toggleStatus({ activeStatus: newStatus, inactiveReason });
      setActiveStatus(newStatus);
      if (owner) {
        updateOwnerState({ ...owner, activeStatus: newStatus, inactiveReason });
      }
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAppointmentStatusChange = async (id: string, newStatus: string) => {
    try {
      await appointmentApi.updateStatus(id, newStatus);
      fetchDashboard();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleSaveNotes = async () => {
    if (!editingNotesApt) return;
    try {
      await appointmentApi.updateNotes(editingNotesApt._id, notesText);
      setEditingNotesApt(null);
      fetchDashboard();
    } catch (err) {
      alert('Failed to save notes');
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingVerification(true);
    setVerificationSuccess('');
    try {
      const formData = new FormData();
      formData.append('identityType', identityType);
      formData.append('licenseNumber', licenseNumber);
      if (docFile) {
        formData.append('businessDocument', docFile);
      }

      await verificationApi.submitVerification(formData);
      setVerificationSuccess('Verification documents submitted. Status set to PENDING admin review.');
      fetchDashboard();
    } catch (err: any) {
      alert('Verification submission failed');
    } finally {
      setSubmittingVerification(false);
    }
  };

  const handleSaveAvailability = async () => {
    try {
      await ownerApi.updateAvailability({
        appointmentMode,
        dailyCapacity,
        slotDurationMinutes,
      });
      alert('Availability & Appointment Mode settings saved successfully!');
      fetchDashboard();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save availability');
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const response = await ownerApi.downloadPdfReport();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `appointment_history_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download PDF report');
    }
  };

  const currentOwner = dashboardData?.owner || owner;
  const metrics = dashboardData?.metrics || {
    totalToday: 0,
    todayPending: 0,
    todayConfirmed: 0,
    todayCompleted: 0,
    todayCancelled: 0,
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (statusFilter === 'ALL') return true;
    return apt.status === statusFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header & Status Toggle Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-gray-900">{currentOwner?.outletName}</h1>
              {currentOwner && <VerifiedBadge status={currentOwner.verificationStatus} size="md" />}
            </div>
            <p className="text-xs text-gray-600">
              {currentOwner?.fullName} ({currentOwner?.title}) • {currentOwner?.state}, {currentOwner?.country}
            </p>
          </div>

          {/* Active / Inactive Status Switcher */}
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
            <div>
              <span className="text-xs font-bold text-gray-900 block">
                Status: {activeStatus === 'ACTIVE' ? '🟢 AVAILABLE' : '🔴 UNAVAILABLE'}
              </span>
              {activeStatus === 'INACTIVE' && (
                <input
                  type="text"
                  placeholder="Reason (e.g. On vacation until Mon)..."
                  value={inactiveReason}
                  onChange={(e) => setInactiveReason(e.target.value)}
                  className="mt-1 border border-gray-300 text-[11px] p-1 rounded w-48"
                />
              )}
            </div>
            <button
              onClick={handleStatusToggle}
              disabled={updatingStatus}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold text-white transition ${
                activeStatus === 'ACTIVE'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {activeStatus === 'ACTIVE' ? 'Set Inactive' : 'Set Active'}
            </button>
          </div>
        </div>

        {/* Verification Alert Banner */}
        {currentOwner?.verificationStatus !== 'VERIFIED' && (
          <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <h3 className="font-bold text-sm text-amber-900">
                  Profile Verification Status: {currentOwner?.verificationStatus || 'UNVERIFIED'}
                </h3>
                <p className="text-xs text-amber-800">
                  Submit your business license & identity documents to earn the public ✓ Verified badge.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm text-center">
            <span className="text-[10px] uppercase font-bold text-gray-400">Today Total</span>
            <p className="text-2xl font-extrabold text-gray-900">{metrics.totalToday}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/50 shadow-sm text-center">
            <span className="text-[10px] uppercase font-bold text-amber-700">Today Pending</span>
            <p className="text-2xl font-extrabold text-amber-900">{metrics.todayPending}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 shadow-sm text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-700">Today Confirmed</span>
            <p className="text-2xl font-extrabold text-emerald-900">{metrics.todayConfirmed}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-700">Today Completed</span>
            <p className="text-2xl font-extrabold text-emerald-950">{metrics.todayCompleted}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-red-200 bg-red-50/50 shadow-sm text-center">
            <span className="text-[10px] uppercase font-bold text-red-700">Cancelled / Rejected</span>
            <p className="text-2xl font-extrabold text-red-900">{metrics.todayCancelled}</p>
          </div>
        </div>

        {/* Main Dashboard Tabs / Workspaces */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Appointments Management Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span>Appointment Queue ({filteredAppointments.length})</span>
              </h2>

              <div className="flex items-center gap-3">
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

                <button
                  onClick={handleDownloadPdf}
                  className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PDF Report</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="h-64 bg-white rounded-2xl animate-pulse" />
            ) : filteredAppointments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-xs text-gray-500">
                No appointments found for current filter.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((apt) => (
                  <div
                    key={apt._id}
                    className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-gray-900">{apt.customerName}</h3>
                          <span className="text-xs text-gray-500">
                            ({apt.age} y/o, {apt.gender})
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">Reason: {apt.reason}</p>
                        {apt.phone && <p className="text-[11px] text-gray-500">Phone: {apt.phone}</p>}
                      </div>

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

                    <div className="bg-gray-50 p-3 rounded-xl text-xs flex items-center justify-between">
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Booking Slot</span>
                        <span className="font-bold text-emerald-800">
                          {apt.appointmentDate} | {apt.appointmentMode === 'TOKEN' ? `Token #${apt.tokenNumber}` : apt.appointmentTime}
                        </span>
                      </div>

                      {/* Notes button */}
                      <button
                        onClick={() => {
                          setEditingNotesApt(apt);
                          setNotesText(apt.ownerNotes || '');
                        }}
                        className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{apt.ownerNotes ? 'Edit Notes' : '+ Add Note'}</span>
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                      {apt.status === 'PENDING' && (
                        <button
                          onClick={() => handleAppointmentStatusChange(apt._id, 'CONFIRMED')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg"
                        >
                          Confirm
                        </button>
                      )}
                      {['PENDING', 'CONFIRMED'].includes(apt.status) && (
                        <button
                          onClick={() => handleAppointmentStatusChange(apt._id, 'COMPLETED')}
                          className="px-3 py-1 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-lg"
                        >
                          Complete
                        </button>
                      )}
                      {['PENDING', 'CONFIRMED'].includes(apt.status) && (
                        <button
                          onClick={() => handleAppointmentStatusChange(apt._id, 'CANCELLED')}
                          className="px-3 py-1 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-lg"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Settings & Verification Upload */}
          <div className="space-y-6">
            {/* Availability Mode Settings */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-emerald-600" />
                <span>Appointment System Settings</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Appointment Mode</label>
                  <select
                    value={appointmentMode}
                    onChange={(e) => setAppointmentMode(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-xl p-2 font-semibold"
                  >
                    <option value="TIME">Mode A — Time Slot Based</option>
                    <option value="TOKEN">Mode B — Token / Lot Capacity</option>
                  </select>
                </div>

                {appointmentMode === 'TOKEN' ? (
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Daily Token Capacity</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={dailyCapacity}
                      onChange={(e) => setDailyCapacity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full border border-gray-300 rounded-xl p-2 font-semibold"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Slot Duration (Minutes)</label>
                    <input
                      type="number"
                      value={slotDurationMinutes}
                      onChange={(e) => setSlotDurationMinutes(parseInt(e.target.value, 10))}
                      className="w-full border border-gray-300 rounded-xl p-2 font-semibold"
                    />
                  </div>
                )}

                <button
                  onClick={handleSaveAvailability}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition"
                >
                  Save Settings
                </button>
              </div>
            </div>

            {/* Document Upload for Admin Verification */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Submit Verification Documents</span>
              </h3>

              {verificationSuccess && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-medium">
                  {verificationSuccess}
                </div>
              )}

              <form onSubmit={handleVerificationSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Identity Type</label>
                  <select
                    value={identityType}
                    onChange={(e) => setIdentityType(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-2 font-semibold"
                  >
                    <option value="Aadhaar / Government Verified ID">Aadhaar / Government Verified ID</option>
                    <option value="Passport / Driving License">Passport / Driving License</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Professional License / Reg Number</label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. MCI-2019-99201"
                    className="w-full border border-gray-300 rounded-xl p-2 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Business Document (PDF / Image)</label>
                  <input
                    type="file"
                    onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                    className="w-full text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingVerification}
                  className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition"
                >
                  {submittingVerification ? 'Submitting...' : 'Submit Verification'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Private Notes Modal */}
      {editingNotesApt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-base text-gray-900">Private Owner Notes</h3>
            <p className="text-xs text-gray-500">
              Notes for appointment with <strong className="text-gray-800">{editingNotesApt.customerName}</strong>. These notes are completely private.
            </p>

            <textarea
              rows={4}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="e.g. Patient requested follow-up next Tuesday..."
              className="w-full border border-gray-300 rounded-xl p-3 text-xs"
            />

            <div className="flex justify-end gap-3">
              <button onClick={() => setEditingNotesApt(null)} className="text-xs font-bold text-gray-500">
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl"
              >
                Save Private Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
