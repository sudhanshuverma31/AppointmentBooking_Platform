import React, { useState } from 'react';
import { CalendarCheck, ShieldCheck, Heart, Lock, FileText } from 'lucide-react';
import { PrivacyModal } from './PrivacyModal';

export const Footer: React.FC = () => {
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'verification'>('privacy');

  const openPolicy = (tab: 'privacy' | 'terms' | 'verification') => {
    setActiveTab(tab);
    setPrivacyModalOpen(true);
  };

  return (
    <footer className="bg-white border-t border-gray-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-gray-900">
                Care<span className="text-emerald-600">Sync</span>
              </span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Find and book trusted professionals near you. Verified service providers, transparent appointment tokens, and instant booking notifications.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 w-fit">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Two-Layer Verified Profiles</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">Popular Categories</h4>
            <ul className="space-y-2 text-xs text-gray-600 font-medium">
              <li><a href="/search?category=Doctor" className="hover:text-emerald-600">Doctors & Cardiologists</a></li>
              <li><a href="/search?category=Dentist" className="hover:text-emerald-600">Dentists & Orthodontists</a></li>
              <li><a href="/search?category=Salon" className="hover:text-emerald-600">Salons & Aesthetic Spas</a></li>
              <li><a href="/search?category=Lawyer" className="hover:text-emerald-600">Corporate & Family Lawyers</a></li>
              <li><a href="/search?category=Consultant" className="hover:text-emerald-600">Business Consultants</a></li>
            </ul>
          </div>

          {/* Business & Providers */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">For Service Owners</h4>
            <ul className="space-y-2 text-xs text-gray-600 font-medium">
              <li><a href="/auth?tab=register-owner" className="hover:text-emerald-600 font-bold text-emerald-600">Register as Service Owner</a></li>
              <li><a href="/auth?tab=login" className="hover:text-emerald-600">Owner Dashboard Login</a></li>
              <li><button onClick={() => openPolicy('verification')} className="hover:text-emerald-600 text-left">Verification Standards</button></li>
              <li><a href="/#how-it-works" className="hover:text-emerald-600">Appointment Modes (Time / Token)</a></li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">Trust & Legal</h4>
            <ul className="space-y-2 text-xs text-gray-600 font-medium">
              <li>
                <button onClick={() => openPolicy('privacy')} className="hover:text-emerald-600 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                  <span>Privacy Policy</span>
                </button>
              </li>
              <li>
                <button onClick={() => openPolicy('terms')} className="hover:text-emerald-600 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                  <span>Terms of Service</span>
                </button>
              </li>
              <li>
                <button onClick={() => openPolicy('verification')} className="hover:text-emerald-600 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                  <span>Verification Policy</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} CareSync Platform Inc. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Built with precision for verified service delivery</span>
            <Heart className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
          </div>
        </div>
      </div>

      <PrivacyModal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
        initialTab={activeTab}
      />
    </footer>
  );
};
