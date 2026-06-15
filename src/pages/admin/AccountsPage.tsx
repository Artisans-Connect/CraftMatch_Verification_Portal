import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  Search,
  ShieldOff,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { adminGet, adminPatch } from '../../lib/api';
import type { AdminAccount, AdminAccountDetail, AdminAccountWorker } from '../../types';

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
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [suspensionReason, setSuspensionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
    adminGet<AdminAccountDetail>(`/admin/accounts/${accountId}`)
      .then((data) => {
        setSelected(data);
        setSuspensionReason('');
        setError('');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load account.'))
      .finally(() => setDetailLoading(false));
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
            <div className="overflow-x-auto">
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
                  reason={suspensionReason}
                  saving={saving}
                  onReasonChange={setSuspensionReason}
                  onClose={() => setSelected(null)}
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
  reason,
  saving,
  onReasonChange,
  onClose,
  onSuspend,
  onReactivate,
}: {
  detail: AdminAccountDetail;
  reason: string;
  saving: boolean;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
}) {
  const worker = workerFrom(detail.profile);
  const isSuspended = detail.profile.account_status === 'suspended';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-text-primary">{detail.profile.full_name || 'Unnamed account'}</h3>
          <p className="text-sm text-text-muted">{detail.auth_user?.email || detail.profile.phone || detail.profile.id}</p>
        </div>
        <button className="btn-ghost" onClick={onClose}><X size={18} /></button>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <InfoTile label="Account" value={detail.profile.account_status} icon={isSuspended ? ShieldOff : UserCheck} tone={isSuspended ? 'text-error' : 'text-success-dark'} />
        <InfoTile label="Role" value={worker ? 'Worker' : 'Client'} icon={Users} tone="text-primary" />
        <InfoTile label="Jobs" value={String(worker?.total_jobs ?? detail.recent_jobs.length)} icon={CheckCircle} tone="text-info-dark" />
      </div>

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
        <section className="card p-4">
          <h4 className="font-bold text-text-primary mb-3">Worker status</h4>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`badge ${worker.is_verified ? 'badge-approved' : 'badge-pending'}`}>{worker.is_verified ? 'Verified' : 'Unverified'}</span>
            <span className={`badge ${worker.is_available ? 'badge-approved' : 'badge-rejected'}`}>{worker.is_available ? 'Available' : 'Unavailable'}</span>
          </div>
          <p className="text-sm text-text-secondary">Skills: {worker.skills?.join(', ') || '—'}</p>
          <p className="text-sm text-text-secondary">Service areas: {worker.service_areas?.join(', ') || '—'}</p>
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
