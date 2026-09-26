import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search as SearchIcon,
  ShieldCheck,
  CalendarCheck,
  Clock,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Stethoscope,
  Smile,
  Scissors,
  Dumbbell,
  Briefcase,
  Scale,
  BookOpen,
  Wrench,
  Sparkles,
  Users,
  Award,
} from 'lucide-react';
import { categoryApi, ownerApi } from '../services/api';
import { Category, Owner } from '../types';
import { LocationSelector } from '../components/LocationSelector';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { AppointmentModal } from '../components/AppointmentModal';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredOwners, setFeaturedOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);

  // Search State
  const [nameQuery, setNameQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [country, setCountry] = useState('India');
  const [state, setState] = useState('Uttar Pradesh');
  const [district, setDistrict] = useState('Lucknow');

  // Booking Modal State
  const [selectedOwnerForBooking, setSelectedOwnerForBooking] = useState<Owner | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [catRes, ownerRes] = await Promise.all([
        categoryApi.getCategories(),
        ownerApi.getOwners({ verifiedOnly: true, limit: 6 }),
      ]);
      setCategories(catRes.data);
      setFeaturedOwners(ownerRes.data.owners);
    } catch (err) {
      console.error('Error loading landing page data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();
    if (nameQuery) queryParams.set('name', nameQuery);
    if (selectedCategory) queryParams.set('category', selectedCategory);
    if (country) queryParams.set('country', country);
    if (state) queryParams.set('state', state);
    if (district) queryParams.set('district', district);

    navigate(`/search?${queryParams.toString()}`);
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Stethoscope': return <Stethoscope className="w-6 h-6 text-emerald-600" />;
      case 'Smile': return <Smile className="w-6 h-6 text-emerald-600" />;
      case 'Scissors': return <Scissors className="w-6 h-6 text-emerald-600" />;
      case 'Dumbbell': return <Dumbbell className="w-6 h-6 text-emerald-600" />;
      case 'Briefcase': return <Briefcase className="w-6 h-6 text-emerald-600" />;
      case 'Scale': return <Scale className="w-6 h-6 text-emerald-600" />;
      case 'BookOpen': return <BookOpen className="w-6 h-6 text-emerald-600" />;
      case 'Wrench': return <Wrench className="w-6 h-6 text-emerald-600" />;
      default: return <Sparkles className="w-6 h-6 text-emerald-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden bg-gradient-to-b from-emerald-50/60 via-white to-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Two-Layer Identity & Business Verification</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Find and book trusted <span className="text-emerald-600 underline decoration-emerald-300 underline-offset-8">professionals near you.</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto font-medium">
              Discover verified doctors, tutors, salons, consultants, and service outlets in your area. Real-time time slot and token appointment booking.
            </p>
          </div>

          {/* Main Search Bar Card */}
          <div className="mt-10 max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-200/80">
            <form onSubmit={handleSearchSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Search Name Input */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Search by Name / Outlet / Service
                  </label>
                  <div className="relative">
                    <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="e.g. Dr. Rahul Sharma, City Care Clinic..."
                      value={nameQuery}
                      onChange={(e) => setNameQuery(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location Cascade */}
              <div className="pt-2 border-t border-gray-100">
                <LocationSelector
                  country={country}
                  state={state}
                  district={district}
                  onCountryChange={setCountry}
                  onStateChange={setState}
                  onDistrictChange={setDistrict}
                />
              </div>

              {/* Submit CTA Button */}
              <div className="pt-2 text-center">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-lg hover:shadow-emerald-200 transition-all flex items-center justify-center gap-2 mx-auto"
                >
                  <SearchIcon className="w-4 h-4" />
                  <span>Search Verified Professionals</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Popular Categories Grid */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Discover</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Popular Categories</h2>
          </div>
          <Link
            to="/search?category=all"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.slice(0, 10).map((cat) => (
            <Link
              key={cat._id}
              to={`/search?category=${cat._id}`}
              className="p-5 bg-white border border-gray-200 hover:border-emerald-500 rounded-2xl shadow-sm hover:shadow-md transition-all text-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white text-emerald-600 flex items-center justify-center mx-auto mb-3 transition">
                {getCategoryIcon(cat.icon)}
              </div>
              <h3 className="font-bold text-sm text-gray-900 group-hover:text-emerald-600 transition">{cat.name}</h3>
              <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{cat.description || 'Verified specialists'}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Seamless Flow</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-1">How CareSync Works</h2>
            <p className="text-xs text-gray-600 mt-2">Book appointments with verified experts in three simple steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-extrabold text-lg flex items-center justify-center mx-auto mb-4 shadow-md">
                1
              </div>
              <h3 className="font-bold text-base text-gray-900">Search Professionals</h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                Filter service owners by verified status, category, name, and exact location down to country, state, and district.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-extrabold text-lg flex items-center justify-center mx-auto mb-4 shadow-md">
                2
              </div>
              <h3 className="font-bold text-base text-gray-900">Select Time Slot or Token</h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                Choose between provider appointment systems: Mode A (exact time slots) or Mode B (daily token capacity allocation).
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-extrabold text-lg flex items-center justify-center mx-auto mb-4 shadow-md">
                3
              </div>
              <h3 className="font-bold text-base text-gray-900">Instant Notifications</h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                Receive instant appointment confirmation with date, token/time, and provider details via Email & WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Verified Owners */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Verified Experts</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Featured Verified Providers</h2>
          </div>
          <Link to="/search" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            <span>Browse All Providers</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredOwners.map((owner) => (
              <div
                key={owner._id}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3">
                    <img
                      src={owner.profileImage || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80'}
                      alt={owner.fullName}
                      className="w-16 h-16 rounded-xl object-cover border border-gray-200 shadow-sm"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-base text-gray-900">{owner.fullName}</h3>
                        <VerifiedBadge status={owner.verificationStatus} size="sm" />
                      </div>
                      <p className="text-xs font-semibold text-emerald-700 mt-0.5">{owner.outletName}</p>
                      <span className="text-[11px] text-gray-500 block">{owner.title}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 mt-3 line-clamp-2 leading-relaxed">
                    {owner.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      {owner.district ? `${owner.district}, ` : ''}{owner.state}
                    </span>
                    <span className="font-semibold text-gray-800">
                      {owner.appointmentMode === 'TOKEN' ? 'Token Based' : `${owner.slotDurationMinutes} min Slots`}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 grid grid-cols-2 gap-2">
                  <Link
                    to={`/owner/${owner._id}`}
                    className="w-full text-center py-2 text-xs font-bold text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                  >
                    View Profile
                  </Link>
                  <button
                    onClick={() => setSelectedOwnerForBooking(owner)}
                    className="w-full text-center py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm"
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Why Use Platform */}
      <section className="py-16 bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Platform Integrity</span>
          <h2 className="text-3xl font-extrabold mt-1">Why Choose CareSync?</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-10">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2">
              <Award className="w-8 h-8 text-emerald-400" />
              <h3 className="font-bold text-base text-white">Verified Profiles Only</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Two-stage KYC and business license verification audited by platform admins before granting the verified badge.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2">
              <Clock className="w-8 h-8 text-emerald-400" />
              <h3 className="font-bold text-base text-white">Dual Booking Modes</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Supports both exact time-slot bookings and daily lot/token capacity allocation with atomic backend concurrency locks.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2">
              <Users className="w-8 h-8 text-emerald-400" />
              <h3 className="font-bold text-base text-white">Anti-Impersonation Safeguards</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Changing verified name or business details automatically triggers re-verification to prevent identity hijacking.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2">
              <CalendarCheck className="w-8 h-8 text-emerald-400" />
              <h3 className="font-bold text-base text-white">PDF History Export</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Download formatted PDF appointment histories and customer logs with single-click reporting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Appointment Modal */}
      {selectedOwnerForBooking && (
        <AppointmentModal
          isOpen={!!selectedOwnerForBooking}
          onClose={() => setSelectedOwnerForBooking(null)}
          owner={selectedOwnerForBooking}
        />
      )}
    </div>
  );
};
