import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Calendar, AlertOctagon, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ownerApi } from '../services/api';
import { Owner } from '../types';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { BannerCarousel } from '../components/BannerCarousel';
import { AppointmentModal } from '../components/AppointmentModal';
import { ReportModal } from '../components/ReportModal';

export const OwnerProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOwnerProfile(id);
    }
  }, [id]);

  const fetchOwnerProfile = async (ownerId: string) => {
    setLoading(true);
    try {
      const res = await ownerApi.getOwnerById(ownerId);
      setOwner(res.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to load owner profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (errorMsg || !owner) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 text-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Profile Not Found</h2>
          <p className="text-xs text-gray-500 mt-2">{errorMsg || 'This provider profile does not exist.'}</p>
          <Link
            to="/search"
            className="inline-block mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
          >
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  const categoryObj = typeof owner.categoryId === 'object' ? owner.categoryId : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 text-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Banner Section (Up to 5 images horizontal carousel) */}
        <BannerCarousel images={owner.bannerImages || []} />

        {/* Profile Main Header Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <img
                src={
                  owner.profileImage ||
                  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80'
                }
                alt={owner.fullName}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-600 shadow-md shrink-0"
              />

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-extrabold text-gray-900">{owner.fullName}</h1>
                  <VerifiedBadge status={owner.verificationStatus} size="md" />
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      owner.activeStatus === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {owner.activeStatus === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-sm font-bold text-emerald-700">{owner.outletName}</p>
                <p className="text-xs text-gray-600">{owner.title}</p>
                {categoryObj && (
                  <span className="inline-block mt-1 text-[11px] font-extrabold bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-md">
                    {categoryObj.name}
                  </span>
                )}
              </div>
            </div>

            {/* Main Action CTAs */}
            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setReportModalOpen(true)}
                className="px-3 py-2 border border-gray-200 hover:border-red-300 text-gray-600 hover:text-red-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>Report</span>
              </button>

              <button
                disabled={owner.activeStatus === 'INACTIVE'}
                onClick={() => setBookingModalOpen(true)}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>
                  {owner.activeStatus === 'ACTIVE' ? 'Book Appointment' : 'Currently Unavailable'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Description & Banner preview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-3">
              <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-2">
                About & Professional Bio
              </h3>
              <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                {owner.description}
              </p>
            </div>

            {/* Appointment Mode Explanation */}
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 space-y-2">
              <h4 className="font-bold text-xs text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Appointment System Engine</span>
              </h4>
              {owner.appointmentMode === 'TOKEN' ? (
                <p className="text-xs text-emerald-900 leading-relaxed">
                  This provider operates on a <strong>Token / Lot Based</strong> daily capacity system (Max:{' '}
                  {owner.dailyCapacity || 50} appointments/day). When you book, you receive an automated sequential token number.
                </p>
              ) : (
                <p className="text-xs text-emerald-900 leading-relaxed">
                  This provider operates on a <strong>Time Slot Based</strong> system ({owner.slotDurationMinutes} min duration per slot). Select an available time slot during booking to lock your appointment.
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Contact & Working Hours */}
          <div className="space-y-6">
            {/* Public Business Contact Info */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-2">
                Location & Business Info
              </h3>

              <div className="space-y-3 text-xs text-gray-700">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-gray-900">{owner.outletName}</span>
                    <p>{owner.address}</p>
                    <p className="text-gray-500">
                      {owner.district ? `${owner.district}, ` : ''}{owner.state}, {owner.country}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-gray-900">{owner.mobile}</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-gray-900">{owner.email}</span>
                </div>
              </div>
            </div>

            {/* Business Working Hours */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-3">
              <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Working Hours</span>
              </h3>

              <div className="divide-y divide-gray-100 text-xs">
                {(Array.isArray(owner.workingHours) ? owner.workingHours : []).map((wh) => (
                  <div key={wh.day} className="py-2 flex items-center justify-between">
                    <span className="font-semibold text-gray-800">{wh.day}</span>
                    {wh.isOpen ? (
                      <span className="font-medium text-emerald-700">
                        {wh.openTime} - {wh.closeTime}
                      </span>
                    ) : (
                      <span className="font-semibold text-gray-400">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Booking Modal */}
      {owner && (
        <AppointmentModal
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          owner={owner}
        />
      )}

      {/* Report Modal */}
      {owner && (
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          ownerId={owner._id}
          ownerName={owner.fullName}
        />
      )}
    </div>
  );
};
