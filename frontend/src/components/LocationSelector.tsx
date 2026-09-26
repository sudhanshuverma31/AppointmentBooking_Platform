import React from 'react';
import { MapPin, Globe, Compass } from 'lucide-react';

interface LocationSelectorProps {
  country: string;
  state: string;
  district: string;
  onCountryChange: (val: string) => void;
  onStateChange: (val: string) => void;
  onDistrictChange: (val: string) => void;
}

const sampleLocationData: Record<string, Record<string, string[]>> = {
  India: {
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Noida', 'Agra'],
    Delhi: ['South Delhi', 'Central Delhi', 'North Delhi', 'West Delhi'],
    Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Thane'],
    Karnataka: ['Bengaluru', 'Mysuru', 'Mangaluru'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai'],
  },
};

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  country,
  state,
  district,
  onCountryChange,
  onStateChange,
  onDistrictChange,
}) => {
  const availableStates = country && sampleLocationData[country] ? Object.keys(sampleLocationData[country]) : [];
  const availableDistricts = country && state && sampleLocationData[country]?.[state] ? sampleLocationData[country][state] : [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Country */}
      <div className="relative">
        <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1">
          <Globe className="w-3.5 h-3.5 text-emerald-600" />
          <span>Country</span>
        </label>
        <select
          value={country}
          onChange={(e) => {
            onCountryChange(e.target.value);
            onStateChange('');
            onDistrictChange('');
          }}
          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
        >
          <option value="">All Countries</option>
          <option value="India">India</option>
        </select>
      </div>

      {/* State */}
      <div className="relative">
        <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>State</span>
        </label>
        <select
          value={state}
          disabled={!country}
          onChange={(e) => {
            onStateChange(e.target.value);
            onDistrictChange('');
          }}
          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm disabled:bg-gray-100 disabled:text-gray-400"
        >
          <option value="">All States</option>
          {availableStates.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* District (Optional) */}
      <div className="relative">
        <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 text-emerald-600" />
          <span>District (Optional)</span>
        </label>
        <select
          value={district}
          disabled={!state}
          onChange={(e) => onDistrictChange(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm disabled:bg-gray-100 disabled:text-gray-400"
        >
          <option value="">Optional (All Districts)</option>
          {availableDistricts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
