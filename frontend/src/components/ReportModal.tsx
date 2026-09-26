import React, { useState } from 'react';
import { X, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { reportApi } from '../services/api';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownerId: string;
  ownerName: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  ownerId,
  ownerName,
}) => {
  const [reason, setReason] = useState('Impersonation / Fake profile');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg('Please provide details for your report');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      await reportApi.createReport({ ownerId, reason, description: description.trim() });
      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-red-50">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-sm text-red-950">Report Service Provider</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-base text-gray-900">Report Submitted</h4>
            <p className="text-xs text-gray-600">
              Thank you for helping keep CareSync safe. Our admin team will investigate <span className="font-bold">{ownerName}</span>.
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2 bg-gray-900 text-white font-bold text-xs rounded-xl"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-100 text-red-800 text-xs rounded-lg font-semibold">{errorMsg}</div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Report *</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-2.5 text-xs font-semibold text-gray-900"
              >
                <option value="Impersonation / Fake profile">Impersonation / Fake profile</option>
                <option value="Wrong business information">Wrong business information</option>
                <option value="Fraud / Unprofessional conduct">Fraud / Unprofessional conduct</option>
                <option value="Abusive behavior">Abusive behavior</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Detailed Explanation *</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain why this profile should be reviewed or suspended..."
                className="w-full border border-gray-300 rounded-xl p-3 text-xs text-gray-900"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="text-xs font-bold text-gray-500">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
