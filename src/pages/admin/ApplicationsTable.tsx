import { useEffect, useState } from 'react';
import { Search, Filter, ChevronDown, AlertTriangle } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { StatusBadge, LevelBadge } from '../../components/ui/StatusBadge';
import { adminGet } from '../../lib/api';
import { TRADE_CATEGORIES, GHANA_REGIONS } from '../../lib/constants';
import type { WorkerVerification, VerificationStatus } from '../../types';

interface ApplicationsTableProps {
  onNavigate: (page: string, data?: unknown) => void;
  currentPage?: string;
  filterStatus?: VerificationStatus | null;
}

const STATUSES: { label: string; value: VerificationStatus | 'all' }[] = [
  { label: 'All Status',    value: 'all' },
  { label: 'Pending',       value: 'pending' },
  { label: 'Under Review',  value: 'under_review' },
  { label: 'Approved',      value: 'approved' },
  { label: 'Rejected',      value: 'rejected' },
  { label: 'More Info',     value: 'more_info_requested' },
];

export function ApplicationsTable({ onNavigate, currentPage = 'applications', filterStatus = null }: ApplicationsTableProps) {
  const [applications, setApplications] = useState<WorkerVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(filterStatus || 'all');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    adminGet<WorkerVerification[]>(
      `/verification/admin/applications${params.toString() ? `?${params.toString()}` : ''}`,
    )
      .then((data) => {
        setApplications(data);
        setLoadError('');
      })
      .catch((error) => {
        setApplications([]);
        setLoadError(error instanceof Error ? error.message : 'Could not load applications.');
      })
      .finally(() => setLoading(false));
  }, [filterStatus]);

  const filtered = applications.filter(app => {
    const matchSearch = !search ||
      app.full_name.toLowerCase().includes(search.toLowerCase()) ||
      app.phone_number.includes(search) ||
      app.application_number.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchCategory = categoryFilter === 'All' || app.trade_category === categoryFilter;
    const matchRegion = regionFilter === 'All' || app.current_region === regionFilter;
    return matchSearch && matchStatus && matchCategory && matchRegion;
  });

  return (
    <AdminLayout currentPage={currentPage} onNavigate={onNavigate}>
      <div className="space-y-4 animate-fade-in">
        {/* Filters */}
        {loadError && (
          <div className="card p-4 border border-error/20 bg-error-light/30">
            <p className="text-sm text-error">{loadError}</p>
          </div>
        )}
        <div className="card p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                className="input-field pl-9 text-sm"
                placeholder="Search name, phone, or application ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <select
                  className="input-field text-sm pr-8 appearance-none cursor-pointer"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
              <div className="relative">
                <select className="input-field text-sm pr-8 appearance-none cursor-pointer"
                  value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                  <option value="All">All Trades</option>
                  {TRADE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
              <div className="relative">
                <select className="input-field text-sm pr-8 appearance-none cursor-pointer"
                  value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
                  <option value="All">All Regions</option>
                  {GHANA_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
            <p className="text-xs text-text-muted">
              Showing <span className="font-semibold text-text-primary">{filtered.length}</span> of {applications.length} applications
            </p>
            <button onClick={() => { setSearch(''); setStatusFilter('all'); setCategoryFilter('All'); setRegionFilter('All'); }}
              className="text-xs text-primary font-medium hover:text-primary-dark">
              Clear filters
            </button>
          </div>
        </div>

        {/* Table */}
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
              <Filter size={32} className="text-neutral-300 mx-auto mb-3" />
              <p className="font-medium text-text-muted">No applications found</p>
              <p className="text-sm text-text-muted mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-neutral-100" style={{ backgroundColor: '#FFF8F0' }}>
                    <tr>
                      <th className="table-header">Applicant</th>
                      <th className="table-header">Category</th>
                      <th className="table-header hidden md:table-cell">Location</th>
                      <th className="table-header hidden lg:table-cell">Submitted</th>
                      <th className="table-header">Status</th>
                      <th className="table-header hidden sm:table-cell">Score</th>
                      <th className="table-header hidden lg:table-cell">Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {filtered.map((app) => (
                      <tr
                        key={app.id}
                        onClick={() => onNavigate('application_detail', app)}
                        className="hover:bg-primary-50/30 cursor-pointer transition-colors"
                      >
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-bold">{app.full_name.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-text-primary text-sm">{app.full_name}</p>
                              <p className="text-xs text-text-muted font-mono">{app.application_number}</p>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div>
                            <p className="text-sm font-medium text-text-primary">{app.trade_category}</p>
                            <LevelBadge level={app.verification_level} />
                          </div>
                        </td>
                        <td className="table-cell hidden md:table-cell">
                          <p className="text-sm text-text-primary">{app.current_city}</p>
                          <p className="text-xs text-text-muted">{app.current_region}</p>
                        </td>
                        <td className="table-cell hidden lg:table-cell">
                          <p className="text-sm">{new Date(app.submitted_at).toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </td>
                        <td className="table-cell">
                          <StatusBadge status={app.status} size="sm" />
                        </td>
                        <td className="table-cell hidden sm:table-cell">
                          <span className={`text-sm font-bold ${
                            app.confidence_score >= 80 ? 'text-success-dark' :
                            app.confidence_score >= 60 ? 'text-gold-600' : 'text-error'
                          }`}>
                            {app.confidence_score}/100
                          </span>
                        </td>
                        <td className="table-cell hidden lg:table-cell">
                          {app.fraud_indicators && app.fraud_indicators.length > 0 ? (
                            <div className="flex items-center gap-1 text-error">
                              <AlertTriangle size={14} />
                              <span className="text-xs font-semibold">{app.fraud_indicators.length} flag(s)</span>
                            </div>
                          ) : (
                            <span className="text-xs text-success-dark font-medium">Clean</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="block md:hidden divide-y divide-neutral-100">
                {filtered.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => onNavigate('application_detail', app)}
                    className="p-4 hover:bg-primary-50/30 cursor-pointer transition-colors active:bg-neutral-100 flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">{app.full_name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary text-sm">{app.full_name}</p>
                          <p className="text-xs text-text-muted font-mono">{app.application_number}</p>
                        </div>
                      </div>
                      <StatusBadge status={app.status} size="sm" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-text-muted text-[10px] uppercase tracking-wider mb-0.5">Trade & Level</p>
                        <p className="font-semibold text-text-primary">{app.trade_category}</p>
                        <div className="mt-0.5"><LevelBadge level={app.verification_level} /></div>
                      </div>
                      <div>
                        <p className="text-text-muted text-[10px] uppercase tracking-wider mb-0.5">Location</p>
                        <p className="font-medium text-text-primary">{app.current_city}</p>
                        <p className="text-[10px] text-text-muted">{app.current_region}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-2 border-t border-neutral-100">
                      <div>
                        <span className="text-text-muted">Score: </span>
                        <span className={`font-bold ${app.confidence_score >= 80 ? 'text-success-dark' : app.confidence_score >= 60 ? 'text-gold-600' : 'text-error'}`}>
                          {app.confidence_score}/100
                        </span>
                      </div>
                      <div>
                        {app.fraud_indicators && app.fraud_indicators.length > 0 ? (
                          <div className="flex items-center gap-1 text-error">
                            <AlertTriangle size={12} />
                            <span className="font-semibold">{app.fraud_indicators.length} flag(s)</span>
                          </div>
                        ) : (
                          <span className="text-success-dark font-medium">Clean</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
