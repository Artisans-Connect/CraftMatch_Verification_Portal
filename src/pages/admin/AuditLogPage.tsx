import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, FileText, Clock, Search } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { adminGet } from '../../lib/api';
import type { VerificationAuditLog, AuditAction } from '../../types';

interface AuditLogPageProps {
  onNavigate: (page: string, data?: unknown) => void;
}

const actionConfig: Record<AuditAction, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  submitted: { label: 'Submitted', icon: FileText, color: 'text-primary', bg: 'bg-primary-50' },
  reviewed: { label: 'Reviewed', icon: Clock, color: 'text-info-dark', bg: 'bg-info-light' },
  approved: { label: 'Approved', icon: CheckCircle, color: 'text-success-dark', bg: 'bg-success-light' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-error', bg: 'bg-error-light' },
  more_info_requested: { label: 'More Info Requested', icon: AlertCircle, color: 'text-gold-700', bg: 'bg-gold-50' },
  documents_uploaded: { label: 'Documents Uploaded', icon: FileText, color: 'text-primary', bg: 'bg-primary-50' },
  status_changed: { label: 'Status Changed', icon: Clock, color: 'text-text-muted', bg: 'bg-neutral-100' },
};

const allActions: (AuditAction | 'all')[] = [
  'all',
  'submitted',
  'reviewed',
  'approved',
  'rejected',
  'more_info_requested',
  'documents_uploaded',
  'status_changed',
];

export function AuditLogPage({ onNavigate }: AuditLogPageProps) {
  const [logs, setLogs] = useState<(VerificationAuditLog & { worker_verifications?: { full_name: string; application_number: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<AuditAction | 'all'>('all');
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    adminGet<typeof logs>('/verification/admin/audit-logs?limit=200')
      .then((data) => {
        setLogs(data);
        setLoadError('');
      })
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : 'Could not load audit logs.');
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter((l) => {
    if (actionFilter !== 'all' && l.action !== actionFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const name = (l.worker_verifications?.full_name || '').toLowerCase();
      const appNum = (l.worker_verifications?.application_number || '').toLowerCase();
      const admin = (l.admin_name || '').toLowerCase();
      const notes = (l.notes || '').toLowerCase();
      return name.includes(q) || appNum.includes(q) || admin.includes(q) || notes.includes(q);
    }
    return true;
  });

  return (
    <AdminLayout currentPage="audits" onNavigate={onNavigate}>
      <div className="space-y-4 animate-fade-in">
        {loadError && (
          <div className="card p-4 border border-error/20 bg-error-light/30">
            <p className="text-sm text-error">{loadError}</p>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="card p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search audit trail by applicant name, app #, admin, or notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <span className="text-xs text-neutral-400 font-mono">
              Showing {filtered.length} of {logs.length} audit logs
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-neutral-100">
            <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider mr-1">Action:</span>
            {allActions.map((action) => (
              <button
                key={action}
                onClick={() => setActionFilter(action)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  actionFilter === action
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-neutral-100 text-text-secondary hover:bg-neutral-200'
                }`}
              >
                {action === 'all' ? 'All Actions' : action.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Log table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <svg className="animate-spin w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <FileText size={32} className="text-neutral-300 mx-auto mb-3" />
              <p className="text-text-muted">No audit logs found</p>
            </div>
          ) : (
            <div>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-neutral-100" style={{ backgroundColor: '#FFF8F0' }}>
                    <tr>
                      <th className="table-header">Timestamp</th>
                      <th className="table-header">Action</th>
                      <th className="table-header hidden sm:table-cell">Application</th>
                      <th className="table-header hidden md:table-cell">Admin</th>
                      <th className="table-header">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {filtered.map((log) => {
                      const config = actionConfig[log.action] || actionConfig.status_changed;
                      const Icon = config.icon;
                      return (
                        <tr key={log.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="table-cell whitespace-nowrap">
                            <p className="text-sm text-text-primary">
                              {new Date(log.created_at).toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-xs text-text-muted">
                              {new Date(log.created_at).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </td>
                          <td className="table-cell">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color}`}>
                              <Icon size={12} />
                              {config.label}
                            </div>
                          </td>
                          <td className="table-cell hidden sm:table-cell">
                            {log.worker_verifications ? (
                              <div>
                                <p className="text-sm font-medium text-text-primary">{log.worker_verifications.full_name}</p>
                                <p className="text-xs text-text-muted font-mono">{log.worker_verifications.application_number}</p>
                              </div>
                            ) : (
                              <span className="text-xs text-text-muted">—</span>
                            )}
                          </td>
                          <td className="table-cell hidden md:table-cell">
                            <span className="text-sm text-text-secondary">{log.admin_name || 'System'}</span>
                          </td>
                          <td className="table-cell max-w-[200px]">
                            <p className="text-sm text-text-secondary truncate">{log.notes || '—'}</p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="block md:hidden divide-y divide-neutral-100">
                {filtered.map((log) => {
                  const config = actionConfig[log.action] || actionConfig.status_changed;
                  const Icon = config.icon;
                  return (
                    <div key={log.id} className="p-4 hover:bg-neutral-50 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-xs text-text-muted">
                            {new Date(log.created_at).toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric' })} at {new Date(log.created_at).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color}`}>
                          <Icon size={12} />
                          {config.label}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-text-muted text-[10px] uppercase tracking-wider mb-0.5">Application</p>
                          {log.worker_verifications ? (
                            <div>
                              <p className="font-semibold text-text-primary">{log.worker_verifications.full_name}</p>
                              <p className="text-[10px] text-text-muted font-mono">{log.worker_verifications.application_number}</p>
                            </div>
                          ) : (
                            <p className="text-text-muted">—</p>
                          )}
                        </div>
                        <div>
                          <p className="text-text-muted text-[10px] uppercase tracking-wider mb-0.5">Operator</p>
                          <p className="font-medium text-text-primary">{log.admin_name || 'System'}</p>
                        </div>
                      </div>

                      {log.notes && (
                        <div className="mt-1 p-2 bg-neutral-50 rounded text-xs text-text-secondary border border-neutral-100/50 break-words">
                          <span className="font-medium text-text-primary block text-[10px] uppercase tracking-wider mb-0.5">Notes</span>
                          {log.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-text-muted text-center">Showing last 100 audit entries</p>
      </div>
    </AdminLayout>
  );
}
