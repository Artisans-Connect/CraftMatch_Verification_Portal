import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  Search,
  ShieldOff,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { adminGet, adminPatch } from '../../lib/api';
import type { AdminAccount, AdminAccountDetail, AdminAccountWorker, AdminBlockEdge, AdminBlockRelationships } from '../../types';

interface AccountsPageProps {
  onNavigate: (page: string, data?: unknown) => void;
}

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Clients', value: 'client' },
  { label: 'Workers', value: 'worker' },
  { label: 'Verified Workers', value: 'verified_worker' },
];

function workerFrom(account: { workers?: AdminAccountWorker | AdminAccountWorker[] | null }) {
  if (Array.isArray(account.workers)) return account.workers[0] ?? null;
  return account.workers ?? null;
}

function displayRole(account: AdminAccount) {
  if (workerFrom(account)) return 'worker';
  return account.signup_type ?? account.role ?? account.last_active_mode ?? 'client';
}

export function AccountsPage({ onNavigate }: AccountsPageProps) {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [selected, setSelected] = useState<AdminAccountDetail | null>(null);
  const [blocks, setBlocks] = useState<AdminBlockRelationships | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [suspensionReason, setSuspensionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [tierOverride, setTierOverride] = useState<'identity' | 'professional' | 'premium'>('identity');
  const [updatingTier, setUpdatingTier] = useState(false);

  const handleUpdateTier = async (accountId: string, level: 'identity' | 'professional' | 'premium', isVerified = true) => {
    setUpdatingTier(true);
    setError('');
    try {
      await adminPatch(`/admin/accounts/${accountId}/tier`, {
        verification_level: level,
        is_verified: isVerified,
      });
      setMessage(`Updated artisan verification level to ${level.toUpperCase()}.`);
      const updated = await adminGet<AdminAccountDetail>(`/admin/accounts/${accountId}`);
      setSelected(updated);
      loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update tier.');
    } finally {
      setUpdatingTier(false);
    }
  };

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('q', search.trim());
    if (filter === 'active' || filter === 'suspended') params.set('status', filter);
    if (['client', 'worker', 'verified_worker'].includes(filter)) params.set('role', filter);
    return params.toString();
  }, [search, filter]);

  const loadAccounts = () => {
    setLoading(true);
    adminGet<AdminAccount[]>(`/admin/accounts${query ? `?${query}` : ''}`)
      .then((data) => {
        setAccounts(data);
        setError('');
      })
      .catch((err) => {
        setAccounts([]);
        setError(err instanceof Error ? err.message : 'Could not load accounts.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(loadAccounts, [query]);

  const openAccount = (accountId: string) => {
    setDetailLoading(true);
    setBlocks(null);
    adminGet<AdminAccountDetail>(`/admin/accounts/${accountId}`)
      .then((data) => {
        setSelected(data);
        setSuspensionReason('');
        setError('');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load account.'))
      .finally(() => setDetailLoading(false));
    // Block activity is a secondary, moderator-only signal — fetch it in
    // parallel and fail safe so a block-read error never blocks the drawer.
    adminGet<AdminBlockRelationships>(`/admin/accounts/${accountId}/blocks`)
      .then(setBlocks)
      .catch(() => setBlocks(null));
  };

  const suspendAccount = async () => {
    if (!selected || suspensionReason.trim().length < 3) return;
    setSaving(true);
    try {
      await adminPatch(`/admin/accounts/${selected.profile.id}/suspend`, {
        reason: suspensionReason.trim(),
      });
      setMessage('Account suspended.');
      await openAccount(selected.profile.id);
      loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not suspend account.');
    } finally {
      setSaving(false);
    }
  };

  const reactivateAccount = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await adminPatch(`/admin/accounts/${selected.profile.id}/reactivate`, {});
      setMessage('Account reactivated.');
      await openAccount(selected.profile.id);
      loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reactivate account.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout currentPage="accounts" onNavigate={onNavigate}>
      <div className="space-y-5 animate-fade-in">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Accounts</h2>
          <p className="text-sm text-text-muted">Search accounts and moderate platform access.</p>
        </div>

        {message && <div className="card p-3 text-sm text-success-dark bg-success-light/40">{message}</div>}
        {error && <div className="card p-3 text-sm text-error bg-error-light/40 border-error/20">{error}</div>}

        <div className="card p-4 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              className="input-field pl-9"
              placeholder="Search by name, phone, email, or user id"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {filters.map((item) => (
              <button
                key={item.value}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  filter === item.value
                    ? 'bg-primary text-white'
                    : 'bg-neutral-100 text-text-secondary hover:bg-neutral-200'
                }`}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-text-muted">Loading accounts...</div>
          ) : accounts.length === 0 ? (
            <div className="py-16 text-center">
              <Users size={32} className="text-neutral-300 mx-auto mb-3" />
              <p className="text-text-muted">No accounts found.</p>
            </div>
          ) : (
            <div>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-neutral-100" style={{ backgroundColor: '#FFF8F0' }}>
                    <tr>
                      <th className="table-header">Account</th>
                      <th className="table-header">Role</th>
                      <th className="table-header hidden md:table-cell">Worker</th>
                      <th className="table-header">Status</th>
                      <th className="table-header hidden lg:table-cell">Created</th>
                      <th className="table-header">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {accounts.map((account) => {
                      const worker = workerFrom(account);
                      return (
                        <tr key={account.id} className="hover:bg-neutral-50">
                          <td className="table-cell">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                                {(account.full_name || account.auth_user?.email || 'A').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-text-primary">{account.full_name || 'Unnamed account'}</p>
                                <p className="text-xs text-text-muted">{account.auth_user?.email || account.phone || account.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="table-cell capitalize">{displayRole(account)}</td>
                          <td className="table-cell hidden md:table-cell">
                            {worker ? (
                              <div className="space-y-1">
                                <span className={`badge ${worker.is_verified ? 'badge-approved' : 'badge-pending'}`}>
                                  {worker.is_verified ? 'Verified' : 'Unverified'}
                                </span>
                                <p className="text-xs text-text-muted">
                                  {worker.is_available ? 'Available' : 'Unavailable'} · {worker.total_jobs ?? 0} jobs
                                </p>
                              </div>
                            ) : (
                              <span className="text-xs text-text-muted">Client only</span>
                            )}
                          </td>
                          <td className="table-cell">
                            <span className={`badge ${account.account_status === 'active' ? 'badge-approved' : 'badge-rejected'}`}>
                              {account.account_status}
                            </span>
                          </td>
                          <td className="table-cell hidden lg:table-cell">
                            {new Date(account.created_at).toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="table-cell">
                            <button className="btn-ghost" onClick={() => openAccount(account.id)}>
                              <Eye size={16} />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="block md:hidden divide-y divide-neutral-100">
                {accounts.map((account) => {
                  const worker = workerFrom(account);
                  return (
                    <div
                      key={account.id}
                      className="p-4 hover:bg-neutral-50 flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold flex-shrink-0">
                            {(account.full_name || account.auth_user?.email || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-text-primary text-sm">{account.full_name || 'Unnamed account'}</p>
                            <p className="text-xs text-text-muted break-all">{account.auth_user?.email || account.phone || account.id}</p>
                          </div>
                        </div>
                        <span className={`badge ${account.account_status === 'active' ? 'badge-approved' : 'badge-rejected'}`}>
                          {account.account_status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-text-muted text-[10px] uppercase tracking-wider mb-0.5">Role</p>
                          <p className="font-semibold text-text-primary capitalize">{displayRole(account)}</p>
                        </div>
                        <div>
                          <p className="text-text-muted text-[10px] uppercase tracking-wider mb-0.5">Worker Status</p>
                          {worker ? (
                            <div>
                              <span className={`badge ${worker.is_verified ? 'badge-approved' : 'badge-pending'} scale-90 origin-left`}>
                                {worker.is_verified ? 'Verified' : 'Unverified'}
                              </span>
                              <p className="text-[10px] text-text-muted mt-0.5">
                                {worker.is_available ? 'Available' : 'Unavailable'} · {worker.total_jobs ?? 0} jobs
                              </p>
                            </div>
                          ) : (
                            <span className="text-text-muted">Client only</span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs pt-2 border-t border-neutral-100">
                        <span className="text-text-muted">
                          Created: {new Date(account.created_at).toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <button className="btn-ghost py-1 px-2.5 h-auto text-xs" onClick={() => openAccount(account.id)}>
                          <Eye size={14} />
                          View
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {(selected || detailLoading) && (
          <div className="fixed inset-0 z-50 bg-black/30 flex justify-end">
            <div className="w-full max-w-2xl h-full bg-white shadow-xl overflow-y-auto">
              {detailLoading || !selected ? (
                <div className="p-8 text-text-muted">Loading account...</div>
              ) : (
                <AccountDrawer
                  detail={selected}
                  blocks={blocks}
                  reason={suspensionReason}
                  saving={saving}
                  tierOverride={tierOverride}
                  updatingTier={updatingTier}
                  onTierChange={setTierOverride}
                  onUpdateTier={handleUpdateTier}
                  onReasonChange={setSuspensionReason}
                  onClose={() => {
                    setSelected(null);
                    setBlocks(null);
                  }}
                  onSuspend={suspendAccount}
                  onReactivate={reactivateAccount}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function AccountDrawer({
  detail,
  blocks,
  reason,
  saving,
  tierOverride,
  updatingTier,
  onTierChange,
  onUpdateTier,
  onReasonChange,
  onClose,
  onSuspend,
  onReactivate,
}: {
  detail: AdminAccountDetail;
  blocks: AdminBlockRelationships | null;
  reason: string;
  saving: boolean;
  tierOverride: 'identity' | 'professional' | 'premium';
  updatingTier: boolean;
  onTierChange: (val: 'identity' | 'professional' | 'premium') => void;
  onUpdateTier: (accountId: string, level: 'identity' | 'professional' | 'premium', isVerified: boolean) => void;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
}) {
  const worker = workerFrom(detail.profile);
  const isSuspended = detail.profile.account_status === 'suspended';
  const [showBlockDetail, setShowBlockDetail] = useState(false);

  useEffect(() => {
    const currentLevel = (detail.verifications?.[0]?.verification_level || 'identity') as 'identity' | 'professional' | 'premium';
    if (['identity', 'professional', 'premium'].includes(currentLevel)) {
      onTierChange(currentLevel);
    }
  }, [detail.profile.id]);

  useEffect(() => {
    setShowBlockDetail(false);
  }, [detail.profile.id]);

  return (
    <div className="card p-6 space-y-6 animate-fade-in border-2 border-primary/20">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-text-primary">{detail.profile.full_name || 'Unnamed Account'}</h3>
          <p className="text-xs text-text-muted">Account inspection drawer</p>
        </div>
        <button className="p-2 rounded-xl hover:bg-neutral-100 text-text-muted hover:text-text-primary" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <InfoTile label="Account" value={detail.profile.account_status} icon={isSuspended ? ShieldOff : UserCheck} tone={isSuspended ? 'text-error' : 'text-success-dark'} />
        <InfoTile label="Role" value={worker ? 'Worker' : 'Client'} icon={Users} tone="text-primary" />
        <InfoTile label="Jobs" value={String(worker?.total_jobs ?? detail.recent_jobs.length)} icon={CheckCircle} tone="text-info-dark" />
      </div>

      {blocks && (blocks.blocked_by_count > 0 || blocks.blocks_count > 0) && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-text-primary flex items-center gap-2">
              <Ban size={16} className={blocks.blocked_by_count > 0 ? 'text-error' : 'text-text-muted'} />
              Block activity
            </p>
            {(blocks.blocked_by.length > 0 || blocks.blocks.length > 0) && (
              <button
                className="btn-ghost py-1 px-2.5 h-auto text-xs"
                onClick={() => setShowBlockDetail((value) => !value)}
              >
                {showBlockDetail ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showBlockDetail ? 'Hide' : 'Details'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl p-3 border ${blocks.blocked_by_count > 0 ? 'border-error/30 bg-error-light/30' : 'border-neutral-100'}`}>
              <p className={`text-2xl font-bold ${blocks.blocked_by_count > 0 ? 'text-error' : 'text-text-primary'}`}>{blocks.blocked_by_count}</p>
              <p className="text-xs text-text-muted">Users who blocked this account</p>
            </div>
            <div className="rounded-xl p-3 border border-neutral-100">
              <p className="text-2xl font-bold text-text-primary">{blocks.blocks_count}</p>
              <p className="text-xs text-text-muted">Users this account blocked</p>
            </div>
          </div>

          {blocks.blocked_by_count >= 3 && (
            <p className="text-xs text-error flex items-center gap-1.5">
              <AlertTriangle size={13} />
              Multiple users have blocked this account — review for a possible abuse pattern.
            </p>
          )}

          {showBlockDetail && (
            <div className="space-y-4 pt-1">
              <BlockList title="Blocked by" edges={blocks.blocked_by} emptyLabel="No one has blocked this account." />
              <BlockList title="Has blocked" edges={blocks.blocks} emptyLabel="This account hasn't blocked anyone." />
            </div>
          )}
        </div>
      )}

      {isSuspended ? (
        <div className="card p-4 border-error/20 bg-error-light/30">
          <p className="font-semibold text-error flex items-center gap-2">
            <AlertTriangle size={16} />
            Suspended account
          </p>
          <p className="text-sm text-text-secondary mt-1">{detail.profile.suspension_reason || 'No reason recorded.'}</p>
          <button className="btn-primary mt-4" disabled={saving} onClick={onReactivate}>
            Reactivate account
          </button>
        </div>
      ) : (
        <div className="card p-4 space-y-3">
          <p className="font-semibold text-text-primary">Suspend account</p>
          <textarea
            className="input-field min-h-[88px]"
            placeholder="Reason shown to support/admin records"
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
          />
          <button className="btn-primary bg-error hover:bg-error" disabled={saving || reason.trim().length < 3} onClick={onSuspend}>
            <ShieldOff size={16} />
            Suspend
          </button>
        </div>
      )}

      <section className="card p-4">
        <h4 className="font-bold text-text-primary mb-3">Profile</h4>
        <dl className="grid sm:grid-cols-2 gap-3 text-sm">
          <Detail label="Phone" value={detail.profile.phone || detail.auth_user?.phone || '—'} />
          <Detail label="Created" value={new Date(detail.profile.created_at).toLocaleString('en-GH')} />
          <Detail label="Last sign in" value={detail.auth_user?.last_sign_in_at ? new Date(detail.auth_user.last_sign_in_at).toLocaleString('en-GH') : '—'} />
          <Detail label="User ID" value={detail.profile.id} />
        </dl>
      </section>

      {worker && (
        <section className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-text-primary">Worker Status & Tier</h4>
            <span className={`px-2.5 py-0.5 text-xs font-bold rounded ${worker.is_verified ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'}`}>
              {worker.is_verified ? 'Verified Worker' : 'Unverified Worker'}
            </span>
          </div>

          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2.5">
            <p className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Quick Tier Level Override</p>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={tierOverride}
                onChange={(e) => onTierChange(e.target.value as any)}
                className="p-2 border border-neutral-300 rounded-lg text-xs bg-white font-medium focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="identity">🛡️ Identity Verified</option>
                <option value="professional">⭐️ Professional Artisan</option>
                <option value="premium">👑 Master Artisan</option>
              </select>

              <button
                disabled={updatingTier}
                onClick={() => onUpdateTier(detail.profile.id, tierOverride, true)}
                className="px-3.5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {updatingTier ? 'Updating...' : 'Set Tier'}
              </button>

              {worker.is_verified && (
                <button
                  disabled={updatingTier}
                  onClick={() => onUpdateTier(detail.profile.id, 'identity', false)}
                  className="px-3 py-2 bg-neutral-200 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  Revoke Verification
                </button>
              )}
            </div>
          </div>

          <div className="text-xs space-y-1 text-text-secondary pt-1">
            <p><strong>Skills:</strong> {worker.skills?.join(', ') || '—'}</p>
            <p><strong>Service areas:</strong> {worker.service_areas?.join(', ') || '—'}</p>
          </div>
        </section>
      )}

      <section className="card p-4">
        <h4 className="font-bold text-text-primary mb-3">Recent activity</h4>
        <div className="space-y-2">
          {detail.recent_jobs.slice(0, 5).map((job) => (
            <div key={job.id} className="flex items-center justify-between text-sm border-b border-neutral-50 pb-2">
              <span className="font-medium text-text-primary">{job.title}</span>
              <span className="text-text-muted">{job.status}</span>
            </div>
          ))}
          {detail.recent_jobs.length === 0 && <p className="text-sm text-text-muted">No recent jobs.</p>}
        </div>
      </section>
    </div>
  );
}

function BlockList({ title, edges, emptyLabel }: { title: string; edges: AdminBlockEdge[]; emptyLabel: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
        {title} ({edges.length})
      </p>
      {edges.length === 0 ? (
        <p className="text-xs text-text-muted">{emptyLabel}</p>
      ) : (
        <div className="space-y-2">
          {edges.map((edge) => (
            <div key={edge.id} className="flex items-start justify-between gap-3 text-sm border-b border-neutral-50 pb-2">
              <div className="min-w-0">
                <p className="font-medium text-text-primary truncate">{edge.user?.full_name || 'Unknown user'}</p>
                {edge.reason && <p className="text-xs text-text-muted break-words">“{edge.reason}”</p>}
              </div>
              <span className="text-xs text-text-muted whitespace-nowrap">
                {new Date(edge.created_at).toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  tone: string;
}) {
  return (
    <div className="card p-4">
      <Icon size={18} className={tone} />
      <p className="text-xs text-text-muted mt-2">{label}</p>
      <p className="font-bold text-text-primary capitalize">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-text-muted uppercase">{label}</dt>
      <dd className="text-text-primary break-all">{value}</dd>
    </div>
  );
}
