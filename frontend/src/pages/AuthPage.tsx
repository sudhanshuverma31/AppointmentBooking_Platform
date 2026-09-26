import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CalendarCheck, Lock, Mail, User as UserIcon, Phone, Building, MapPin, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { authApi, categoryApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Category } from '../types';

export const AuthPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const initialTab = searchParams.get('tab') || 'login';
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'register-owner' | 'forgot' | 'reset'>(
    initialTab as any
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Regular User Signup State
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');

  // Owner Registration State
  const [ownerData, setOwnerData] = useState({
    fullName: '',
    email: '',
    password: '',
    mobile: '',
    title: '',
    description: '',
    categoryId: '',
    outletName: '',
    country: 'India',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    address: '',
    appointmentMode: 'TIME',
    termsAccepted: false,
  });

  // Reset Token State
  const [resetToken, setResetToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await categoryApi.getCategories();
      setCategories(res.data);
      if (res.data.length > 0) {
        setOwnerData((prev) => ({ ...prev, categoryId: res.data[0]._id }));
      }
    } catch (err) {
      console.error('Failed to load categories');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await authApi.login({ email, password });
      login(res.data.token, res.data.user, res.data.owner);

      if (res.data.user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (res.data.user.role === 'OWNER') {
        navigate('/owner/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleUserRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await authApi.registerUser({ name, email, password, mobile });
      login(res.data.token, res.data.user);
      navigate('/user/dashboard');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOwnerRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerData.termsAccepted) {
      setErrorMsg('You must accept the terms, privacy policy, and verification policy.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await authApi.registerOwner(ownerData);
      login(res.data.token, res.data.user, res.data.owner);
      navigate('/owner/dashboard');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Owner registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async (role: 'USER' | 'OWNER' = 'USER') => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await authApi.googleAuth({
        email: role === 'OWNER' ? 'google.owner@example.com' : 'google.user@example.com',
        name: role === 'OWNER' ? 'Google Demo Owner' : 'Google Demo User',
        googleId: `google_mock_${Date.now()}`,
        role,
      });
      login(res.data.token, res.data.user, res.data.owner);
      if (res.data.user.role === 'OWNER') {
        navigate('/owner/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    } catch (err: any) {
      setErrorMsg('Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await authApi.forgotPassword(email);
      setSuccessMsg(res.data.message);
      if (res.data.resetToken) {
        setResetToken(res.data.resetToken);
      }
    } catch (err: any) {
      setErrorMsg('Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await authApi.resetPassword({ token: resetToken, newPassword });
      setSuccessMsg(res.data.message);
      setTimeout(() => setActiveTab('login'), 2000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Reset password failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
        {/* Auth Brand Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-900 via-gray-900 to-gray-900 text-white text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-2 shadow-md">
            <CalendarCheck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold">CareSync Authentication</h2>
          <p className="text-xs text-emerald-300 mt-1">
            Access your customer appointments or manage your service business
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50/80 px-4 text-xs font-bold divide-x divide-gray-200 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('login'); setErrorMsg(''); }}
            className={`flex-1 py-3 px-3 text-center transition ${
              activeTab === 'login' ? 'bg-white text-emerald-600 font-extrabold border-b-2 border-emerald-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => { setActiveTab('register'); setErrorMsg(''); }}
            className={`flex-1 py-3 px-3 text-center transition ${
              activeTab === 'register' ? 'bg-white text-emerald-600 font-extrabold border-b-2 border-emerald-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            User Signup
          </button>
          <button
            onClick={() => { setActiveTab('register-owner'); setErrorMsg(''); }}
            className={`flex-1 py-3 px-3 text-center transition ${
              activeTab === 'register-owner' ? 'bg-white text-emerald-600 font-extrabold border-b-2 border-emerald-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Register as Owner
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-3 py-2.5 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-gray-700">Password</label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('forgot')}
                    className="text-[11px] text-emerald-600 hover:underline font-semibold"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-3 py-2.5 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition"
              >
                {loading ? 'Logging in...' : 'Sign In'}
              </button>

              {/* Google OAuth Quick Button */}
              <div className="pt-3 text-center border-t border-gray-100 space-y-2">
                <span className="text-[11px] text-gray-400 block font-semibold">Or fast login with</span>
                <button
                  type="button"
                  onClick={() => handleGoogleAuth('USER')}
                  className="w-full py-2.5 border border-gray-300 hover:border-gray-400 rounded-xl text-xs font-bold text-gray-800 flex items-center justify-center gap-2 transition"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>

              {/* Quick Demo Logins Helper */}
              <div className="mt-4 p-3 bg-gray-100 rounded-xl text-[11px] text-gray-700 space-y-1">
                <p className="font-bold text-gray-900">Demo Accounts:</p>
                <div className="flex justify-between">
                  <span>Owner (Doctor): doctor@example.com</span>
                  <button type="button" onClick={() => { setEmail('doctor@example.com'); setPassword('owner123'); }} className="text-emerald-600 font-bold underline">Fill</button>
                </div>
                <div className="flex justify-between">
                  <span>User (Customer): user@example.com</span>
                  <button type="button" onClick={() => { setEmail('user@example.com'); setPassword('user123'); }} className="text-emerald-600 font-bold underline">Fill</button>
                </div>
                <div className="flex justify-between">
                  <span>Admin: admin@appointment.com</span>
                  <button type="button" onClick={() => { setEmail('admin@appointment.com'); setPassword('admin123'); }} className="text-emerald-600 font-bold underline">Fill</button>
                </div>
              </div>
            </form>
          )}

          {/* 2. REGULAR USER SIGNUP */}
          {activeTab === 'register' && (
            <form onSubmit={handleUserRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rahul Kumar"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Phone</label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create password"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition"
              >
                {loading ? 'Creating Account...' : 'Create Customer Account'}
              </button>
            </form>
          )}

          {/* 3. OWNER REGISTRATION FORM */}
          {activeTab === 'register-owner' && (
            <form onSubmit={handleOwnerRegisterSubmit} className="space-y-4 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-900 font-semibold mb-2">
                Register as a verified Service Owner / Business to receive appointments.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={ownerData.fullName}
                    onChange={(e) => setOwnerData({ ...ownerData, fullName: e.target.value })}
                    placeholder="Dr. Rahul Sharma"
                    className="w-full border border-gray-300 rounded-xl p-2.5 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    value={ownerData.mobile}
                    onChange={(e) => setOwnerData({ ...ownerData, mobile: e.target.value })}
                    placeholder="+91 9988776655"
                    className="w-full border border-gray-300 rounded-xl p-2.5 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={ownerData.email}
                    onChange={(e) => setOwnerData({ ...ownerData, email: e.target.value })}
                    placeholder="doctor@example.com"
                    className="w-full border border-gray-300 rounded-xl p-2.5 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Account Password *</label>
                  <input
                    type="password"
                    required
                    value={ownerData.password}
                    onChange={(e) => setOwnerData({ ...ownerData, password: e.target.value })}
                    placeholder="Password"
                    className="w-full border border-gray-300 rounded-xl p-2.5 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Outlet / Business Name *</label>
                  <input
                    type="text"
                    required
                    value={ownerData.outletName}
                    onChange={(e) => setOwnerData({ ...ownerData, outletName: e.target.value })}
                    placeholder="City Care Cardiology Center"
                    className="w-full border border-gray-300 rounded-xl p-2.5 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Primary Category *</label>
                  <select
                    value={ownerData.categoryId}
                    onChange={(e) => setOwnerData({ ...ownerData, categoryId: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Professional Title *</label>
                <input
                  type="text"
                  required
                  value={ownerData.title}
                  onChange={(e) => setOwnerData({ ...ownerData, title: e.target.value })}
                  placeholder="Senior Cardiologist & Physician"
                  className="w-full border border-gray-300 rounded-xl p-2.5 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Business Description *</label>
                <textarea
                  rows={2}
                  required
                  value={ownerData.description}
                  onChange={(e) => setOwnerData({ ...ownerData, description: e.target.value })}
                  placeholder="Describe your expertise, services, and outlet facilities..."
                  className="w-full border border-gray-300 rounded-xl p-2.5 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Country *</label>
                  <input
                    type="text"
                    required
                    value={ownerData.country}
                    onChange={(e) => setOwnerData({ ...ownerData, country: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={ownerData.state}
                    onChange={(e) => setOwnerData({ ...ownerData, state: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">District</label>
                  <input
                    type="text"
                    value={ownerData.district}
                    onChange={(e) => setOwnerData({ ...ownerData, district: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Business Address *</label>
                <input
                  type="text"
                  required
                  value={ownerData.address}
                  onChange={(e) => setOwnerData({ ...ownerData, address: e.target.value })}
                  placeholder="Full street address..."
                  className="w-full border border-gray-300 rounded-xl p-2.5 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Appointment System Mode *</label>
                <select
                  value={ownerData.appointmentMode}
                  onChange={(e) => setOwnerData({ ...ownerData, appointmentMode: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-2.5 font-semibold"
                >
                  <option value="TIME">Mode A — Time Slot Based (e.g. 10:00 AM, 10:30 AM)</option>
                  <option value="TOKEN">Mode B — Token / Lot Based (e.g. Daily capacity 50)</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    checked={ownerData.termsAccepted}
                    onChange={(e) => setOwnerData({ ...ownerData, termsAccepted: e.target.checked })}
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-gray-300"
                  />
                  <span className="text-[11px] text-gray-700 leading-tight">
                    I accept CareSync's <strong>Terms of Service</strong>, <strong>Privacy Policy</strong>, and <strong>Verification Policy</strong>. I confirm all professional credentials submitted are genuine.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md transition"
              >
                {loading ? 'Creating Owner Account...' : 'Complete Owner Registration'}
              </button>
            </form>
          )}

          {/* 4. FORGOT PASSWORD */}
          {activeTab === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <h3 className="font-bold text-sm text-gray-900">Forgot Password</h3>
              <p className="text-xs text-gray-600">Enter your email address to receive a password reset token.</p>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-xs font-semibold"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              {resetToken && (
                <div className="p-3 bg-gray-100 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-gray-900">Generated Token (for testing):</p>
                  <code className="text-emerald-700 font-mono break-all">{resetToken}</code>
                  <button
                    type="button"
                    onClick={() => setActiveTab('reset')}
                    className="block text-emerald-600 font-bold underline mt-1"
                  >
                    Proceed to Reset Password Form
                  </button>
                </div>
              )}
            </form>
          )}

          {/* 5. RESET PASSWORD */}
          {activeTab === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <h3 className="font-bold text-sm text-gray-900">Reset Password</h3>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Reset Token</label>
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-xs font-semibold"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
