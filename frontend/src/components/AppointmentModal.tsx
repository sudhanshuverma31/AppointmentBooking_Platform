import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Phone, FileText, CheckCircle2, AlertTriangle, Hash } from 'lucide-react';
import { Owner } from '../types';
import { appointmentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  owner: Owner;
  onSuccess?: () => void;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  owner,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [appointmentDate, setAppointmentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>(user?.name || '');
  const [age, setAge] = useState<string>('28');
  const [gender, setGender] = useState<string>('Male');
  const [phone, setPhone] = useState<string>(user?.mobile || '');
  const [reason, setReason] = useState<string>('');

  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [availabilityData, setAvailabilityData] = useState<any>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);

  useEffect(() => {
    if (user) {
      setCustomerName(user.name);
      if (user.mobile) setPhone(user.mobile);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && owner && appointmentDate) {
      fetchSlots();
    }
  }, [isOpen, owner, appointmentDate]);

  const fetchSlots = async () => {
    setLoadingSlots(true);
    setErrorMsg('');
    try {
      const res = await appointmentApi.getAvailableSlots(owner._id, appointmentDate);
      setAvailabilityData(res.data);
      if (res.data?.slots && res.data.slots.length > 0) {
        const availableSlot = res.data.slots.find((s: any) => s.available);
        if (availableSlot) setSelectedTimeSlot(availableSlot.time);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to check availability slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !age || !reason.trim()) {
      setErrorMsg('Please complete all required fields');
      return;
    }

    if (owner.appointmentMode === 'TIME' && !selectedTimeSlot) {
      setErrorMsg('Please select an available time slot');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        ownerId: owner._id,
        customerName: customerName.trim(),
        age: parseInt(age, 10),
        gender,
        phone,
        reason: reason.trim(),
        appointmentDate,
        appointmentTime: owner.appointmentMode === 'TIME' ? selectedTimeSlot : undefined,
      };

      const res = await appointmentApi.createAppointment(payload);
      setBookingSuccess(res.data.appointment);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full my-8 overflow-hidden shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-emerald-900 to-gray-900 text-white">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              Book Appointment
            </span>
            <h3 className="font-extrabold text-lg text-white">{owner.outletName}</h3>
            <p className="text-xs text-gray-300">{owner.fullName} ({owner.title})</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-300 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {bookingSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold text-gray-900">Appointment Confirmed!</h4>
            <p className="text-xs text-gray-600">
              Your appointment request has been submitted to <span className="font-bold">{owner.outletName}</span>.
            </p>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span className="font-bold text-gray-900">{bookingSuccess.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date:</span>
                <span className="font-bold text-gray-900">{bookingSuccess.appointmentDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Mode:</span>
                <span className="font-bold text-emerald-700">
                  {bookingSuccess.appointmentMode === 'TOKEN' ? `Token #${bookingSuccess.tokenNumber}` : bookingSuccess.appointmentTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className="font-bold text-amber-700 uppercase">{bookingSuccess.status}</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-400">
              Confirmation notification dispatched via Email & WhatsApp simulation.
            </p>

            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Date Picker */}
            <div>
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Select Appointment Date</span>
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500 shadow-sm"
              />
            </div>

            {/* Availability Section */}
            <div>
              {loadingSlots ? (
                <div className="p-4 bg-gray-50 rounded-xl text-center text-xs text-gray-500 animate-pulse">
                  Checking availability schedule...
                </div>
              ) : availabilityData?.available === false ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs font-semibold text-amber-800">
                  {availabilityData.reason || 'Provider unavailable for selected date'}
                </div>
              ) : owner.appointmentMode === 'TOKEN' ? (
                /* Mode B — Token Counter */
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center text-base">
                      <Hash className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-emerald-900 block">Token / Lot System</span>
                      <span className="text-[11px] text-emerald-700">
                        Assigned Token: <strong className="text-emerald-950 font-extrabold">#{availabilityData?.nextToken || 1}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Daily Capacity</span>
                    <span className="text-xs font-extrabold text-emerald-800">
                      {availabilityData?.bookedCount || 0} / {owner.dailyCapacity || 50} Booked
                    </span>
                  </div>
                </div>
              ) : (
                /* Mode A — Time Slot Selection */
                <div>
                  <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>Select Time Slot</span>
                  </label>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                    {availabilityData?.slots?.map((slotObj: any) => (
                      <button
                        key={slotObj.time}
                        type="button"
                        disabled={!slotObj.available}
                        onClick={() => setSelectedTimeSlot(slotObj.time)}
                        className={`py-2 px-3 text-xs font-bold rounded-xl transition border text-center ${
                          !slotObj.available
                            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed line-through'
                            : selectedTimeSlot === slotObj.time
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-105'
                            : 'bg-white border-gray-300 text-gray-800 hover:border-emerald-500 hover:bg-emerald-50'
                        }`}
                      >
                        {slotObj.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Customer Information Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span>Full Name *</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Your Full Name"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Age *</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Gender *</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>Mobile Phone</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                <span>Reason for Appointment *</span>
              </label>
              <textarea
                rows={2}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Brief description of consultation requirement or service needed..."
                className="w-full bg-white border border-gray-300 rounded-xl p-3 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || availabilityData?.available === false}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {submitting ? 'Confirming...' : 'Confirm Appointment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
