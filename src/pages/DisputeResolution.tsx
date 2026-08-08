import React, { useEffect, useState } from 'react';
import { adminGet, adminPost } from '../lib/api';

interface Dispute {
  id: string;
  job_id: string;
  reason: string;
  evidence_photos: string[];
  status: 'open' | 'under_review' | 'resolved' | 'rejected';
  created_at: string;
  job?: {
    title: string;
  };
  raised_profile?: {
    full_name: string;
    email: string;
  };
  against_profile?: {
    full_name: string;
    email: string;
  };
}

export const DisputeResolutionPage: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionType, setResolutionType] = useState<'full_refund' | 'full_payout' | 'split'>('full_refund');
  const [clientAmount, setClientAmount] = useState<string>('0');
  const [workerAmount, setWorkerAmount] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGet<Dispute[]>('/disputes/admin/list');
      setDisputes(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load disputes.');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (disputeId: string) => {
    setProcessingId(disputeId);
    try {
      await adminPost('/disputes/admin/resolve', {
        disputeId,
        resolutionType,
        clientAmount: resolutionType === 'split' ? Number(clientAmount) : undefined,
        workerAmount: resolutionType === 'split' ? Number(workerAmount) : undefined,
        notes,
      });

      setSelectedDispute(null);
      fetchDisputes();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve dispute.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Dispute Resolution & Escrow Mediation</h1>
      <p className="text-slate-600 text-sm mb-6">Review frozen escrow disputes, inspect evidence, and execute admin split payouts.</p>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading disputes...</div>
      ) : error ? (
        <div className="bg-rose-50 text-rose-700 p-4 rounded-xl text-sm mb-6">{error}</div>
      ) : disputes.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 text-slate-600 p-8 rounded-xl text-center">
          No open disputes found. All escrow balances are clear!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {disputes.map((dispute) => (
            <div key={dispute.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                    dispute.status === 'open' ? 'bg-amber-100 text-amber-800' :
                    dispute.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {dispute.status}
                  </span>
                  <span className="text-xs text-slate-400">{new Date(dispute.created_at).toLocaleDateString()}</span>
                </div>

                <h3 className="text-lg font-bold text-slate-800 mb-1">{dispute.job?.title || 'Service Job Dispute'}</h3>
                <p className="text-xs text-slate-500 mb-4">Dispute ID: {dispute.id}</p>

                <div className="bg-slate-50 p-4 rounded-xl text-sm mb-4 space-y-2">
                  <div>
                    <span className="font-semibold text-slate-700">Raised By: </span>
                    {dispute.raised_profile?.full_name || 'Client'} ({dispute.raised_profile?.email})
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Against: </span>
                    {dispute.against_profile?.full_name || 'Worker'} ({dispute.against_profile?.email})
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <span className="font-semibold text-slate-700">Reason: </span>
                    <p className="text-slate-600 mt-1 italic">"{dispute.reason}"</p>
                  </div>
                </div>

                {dispute.evidence_photos && dispute.evidence_photos.length > 0 && (
                  <div className="mb-4">
                    <span className="text-xs font-semibold text-slate-700 block mb-2">Evidence Photos ({dispute.evidence_photos.length}):</span>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {dispute.evidence_photos.map((photo, i) => (
                        <img key={i} src={photo} alt="Evidence" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {dispute.status === 'open' && (
                <button
                  onClick={() => setSelectedDispute(dispute)}
                  className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-xl hover:bg-indigo-700 transition text-sm"
                >
                  Arbitrate & Resolve Escrow
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Mediation Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Arbitrate Dispute</h2>
            <p className="text-sm text-slate-600 mb-4">Job: {selectedDispute.job?.title}</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Resolution Strategy</label>
                <select
                  value={resolutionType}
                  onChange={(e) => setResolutionType(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                >
                  <option value="full_refund">100% Full Refund to Client</option>
                  <option value="full_payout">100% Full Payout to Worker</option>
                  <option value="split">Custom Split Escrow</option>
                </select>
              </div>

              {resolutionType === 'split' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Client Refund (GHS)</label>
                    <input
                      type="number"
                      value={clientAmount}
                      onChange={(e) => setClientAmount(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Worker Payout (GHS)</label>
                    <input
                      type="number"
                      value={workerAmount}
                      onChange={(e) => setWorkerAmount(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Resolution Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Reason for decision..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm h-20"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedDispute(null)}
                className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-medium text-sm hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                disabled={processingId === selectedDispute.id}
                onClick={() => handleResolve(selectedDispute.id)}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-indigo-700 transition"
              >
                {processingId === selectedDispute.id ? 'Processing...' : 'Confirm Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
