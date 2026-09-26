import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Building,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  FileText,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';
import { adminApi, categoryApi } from '../services/api';
import { VerificationRequest, Category, AuditLog, Report, Owner } from '../types';
import { VerifiedBadge } from '../components/VerifiedBadge';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'verifications' | 'categories' | 'reports' | 'owners' | 'audit'>('verifications');
  const [metrics, setMetrics] = useState<any>(null);
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [selectedVerification, setSelectedVerification] = useState<VerificationRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | 'SUSPEND' | 'REQUEST_INFO'>('APPROVE');
  const [adminNotes, setAdminNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatDescription, setNewCatDescription] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [mRes, vRes, cRes, rRes, oRes, aRes] = await Promise.all([
        adminApi.getMetrics(),
        adminApi.getPendingVerifications(),
        categoryApi.getAllAdmin(),
        adminApi.getReports(),
        adminApi.getOwners(),
        adminApi.getAuditLogs(),
      ]);

      setMetrics(mRes.data);
      setVerifications(vRes.data);
      setCategories(cRes.data);
      setReports(rRes.data);
      setOwners(oRes.data);
      setAuditLogs(aRes.data);
    } catch (err) {
      console.error('Failed to load admin dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessReview = async () => {
    if (!selectedVerification) return;
    setSubmittingReview(true);
    try {
      await adminApi.reviewVerification(selectedVerification._id, {
        action: reviewAction,
        adminNotes,
      });
      setSelectedVerification(null);
      setAdminNotes('');
      fetchAdminData();
    } catch (err) {
      alert('Failed to process verification decision');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await categoryApi.create({ name: newCatName.trim(), description: newCatDescription.trim() });
      setNewCatName('');
      setNewCatDescription('');
      fetchAdminData();
    } catch (err) {
      alert('Failed to create category');
    }
  };

  const handleToggleCategory = async (cat: Category) => {
    try {
      await categoryApi.update(cat._id, { isActive: !cat.isActive });
      fetchAdminData();
    } catch (err) {
      alert('Failed to toggle category');
    }
  };

  const handleToggleSuspendOwner = async (ownerId: string, currentlySuspended: boolean) => {
    const actionStr = currentlySuspended ? 'unsuspend' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${actionStr} this owner?`)) return;
    try {
      await adminApi.toggleSuspendOwner(ownerId, { suspend: !currentlySuspended });
      fetchAdminData();
    } catch (err) {
      alert(`Failed to ${actionStr} owner`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Admin Banner Header */}
        <div className="bg-gray-900 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <h1 className="text-2xl font-extrabold">Platform Admin Control Center</h1>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Verify service providers, enforce verification standards, manage categories, and audit platform activities.
            </p>
          </div>
          <button
            onClick={fetchAdminData}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* Metrics Grid */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-200 text-center">
              <span className="text-[10px] uppercase font-bold text-gray-400">Total Users</span>
              <p className="text-xl font-extrabold text-gray-900">{metrics.totalUsers}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200 text-center">
              <span className="text-[10px] uppercase font-bold text-gray-400">Total Owners</span>
              <p className="text-xl font-extrabold text-gray-900">{metrics.totalOwners}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-700">Verified Owners</span>
              <p className="text-xl font-extrabold text-emerald-900">{metrics.verifiedOwners}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/50 text-center">
              <span className="text-[10px] uppercase font-bold text-amber-700">Pending Review</span>
              <p className="text-xl font-extrabold text-amber-900">{metrics.pendingVerifications}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-red-200 bg-red-50/50 text-center">
              <span className="text-[10px] uppercase font-bold text-red-700">Suspended</span>
              <p className="text-xl font-extrabold text-red-900">{metrics.suspendedOwners}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200 text-center">
              <span className="text-[10px] uppercase font-bold text-gray-400">Total Bookings</span>
              <p className="text-xl font-extrabold text-gray-900">{metrics.totalAppointments}</p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-white rounded-2xl p-2 font-bold text-xs shadow-sm gap-2">
          <button
            onClick={() => setActiveTab('verifications')}
            className={`flex-1 py-2 rounded-xl transition ${
              activeTab === 'verifications' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Verification Queue ({verifications.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex-1 py-2 rounded-xl transition ${
              activeTab === 'categories' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Categories ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('owners')}
            className={`flex-1 py-2 rounded-xl transition ${
              activeTab === 'owners' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Manage Owners ({owners.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 py-2 rounded-xl transition ${
              activeTab === 'reports' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            User Reports ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex-1 py-2 rounded-xl transition ${
              activeTab === 'audit' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Audit Logs ({auditLogs.length})
          </button>
        </div>

        {/* TAB 1: VERIFICATION QUEUE */}
        {activeTab === 'verifications' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-gray-900">Pending Verification Requests</h2>

            {verifications.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">No pending verification requests</p>
            ) : (
              <div className="space-y-4">
                {verifications.map((v) => {
                  const ownerObj = typeof v.ownerId === 'object' ? (v.ownerId as any) : null;
                  return (
                    <div
                      key={v._id}
                      className="border border-gray-200 rounded-2xl p-5 hover:border-emerald-500 transition space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-base text-gray-900">
                              {ownerObj?.fullName || 'Owner'}
                            </h3>
                            <VerifiedBadge status={ownerObj?.verificationStatus || 'UNVERIFIED'} size="sm" />
                          </div>
                          <p className="text-xs font-bold text-emerald-700">{ownerObj?.outletName}</p>
                          <p className="text-[11px] text-gray-500">{ownerObj?.title}</p>
                        </div>

                        <span className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-800 rounded-full uppercase">
                          {v.status}
                        </span>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-xl text-xs space-y-1">
                        <p><strong>Identity Type:</strong> {v.identityType}</p>
                        <p><strong>KYC Ref ID:</strong> <code className="font-mono text-emerald-700">{v.kycReferenceId}</code></p>
                        <p><strong>License Number:</strong> {v.licenseNumber || 'Not provided'}</p>
                        {v.businessDocUrl && (
                          <p>
                            <strong>Uploaded Document: </strong>
                            <a href={v.businessDocUrl} target="_blank" rel="noreferrer" className="text-emerald-600 underline font-bold">
                              View Submitted File
                            </a>
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <button
                          onClick={() => setSelectedVerification(v)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition"
                        >
                          Review & Decide
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CATEGORY MANAGEMENT */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Create Category Form */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-base font-extrabold text-gray-900">Add New Category</h2>
              <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Dermatologist, Architect..."
                    className="w-full border border-gray-300 rounded-xl p-2.5 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={newCatDescription}
                    onChange={(e) => setNewCatDescription(e.target.value)}
                    placeholder="Brief overview of category..."
                    className="w-full border border-gray-300 rounded-xl p-2.5 font-semibold"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition"
                >
                  Create Category
                </button>
              </form>
            </div>

            {/* Categories Table */}
            <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-base font-extrabold text-gray-900">Existing Categories</h2>
              <div className="divide-y divide-gray-100 text-xs">
                {categories.map((cat) => (
                  <div key={cat._id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-gray-900 text-sm">{cat.name}</span>
                      <p className="text-gray-500">{cat.description || 'No description'}</p>
                    </div>
                    <button
                      onClick={() => handleToggleCategory(cat)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg ${
                        cat.isActive ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {cat.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MANAGE OWNERS */}
        {activeTab === 'owners' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-gray-900">Registered Service Owners</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase">
                    <th className="pb-3">Owner / Outlet</th>
                    <th className="pb-3">Location</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {owners.map((o) => (
                    <tr key={o._id} className="hover:bg-gray-50">
                      <td className="py-3 font-semibold text-gray-900">
                        <div>
                          <span>{o.fullName}</span>
                          <span className="block text-[11px] font-bold text-emerald-700">{o.outletName}</span>
                        </div>
                      </td>
                      <td className="py-3 text-gray-600">{o.state}, {o.country}</td>
                      <td className="py-3">
                        <VerifiedBadge status={o.verificationStatus} size="sm" />
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleToggleSuspendOwner(o._id, o.verificationStatus === 'SUSPENDED')}
                          className={`px-3 py-1 text-xs font-bold rounded-lg ${
                            o.verificationStatus === 'SUSPENDED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {o.verificationStatus === 'SUSPENDED' ? 'Unsuspend' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: USER REPORTS */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-gray-900">User Complaints & Reports</h2>
            {reports.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">No user reports submitted</p>
            ) : (
              <div className="space-y-4">
                {reports.map((r) => (
                  <div key={r._id} className="border border-gray-200 rounded-2xl p-4 text-xs space-y-2">
                    <div className="flex justify-between font-bold">
                      <span className="text-red-700">Reason: {r.reason}</span>
                      <span className="uppercase text-gray-500">{r.status}</span>
                    </div>
                    <p className="text-gray-700">{r.description}</p>
                    <span className="text-[10px] text-gray-400 block">
                      Submitted on: {new Date(r.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-gray-900">Admin Action Audit Log</h2>
            <div className="divide-y divide-gray-100 text-xs font-mono">
              {auditLogs.map((log) => (
                <div key={log._id} className="py-2.5 flex items-start justify-between gap-4">
                  <div>
                    <span className="font-bold text-emerald-700">[{log.action}]</span>{' '}
                    <span className="text-gray-900">{log.details}</span>
                    <span className="block text-[10px] text-gray-400 font-sans">By: {log.adminEmail}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-sans shrink-0">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Decision Modal */}
      {selectedVerification && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-base text-gray-900">Process Verification Review</h3>
            <p className="text-xs text-gray-500">
              Reviewing owner profile for <strong className="text-gray-800">{(selectedVerification.ownerId as any)?.fullName}</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Decision Action *</label>
              <select
                value={reviewAction}
                onChange={(e) => setReviewAction(e.target.value as any)}
                className="w-full border border-gray-300 rounded-xl p-2.5 text-xs font-semibold"
              >
                <option value="APPROVE">APPROVE — Grant ✓ Verified Badge</option>
                <option value="REJECT">REJECT — Deny Verification</option>
                <option value="REQUEST_INFO">REQUEST_INFO — Ask for Additional Docs</option>
                <option value="SUSPEND">SUSPEND — Suspend Owner Profile</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Audit / Reason Notes</label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Reason for decision..."
                className="w-full border border-gray-300 rounded-xl p-3 text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setSelectedVerification(null)} className="text-xs font-bold text-gray-500">
                Cancel
              </button>
              <button
                onClick={handleProcessReview}
                disabled={submittingReview}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow"
              >
                {submittingReview ? 'Saving...' : 'Submit Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
