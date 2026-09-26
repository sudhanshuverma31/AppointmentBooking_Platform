import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, MapPin, Filter, AlertCircle, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { ownerApi, categoryApi } from '../services/api';
import { Owner, Category } from '../types';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { LocationSelector } from '../components/LocationSelector';
import { AppointmentModal } from '../components/AppointmentModal';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter States
  const [nameQuery, setNameQuery] = useState(searchParams.get('name') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [country, setCountry] = useState(searchParams.get('country') || 'India');
  const [state, setState] = useState(searchParams.get('state') || 'Uttar Pradesh');
  const [district, setDistrict] = useState(searchParams.get('district') || '');
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get('verified') === 'true');
  const [sort, setSort] = useState(searchParams.get('sort') || 'recommended');
  const [page, setPage] = useState(1);

  // Data States
  const [owners, setOwners] = useState<Owner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Booking Modal State
  const [selectedOwnerForBooking, setSelectedOwnerForBooking] = useState<Owner | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchOwners();
  }, [nameQuery, selectedCategory, country, state, district, verifiedOnly, sort, page]);

  const fetchCategories = async () => {
    try {
      const res = await categoryApi.getCategories();
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to load categories');
    }
  };

  const fetchOwners = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = {
        name: nameQuery,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        country: country || undefined,
        state: state || undefined,
        district: district || undefined,
        verifiedOnly,
        sort,
        page,
        limit: 9,
      };

      const res = await ownerApi.getOwners(params);
      setOwners(res.data.owners);
      setPagination(res.data.pagination);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to search providers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOwners();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Title Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Find Service Providers</h1>
          <p className="text-xs text-gray-500 mt-1">
            Search verified professionals by name, business outlet, category, or location.
          </p>
        </div>

        {/* Filter Panel Card */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm mb-8 space-y-4">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Name Search */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Search Name / Outlet / Service
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search doctor name, clinic name, salon..."
                    value={nameQuery}
                    onChange={(e) => setNameQuery(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location Selector */}
            <LocationSelector
              country={country}
              state={state}
              district={district}
              onCountryChange={(c) => { setCountry(c); setPage(1); }}
              onStateChange={(s) => { setState(s); setPage(1); }}
              onDistrictChange={(d) => { setDistrict(d); setPage(1); }}
            />

            {/* Secondary Controls: Verified toggle & Sort */}
            <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-semibold">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => { setVerifiedOnly(e.target.checked); setPage(1); }}
                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                  />
                  <span className="text-gray-800">Show Verified Profiles Only</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-600">Sort By:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-900"
                >
                  <option value="recommended">Recommended</option>
                  <option value="verified">Verified First</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Results Header */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-600">
            Showing <strong className="text-gray-900">{owners.length}</strong> of{' '}
            <strong className="text-gray-900">{pagination.total}</strong> results
          </span>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-72 bg-white rounded-2xl border border-gray-200 animate-pulse p-6" />
            ))}
          </div>
        ) : errorMsg ? (
          <div className="p-8 bg-red-50 border border-red-200 rounded-2xl text-center text-xs font-semibold text-red-700">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <span>{errorMsg}</span>
          </div>
        ) : owners.length === 0 ? (
          /* Empty Results State */
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto my-8 space-y-3">
            <Search className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="font-bold text-base text-gray-900">No service providers found</h3>
            <p className="text-xs text-gray-500">
              Try adjusting your name query or selecting another state/district.
            </p>
            <button
              onClick={() => {
                setNameQuery('');
                setSelectedCategory('');
                setCountry('India');
                setState('');
                setDistrict('');
                setVerifiedOnly(false);
              }}
              className="mt-2 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Owner Profile Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {owners.map((owner) => (
              <div
                key={owner._id}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3">
                    <img
                      src={
                        owner.profileImage ||
                        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80'
                      }
                      alt={owner.fullName}
                      className="w-16 h-16 rounded-xl object-cover border border-gray-200 shadow-sm shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-base text-gray-900 truncate">{owner.fullName}</h3>
                        <VerifiedBadge status={owner.verificationStatus} size="sm" />
                      </div>
                      <p className="text-xs font-bold text-emerald-700 truncate mt-0.5">{owner.outletName}</p>
                      <span className="text-[11px] text-gray-500 block truncate">{owner.title}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 mt-3 line-clamp-2 leading-relaxed">
                    {owner.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      {owner.district ? `${owner.district}, ` : ''}{owner.state}
                    </span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded ${
                        owner.activeStatus === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {owner.activeStatus === 'ACTIVE' ? 'Available' : 'Unavailable'}
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
                    disabled={owner.activeStatus === 'INACTIVE'}
                    onClick={() => setSelectedOwnerForBooking(owner)}
                    className="w-full text-center py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl transition shadow-sm"
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="p-2 border border-gray-300 rounded-xl disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-gray-700">
              Page {page} of {pagination.totalPages}
            </span>
            <button
              disabled={page === pagination.totalPages}
              onClick={() => setPage(page + 1)}
              className="p-2 border border-gray-300 rounded-xl disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

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
