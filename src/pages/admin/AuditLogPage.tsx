import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, FileText, Clock } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { supabase } from '../../lib/supabase';
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

export function AuditLogPage({ onNavigate }: AuditLogPageProps) {
  const [logs, setLogs] = useState<(VerificationAuditLog & { worker_verifications?: { full_name: string; application_number: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<AuditAction | 'all'>('all');

  useEffect(() => {
    supabase
      .from('verification_audit_logs')
      .select('*, worker_verifications(full_name, application_number)')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (data) setLogs(data as typeof logs);
        setLoading(false);
      });
  }, []);

  const filtered = actionFilter === 'all' ? logs : logs.filter(l => l.action === actionFilter);

  return (
    <AdminLayout currentPage="audits" onNavigate={onNavigate}>
      <div className="space-y-4 animate-fade-in">
        {/* Filters */}
        <div className="card p-4 flex items-center gap-4 flex-wrap">
          <span className="text-sm font-semibold text-text-primary">Filter by action:</span>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'submitted', 'approved', 'rejected', 'more_info_requested'] as const).map(action => (
              <button
                key={action}
                onClick={() => setActionFilter(action)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  actionFilter === action
                    ? 'bg-primary text-white'
                    : 'bg-neutral-100 text-text-secondary hover:bg-neutral-200'
                }`}
              >
                {action === 'all' ? 'All' : action.replace(/_/g, ' ')}
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
            <div className="overflow-x-auto">
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
          )}
        </div>

        <p className="text-xs text-text-muted text-center">Showing last 100 audit entries</p>
      </div>
    </AdminLayout>
  );
}
