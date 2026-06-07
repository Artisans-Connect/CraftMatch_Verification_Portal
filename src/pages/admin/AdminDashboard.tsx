import { useEffect, useState } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, TrendingUp, Users, FileText, Zap } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { adminGet } from '../../lib/api';
import type { WorkerVerification } from '../../types';

interface AdminDashboardProps {
  onNavigate: (page: string, data?: unknown) => void;
}

const statusColors: Record<string, string> = {
  pending: '#E6A017',
  under_review: '#0066CC',
  approved: '#00C853',
  rejected: '#BA1A1A',
  more_info_requested: '#D97706',
};

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [applications, setApplications] = useState<WorkerVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    adminGet<WorkerVerification[]>('/verification/admin/applications')
      .then((data) => {
        setApplications(data);
        setLoadError('');
      })
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : 'Could not load applications.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const stats = {
    pending: applications.filter(a => a.status === 'pending' || a.status === 'under_review').length,
    approvedToday: applications.filter(a => {
      if (a.status !== 'approved' || !a.reviewed_at) return false;
      const today = new Date();
      const reviewed = new Date(a.reviewed_at);
      return reviewed.toDateString() === today.toDateString();
    }).length,
    rejectedToday: applications.filter(a => {
      if (a.status !== 'rejected' || !a.reviewed_at) return false;
      const today = new Date();
      const reviewed = new Date(a.reviewed_at);
      return reviewed.toDateString() === today.toDateString();
    }).length,
    moreInfo: applications.filter(a => a.status === 'more_info_requested').length,
  };

  const categoryBreakdown = applications.reduce((acc, app) => {
    acc[app.trade_category] = (acc[app.trade_category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryBreakdown)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  const statusBreakdown = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = applications.length;
  const approvalRate = total > 0 ? Math.round((statusBreakdown['approved'] || 0) / total * 100) : 0;

  const recentApplications = applications.slice(0, 8);

  const statCards = [
    { label: 'Pending Reviews', value: stats.pending, icon: Clock, color: 'text-gold-600', bg: 'bg-gold-50', border: 'border-gold-100' },
    { label: 'Approved Today', value: stats.approvedToday, icon: CheckCircle, color: 'text-success-dark', bg: 'bg-success-light', border: 'border-success/20' },
    { label: 'Rejected Today', value: stats.rejectedToday, icon: XCircle, color: 'text-error', bg: 'bg-error-light', border: 'border-error/20' },
    { label: 'More Info Needed', value: stats.moreInfo, icon: AlertCircle, color: 'text-gold-700', bg: 'bg-gold-50', border: 'border-gold-100' },
  ];

  if (loading) {
    return (
      <AdminLayout currentPage="dashboard" onNavigate={onNavigate}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <svg className="animate-spin w-8 h-8 text-primary mx-auto mb-3" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <p className="text-text-muted text-sm">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="dashboard" onNavigate={onNavigate}>
      <div className="space-y-6 animate-fade-in">
        {loadError && (
          <div className="card p-4 border border-error/20 bg-error-light/30">
            <p className="text-sm text-error">{loadError}</p>
          </div>
        )}
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className={`card p-5 border ${card.border}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-text-secondary">{card.label}</span>
                  <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center`}>
                    <Icon size={18} className={card.color} />
                  </div>
                </div>
                <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Status distribution */}
          <div className="card p-5">
            <h3 className="font-bold text-text-primary mb-5 flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              Verification Status
            </h3>
            <div className="space-y-3">
              {Object.entries(statusBreakdown).map(([status, count]) => {
                const pct = total > 0 ? Math.round(count / total * 100) : 0;
                const color = statusColors[status] || '#A69585';
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-text-secondary capitalize">{status.replace('_', ' ')}</span>
                      <span className="text-xs font-bold text-text-primary">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-neutral-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-sm text-text-muted">Approval Rate</span>
              <span className="text-lg font-bold text-success-dark">{approvalRate}%</span>
            </div>
          </div>

          {/* Top categories */}
          <div className="card p-5">
            <h3 className="font-bold text-text-primary mb-5 flex items-center gap-2">
              <Users size={18} className="text-primary" />
              Top Trades
            </h3>
            <div className="space-y-3">
              {topCategories.map(([cat, count], i) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-text-muted w-5">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-text-primary">{cat}</span>
                      <span className="text-xs text-text-muted">{count}</span>
                    </div>
                    <div className="w-full bg-neutral-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-primary"
                        style={{ width: `${(count / topCategories[0][1]) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card p-5">
            <h3 className="font-bold text-text-primary mb-5 flex items-center gap-2">
              <Zap size={18} className="text-primary" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('pending')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gold-50 hover:bg-gold-100 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-gold-600" />
                  <span className="text-sm font-medium text-text-primary">Review Pending</span>
                </div>
                <span className="text-xs font-bold text-gold-600 bg-gold-100 px-2 py-0.5 rounded-full group-hover:bg-gold-200">
                  {stats.pending}
                </span>
              </button>
              <button
                onClick={() => onNavigate('more_info')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle size={18} className="text-gold-600" />
                  <span className="text-sm font-medium text-text-primary">Awaiting Docs</span>
                </div>
                <span className="text-xs font-bold text-gold-600 bg-gold-50 px-2 py-0.5 rounded-full group-hover:bg-gold-100">
                  {stats.moreInfo}
                </span>
              </button>
              <button
                onClick={() => onNavigate('audits')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-text-muted" />
                  <span className="text-sm font-medium text-text-primary">View Audit Log</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Recent applications */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-neutral-100">
            <h3 className="font-bold text-text-primary">Recent Applications</h3>
            <button onClick={() => onNavigate('applications')} className="text-sm text-primary font-medium hover:text-primary-dark">
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-neutral-100" style={{ backgroundColor: '#FFF8F0' }}>
                <tr>
                  <th className="table-header">Applicant</th>
                  <th className="table-header">Trade</th>
                  <th className="table-header hidden md:table-cell">Location</th>
                  <th className="table-header hidden lg:table-cell">Submitted</th>
                  <th className="table-header">Status</th>
                  <th className="table-header hidden sm:table-cell">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {recentApplications.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => onNavigate('application_detail', app)}
                    className="hover:bg-neutral-50 cursor-pointer transition-colors"
                  >
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">{app.full_name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-text-primary text-sm">{app.full_name}</p>
                          <p className="text-xs text-text-muted font-mono">{app.application_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">{app.trade_category}</td>
                    <td className="table-cell hidden md:table-cell">{app.current_city}</td>
                    <td className="table-cell hidden lg:table-cell">
                      {new Date(app.submitted_at).toLocaleDateString('en-GH', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={app.status} size="sm" />
                    </td>
                    <td className="table-cell hidden sm:table-cell">
                      <span className={`font-bold text-sm ${app.confidence_score >= 80 ? 'text-success-dark' : app.confidence_score >= 60 ? 'text-gold-600' : 'text-error'}`}>
                        {app.confidence_score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
