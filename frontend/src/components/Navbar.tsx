import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  Search,
  Bell,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  Menu,
  X,
  ChevronDown,
  Wifi,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { notifications, unreadCount, isConnected, markRead, markAllRead } = useNotifications();

  const handleMarkRead = async (id: string) => {
    await markRead(id);
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <RouterLink to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md group-hover:bg-emerald-700 transition">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-gray-900">
              Care<span className="text-emerald-600">Sync</span>
            </span>
            <span className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest -mt-1">
              Verified Booking
            </span>
          </div>
        </RouterLink>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
          <RouterLink to="/search" className="hover:text-emerald-600 transition flex items-center gap-1.5">
            <Search className="w-4 h-4 text-emerald-600" />
            <span>Find Professionals</span>
          </RouterLink>
          <RouterLink to="/search?category=all" className="hover:text-emerald-600 transition">
            Categories
          </RouterLink>
          <a href="/#how-it-works" className="hover:text-emerald-600 transition">
            How it Works
          </a>
        </nav>

        {/* Auth / Action Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Notifications Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 text-gray-600 hover:text-emerald-600 rounded-full hover:bg-emerald-50 transition relative"
                  title={isConnected ? 'Notifications (live)' : 'Notifications'}
                >
                  <Bell className="w-5 h-5" />
                  {/* Unread badge */}
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                  {/* Live SSE indicator dot */}
                  {isConnected && unreadCount === 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 border border-white" title="Live" />
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-gray-900">Notifications</span>
                        {isConnected && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                            <Wifi className="w-3 h-3" /> Live
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-emerald-600 hover:underline font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-gray-500">No notifications yet</div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n._id}
                            onClick={() => handleMarkRead(n._id)}
                            className={`p-3 text-xs cursor-pointer hover:bg-gray-50 transition ${
                              !n.read ? 'bg-emerald-50/50 font-semibold' : ''
                            }`}
                          >
                            <p className="text-gray-900 font-medium">{n.title}</p>
                            <p className="text-gray-600 text-[11px] mt-0.5">{n.message}</p>
                            <span className="text-[10px] text-gray-400 mt-1 block">
                              {new Date(n.createdAt).toLocaleString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>


              {/* Role specific CTA button */}
              {user.role === 'OWNER' && (
                <RouterLink
                  to="/owner/dashboard"
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                  <span>Owner Dashboard</span>
                </RouterLink>
              )}

              {user.role === 'ADMIN' && (
                <RouterLink
                  to="/admin/dashboard"
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition flex items-center gap-1.5 shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Admin Panel</span>
                </RouterLink>
              )}

              {/* User Avatar Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-gray-900 max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {user.role}
                      </span>
                    </div>

                    <RouterLink
                      to="/user/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>My Appointments</span>
                    </RouterLink>

                    {user.role === 'OWNER' && (
                      <RouterLink
                        to="/owner/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Owner Dashboard</span>
                      </RouterLink>
                    )}

                    {user.role === 'ADMIN' && (
                      <RouterLink
                        to="/admin/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Admin Panel</span>
                      </RouterLink>
                    )}

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                        navigate('/');
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100 mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <RouterLink
                to="/auth?tab=login"
                className="text-xs font-bold text-gray-700 hover:text-emerald-600 px-3 py-2 transition"
              >
                Log In
              </RouterLink>
              <RouterLink
                to="/auth?tab=register"
                className="text-xs font-bold text-gray-900 border border-gray-300 hover:border-gray-400 px-3.5 py-2 rounded-lg transition"
              >
                Sign Up
              </RouterLink>
              <RouterLink
                to="/auth?tab=register-owner"
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-sm transition"
              >
                Register as Owner
              </RouterLink>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-gray-700 hover:text-emerald-600 rounded-lg"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4 space-y-3">
          <RouterLink
            to="/search"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-gray-800 hover:text-emerald-600"
          >
            Find Professionals
          </RouterLink>
          <RouterLink
            to="/search?category=all"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-gray-800 hover:text-emerald-600"
          >
            Categories
          </RouterLink>

          {user ? (
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <RouterLink
                to="/user/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-emerald-700"
              >
                My Appointments ({user.name})
              </RouterLink>

              {user.role === 'OWNER' && (
                <RouterLink
                  to="/owner/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-semibold text-emerald-600"
                >
                  Owner Dashboard
                </RouterLink>
              )}

              {user.role === 'ADMIN' && (
                <RouterLink
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-semibold text-gray-900"
                >
                  Admin Control Center
                </RouterLink>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                  navigate('/');
                }}
                className="block w-full text-left text-sm font-semibold text-red-600 pt-2"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
              <RouterLink
                to="/auth?tab=login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center text-sm font-bold text-gray-900 border border-gray-300 py-2 rounded-lg"
              >
                Log In
              </RouterLink>
              <RouterLink
                to="/auth?tab=register-owner"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center text-sm font-bold text-white bg-emerald-600 py-2 rounded-lg"
              >
                Register as Owner
              </RouterLink>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
