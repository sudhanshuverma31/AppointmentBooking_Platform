import React, { useState } from 'react';
import { CheckCircle2, ShieldAlert, Clock } from 'lucide-react';
import { VerificationStatus } from '../types';

interface VerifiedBadgeProps {
  status: VerificationStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  status,
  size = 'md',
  showLabel = true,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (status === 'VERIFIED') {
    return (
      <div className="relative inline-flex items-center">
        <span
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`inline-flex items-center gap-1 font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-help ${
            size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3.5 py-1 text-sm' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <CheckCircle2 className={`${size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} text-emerald-600 fill-emerald-100`} />
          {showLabel && <span>✓ Verified</span>}
        </span>

        {showTooltip && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-2.5 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 pointer-events-none text-center">
            This profile has completed our identity and profile verification process.
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </div>
        )}
      </div>
    );
  }

  if (status === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
        <Clock className="w-3.5 h-3.5" />
        <span>Verification Pending</span>
      </span>
    );
  }

  if (status === 'SUSPENDED') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 font-medium bg-red-50 text-red-700 border border-red-200 rounded-full">
        <ShieldAlert className="w-3.5 h-3.5" />
        <span>Suspended</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 font-medium bg-gray-100 text-gray-600 border border-gray-200 rounded-full">
      <span>Unverified Profile</span>
    </span>
  );
};
