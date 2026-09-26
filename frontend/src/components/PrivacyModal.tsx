import React, { useState } from 'react';
import { X, ShieldCheck, Lock, FileText } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'privacy' | 'terms' | 'verification';
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy',
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'verification'>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base text-gray-900">CareSync Legal & Verification Terms</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 bg-white gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'privacy'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'terms'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms of Service</span>
          </button>
          <button
            onClick={() => setActiveTab('verification')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'verification'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verification Policy</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto text-xs text-gray-600 space-y-4 leading-relaxed">
          {activeTab === 'privacy' && (
            <>
              <h4 className="font-bold text-sm text-gray-900">Privacy & Data Security Policy</h4>
              <p>
                CareSync is committed to maintaining strict data security standards. We do NOT store unencrypted national identity numbers (such as full Aadhaar numbers or raw government identity documents) directly in our databases.
              </p>
              <h5 className="font-semibold text-gray-800">1. Identity Information Protection</h5>
              <p>
                When submitting identity credentials, information is processed securely via compliant third-party KYC providers. CareSync stores only provider reference IDs, masked tokens, and verification status timestamps.
              </p>
              <h5 className="font-semibold text-gray-800">2. Data Access & Sharing</h5>
              <p>
                Customer appointment booking details (Name, Age, Gender, Reason for Appointment) are accessible ONLY to the verified service provider with whom the appointment is booked and platform administrators for audit purposes.
              </p>
            </>
          )}

          {activeTab === 'terms' && (
            <>
              <h4 className="font-bold text-sm text-gray-900">Terms of Service</h4>
              <p>
                By using CareSync, you agree to connect with verified service providers responsibly.
              </p>
              <h5 className="font-semibold text-gray-800">1. Appointment Tokens & Time Slots</h5>
              <p>
                Time-slot and Token-lot bookings are managed server-side. Users agree to arrive on time for confirmed appointments. Providers reserve the right to mark no-show appointments.
              </p>
              <h5 className="font-semibold text-gray-800">2. Account Responsibility</h5>
              <p>
                Service providers must ensure all submitted credentials, outlet names, and professional titles represent genuine legal entities. Impersonation triggers immediate profile suspension.
              </p>
            </>
          )}

          {activeTab === 'verification' && (
            <>
              <h4 className="font-bold text-sm text-gray-900">CareSync Verification Badge Policy</h4>
              <p>
                The <strong>✓ Verified</strong> badge indicates that a service provider profile has passed our two-layer verification standard:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Layer 1 — Identity Verification:</strong> Verified through a legally compliant identity provider (KYC).</li>
                <li><strong>Layer 2 — Business / Professional License:</strong> Documented proof of business registration, medical/bar council license, or official establishment proof audited by platform administrators.</li>
              </ul>
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-900 font-medium">
                Note: Updating verified identity fields (FullName, Outlet Name, Primary Category) automatically triggers re-verification by platform administrators to prevent identity transfers.
              </div>
            </>
          )}
        </div>

        {/* Footer button */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
