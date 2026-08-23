import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle, ShieldAlert, Clock, CheckCircle2, Search, Filter,
  Eye, UserX, AlertCircle,
  X, ExternalLink, ShieldCheck, History
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { adminGet, adminPatch } from '../../lib/api';
import type { AdminReport, ReportStatus, ReportPriority, ModerationAction } from '../../types';

interface ReportsPageProps {
  onNavigate?: (page: string) => void;
}

export function ReportsPage({ onNavigate }: ReportsPageProps) {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Live-queue signal: no moderator user accounts exist (portal auth is a shared
  // admin key), so new reports can't be push-notified. Instead we silently poll
  // and surface an attention banner when new reports arrive since last seen.
  const knownReportIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);
  const [newReportAlert, setNewReportAlert] = useState<{ count: number; emergency: boolean } | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [emergencyFilter, setEmergencyFilter] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected report detail modal
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [reportDetail, setReportDetail] = useState<AdminReport | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Action form state
  const [actionStatus, setActionStatus] = useState<ReportStatus>('UNDER_REVIEW');
  const [actionPriority, setActionPriority] = useState<ReportPriority>('HIGH');
  const [actionTaken, setActionTaken] = useState<ModerationAction>('NONE');
  const [actionSuspendDays, setActionSuspendDays] = useState<number>(7);
  const [moderationNotes, setModerationNotes] = useState('');
  const [resolutionReason, setResolutionReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Direct Account Action state
  const [suspensionModalOpen, setSuspensionModalOpen] = useState(false);
  const [suspensionReasonInput, setSuspensionReasonInput] = useState('');
  const [isAccountActioning, setIsAccountActioning] = useState(false);

  const handleToggleAccountSuspension = async () => {
    if (!reportDetail?.reported?.id) return;
    const isSuspended = reportDetail.reported.account_status === 'suspended';
    const userId = reportDetail.reported.id;

    if (!isSuspended && !suspensionModalOpen) {
      setSuspensionModalOpen(true);
      return;
    }

    setIsAccountActioning(true);
    try {
      if (isSuspended) {
        await adminPatch(`/admin/accounts/${userId}/reactivate`, {});
        alert('Account reactivated successfully.');
      } else {
        if (!suspensionReasonInput.trim()) {
          alert('Suspension reason is required.');
          setIsAccountActioning(false);
          return;
        }
        await adminPatch(`/admin/accounts/${userId}/suspend`, {
          reason: suspensionReasonInput.trim(),
        });
        alert('Account suspended successfully and audit log created.');
      }
      setSuspensionModalOpen(false);
      setSuspensionReasonInput('');

      // Refresh current report detail & reports list
      if (selectedReportId) {
        const refreshedDetail = await adminGet<AdminReport>(`/admin/reports/${selectedReportId}`);
        setReportDetail(refreshedDetail);
      }
      fetchReports();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Account action failed.');
    } finally {
      setIsAccountActioning(false);
    }
  };

  const fetchReports = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (emergencyFilter) params.append('is_emergency', 'true');
      if (searchQuery.trim()) params.append('q', searchQuery.trim());

      const data = await adminGet<AdminReport[]>(`/admin/reports?${params.toString()}`);
      const list = data || [];

      // Detect reports that have appeared since the last known baseline. Skip the
      // very first load (nothing to compare against) and non-silent refreshes
      // (filter/search changes intentionally reset the view).
      if (silent && !isFirstLoadRef.current) {
        const known = knownReportIdsRef.current;
        const fresh = list.filter((r) => !known.has(r.id));
        if (fresh.length > 0) {
          const hasEmergency = fresh.some((r) => r.is_emergency);
          setNewReportAlert((prev) => ({
            count: (prev?.count ?? 0) + fresh.length,
            emergency: (prev?.emergency ?? false) || hasEmergency,
          }));
        }
      } else if (!silent) {
        // A deliberate (filter/search) refresh re-baselines and clears stale alerts.
        setNewReportAlert(null);
      }

      knownReportIdsRef.current = new Set(list.map((r) => r.id));
      isFirstLoadRef.current = false;
      setReports(list);
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : 'Failed to fetch safety reports');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Keep a live reference to the latest fetchReports so the polling interval
  // (registered once) always calls the freshest closure with current filters.
  const fetchReportsRef = useRef(fetchReports);
  fetchReportsRef.current = fetchReports;

  useEffect(() => {
    fetchReports();
  }, [statusFilter, priorityFilter, emergencyFilter]);

  // Silent background poll so moderators see new/emergency reports without a
  // manual reload. Pauses while the tab is hidden to avoid needless load.
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchReportsRef.current(true);
      }
    }, 25000);
    return () => window.clearInterval(intervalId);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  const handleInspectReport = async (reportId: string) => {
    setSelectedReportId(reportId);
    setLoadingDetail(true);
    try {
      const detail = await adminGet<AdminReport>(`/admin/reports/${reportId}`);
      setReportDetail(detail);
      setActionStatus(detail.status);
      setActionPriority(detail.priority);
      setActionTaken(detail.action_taken || 'NONE');
      setModerationNotes(detail.moderation_notes || '');
      setResolutionReason(detail.resolution_reason || '');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load report detail');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleApplyModeration = async () => {
    if (!selectedReportId) return;
    if (actionTaken === 'PERMANENT_BAN' && !window.confirm('WARNING: PERMANENT BAN is a destructive action. Are you sure you want to permanently ban this account?')) {
      return;
    }
    setIsSubmittingAction(true);
    try {
      const updated = await adminPatch<AdminReport>(`/admin/reports/${selectedReportId}`, {
        status: actionStatus,
        priority: actionPriority,
        action_taken: actionTaken,
        moderation_notes: moderationNotes,
        resolution_reason: resolutionReason,
        ...(actionTaken === 'TEMPORARY_SUSPENSION' ? { suspend_duration_days: actionSuspendDays } : {}),
      });

      setReportDetail(updated);
      alert('Moderation action applied and logged to audit trail.');
      fetchReports();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to apply moderation action');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Metrics
  const totalPending = reports.filter(r => r.status === 'PENDING').length;
  const totalEmergency = reports.filter(r => r.is_emergency).length;
  const totalInReview = reports.filter(r => r.status === 'UNDER_REVIEW').length;
  const totalActionTaken = reports.filter(r => r.status === 'ACTION_TAKEN' || r.status === 'RESOLVED').length;

  return (
    <AdminLayout currentPage="reports" onNavigate={onNavigate}>
      <div className="space-y-6">
        {/* Top Header & Overview Cards */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-neutral-900 flex items-center gap-2">
              <ShieldAlert className="text-primary" size={28} />
              Trust & Safety Moderation Center
            </h1>
            <p className="text-sm text-neutral-500">
              Manage user reports, safety emergencies, repeat offenders, and policy enforcement audit logs.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            Live · auto-refreshing
          </div>
        </div>

        {/* New-report attention banner (silent poll surfaced new arrivals) */}
        {newReportAlert && (
          <button
            onClick={() => setNewReportAlert(null)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm border transition-colors ${
              newReportAlert.emergency
                ? 'bg-red-600 text-white border-red-700 hover:bg-red-700 animate-pulse'
                : 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700'
            }`}
          >
            <AlertTriangle size={16} />
            {newReportAlert.count} new {newReportAlert.count === 1 ? 'report' : 'reports'} in the queue
            {newReportAlert.emergency ? ' — includes an EMERGENCY' : ''} · click to dismiss
          </button>
        )}

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase">Pending Queue</p>
              <p className="text-2xl font-bold text-neutral-900">{totalPending}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-red-200 bg-red-50/20 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-lg">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-red-600 uppercase">Urgent Emergency</p>
              <p className="text-2xl font-bold text-red-700">{totalEmergency}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Eye size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase">Under Review</p>
              <p className="text-2xl font-bold text-neutral-900">{totalInReview}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase">Enforced / Resolved</p>
              <p className="text-2xl font-bold text-neutral-900">{totalActionTaken}</p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <input
                type="text"
                placeholder="Search ticket #, category, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </form>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-neutral-500" />
                <span className="text-xs font-medium text-neutral-500">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-neutral-200 rounded-lg text-xs py-2 px-3 bg-white focus:outline-none focus:border-primary"
                >
                  <option value="all">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="NEEDS_EVIDENCE">Needs Evidence</option>
                  <option value="ACTION_TAKEN">Action Taken</option>
                  <option value="DISMISSED">Dismissed</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-neutral-500">Priority:</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="border border-neutral-200 rounded-lg text-xs py-2 px-3 bg-white focus:outline-none focus:border-primary"
                >
                  <option value="all">All Priorities</option>
                  <option value="URGENT">URGENT</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>

              <button
                onClick={() => setEmergencyFilter(!emergencyFilter)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                  emergencyFilter
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                <AlertCircle size={14} />
                Emergency Only
              </button>
            </div>
          </div>
        </div>

        {/* Table of Reports */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-neutral-500">Loading safety reports queue...</div>
          ) : error ? (
            <div className="p-12 text-center text-red-600">{error}</div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center text-neutral-500">No safety reports found matching filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-xs font-semibold text-neutral-600 uppercase">
                  <tr>
                    <th className="py-3.5 px-4">Ticket</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Reporter</th>
                    <th className="py-3.5 px-4">Reported User</th>
                    <th className="py-3.5 px-4">Priority</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Submitted</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {reports.map((report) => (
                    <tr key={report.id} className={`hover:bg-neutral-50/80 transition-colors ${report.is_emergency ? 'bg-red-50/30' : ''}`}>
                      <td className="py-3.5 px-4 font-mono font-semibold text-primary">
                        <div className="flex items-center gap-1.5">
                          {report.is_emergency && <AlertTriangle size={16} className="text-red-600 animate-pulse flex-shrink-0" />}
                          {report.ticket_number}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-neutral-900">{report.category.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-semibold text-neutral-900">{report.reporter?.full_name || 'Anonymous'}</p>
                          <p className="text-xs text-neutral-500">{report.reporter?.phone || 'No phone'}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {report.reported ? (
                          <div>
                            <p className="font-semibold text-neutral-900">{report.reported.full_name}</p>
                            <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded ${
                              report.reported.account_status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {report.reported.account_status || 'active'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-neutral-400 text-xs">General / Platform</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 text-xs font-extrabold rounded-full ${
                          report.priority === 'URGENT' ? 'bg-red-100 text-red-800 border border-red-300' :
                          report.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                          report.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
                          'bg-neutral-100 text-neutral-700'
                        }`}>
                          {report.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          report.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          report.status === 'UNDER_REVIEW' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          report.status === 'NEEDS_EVIDENCE' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          report.status === 'ACTION_TAKEN' || report.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          'bg-neutral-100 text-neutral-600'
                        }`}>
                          {report.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-neutral-500 whitespace-nowrap">
                        {new Date(report.created_at).toLocaleDateString()} {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleInspectReport(report.id)}
                          className="px-3 py-1.5 bg-primary text-white font-medium text-xs rounded-lg hover:bg-primary-dark transition-colors inline-flex items-center gap-1"
                        >
                          <Eye size={14} />
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* INSPECTION DETAIL MODAL */}
      {selectedReportId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-neutral-900 text-lg">
                    Report Ticket: {reportDetail?.ticket_number || 'Loading...'}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Category: {reportDetail?.category} | Priority: {reportDetail?.priority}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedReportId(null); setReportDetail(null); }}
                className="p-1.5 rounded-lg hover:bg-neutral-200 text-neutral-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            {loadingDetail || !reportDetail ? (
              <div className="p-12 text-center text-neutral-500">Loading complete investigation audit trail...</div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Emergency Alert Banner if Emergency */}
                {reportDetail.is_emergency && (
                  <div className="p-4 bg-red-100 border border-red-300 rounded-xl text-red-900 flex items-start gap-3">
                    <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-sm uppercase">Urgent Emergency Escalation</h4>
                      <p className="text-xs mt-1 text-red-800">
                        This report was submitted as an urgent emergency. Senior moderation guidelines advise immediate review and temporary safety account restriction if risk is imminent.
                      </p>
                    </div>
                  </div>
                )}

                {/* Grid 1: Reporter & Reported User & Risk Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Reporter Profile */}
                  <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                    <div className="flex items-center gap-2 mb-2 text-xs font-extrabold uppercase text-neutral-500">
                      <ShieldCheck size={16} className="text-emerald-600" />
                      Reporter (Confidential)
                    </div>
                    <p className="font-bold text-neutral-900">{reportDetail.reporter?.full_name || 'Anonymous'}</p>
                    <p className="text-xs text-neutral-600">ID: {reportDetail.reporter?.id}</p>
                    <p className="text-xs text-neutral-600">Phone: {reportDetail.reporter?.phone || 'N/A'}</p>
                    <p className="text-xs text-neutral-400 mt-2">Identity obscured from reported party.</p>
                  </div>

                  {/* Reported User Profile */}
                  <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                    <div className="flex items-center gap-2 mb-2 text-xs font-extrabold uppercase text-neutral-500">
                      <UserX size={16} className="text-red-600" />
                      Reported Account
                    </div>
                    {reportDetail.reported ? (
                      <div>
                        <p className="font-bold text-neutral-900">{reportDetail.reported.full_name}</p>
                        <p className="text-xs text-neutral-600">ID: {reportDetail.reported.id}</p>
                        <p className="text-xs text-neutral-600">Phone: {reportDetail.reported.phone || 'N/A'}</p>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            reportDetail.reported.account_status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            Status: {reportDetail.reported.account_status || 'active'}
                          </span>
                          {reportDetail.reported.workers?.is_verified && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-700">
                              Verified Worker
                            </span>
                          )}
                        </div>

                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          {reportDetail.reported.account_status === 'suspended' ? (
                            <button
                              onClick={handleToggleAccountSuspension}
                              disabled={isAccountActioning}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded transition-colors disabled:opacity-50"
                            >
                              {isAccountActioning ? 'Reactivating...' : 'Reactivate Account'}
                            </button>
                          ) : (
                            <button
                              onClick={() => setSuspensionModalOpen(true)}
                              disabled={isAccountActioning}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded transition-colors disabled:opacity-50"
                            >
                              Suspend Account
                            </button>
                          )}
                          {onNavigate && (
                            <button
                              onClick={() => { setSelectedReportId(null); onNavigate('accounts'); }}
                              className="px-2 py-1 text-neutral-600 hover:text-neutral-900 text-[11px] font-medium underline"
                            >
                              View in Accounts
                            </button>
                          )}
                        </div>

                        {/* Suspension Reason Prompt Inline */}
                        {suspensionModalOpen && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg space-y-2 text-xs">
                            <p className="font-bold text-red-800">Reason for Account Suspension:</p>
                            <input
                              type="text"
                              placeholder="e.g. Safety policy violation ticket #..."
                              value={suspensionReasonInput}
                              onChange={(e) => setSuspensionReasonInput(e.target.value)}
                              className="w-full p-2 border border-red-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => { setSuspensionModalOpen(false); setSuspensionReasonInput(''); }}
                                className="px-2 py-1 bg-neutral-200 text-neutral-700 rounded text-[10px] font-medium"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleToggleAccountSuspension}
                                disabled={isAccountActioning || !suspensionReasonInput.trim()}
                                className="px-2.5 py-1 bg-red-600 text-white rounded text-[10px] font-bold disabled:opacity-50"
                              >
                                {isAccountActioning ? 'Suspending...' : 'Confirm Suspension'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-500">No specific user reported (General Platform Issue)</p>
                    )}
                  </div>

                  {/* Repeat Offender Risk Profile */}
                  <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                    <div className="flex items-center gap-2 mb-2 text-xs font-extrabold uppercase text-neutral-500">
                      <History size={16} className="text-amber-600" />
                      Repeat Offender Risk Signals
                    </div>
                    {reportDetail.repeat_offender_risk ? (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-neutral-600">Risk Level:</span>
                          <span className={`font-extrabold ${
                            reportDetail.repeat_offender_risk.risk_level === 'CRITICAL' ? 'text-red-600' :
                            reportDetail.repeat_offender_risk.risk_level === 'HIGH' ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {reportDetail.repeat_offender_risk.risk_level}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-neutral-600">Reports Against (90d):</span>
                          <span className="font-bold text-neutral-900">{reportDetail.repeat_offender_risk.recent_reports_90d}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-neutral-600">Confirmed Violations:</span>
                          <span className="font-bold text-neutral-900">{reportDetail.repeat_offender_risk.confirmed_violations}</span>
                        </div>
                        {reportDetail.repeat_offender_risk.risk_flags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {reportDetail.repeat_offender_risk.risk_flags.map((flag, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 rounded">
                                {flag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-500">No prior risk data available.</p>
                    )}
                  </div>
                </div>

                {/* Description & Evidence */}
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-neutral-900">User Report Statement</h4>
                  <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-sm text-neutral-800 whitespace-pre-wrap leading-relaxed">
                    {reportDetail.description}
                  </div>

                  {reportDetail.attachments && reportDetail.attachments.length > 0 && (
                    <div>
                      <h4 className="font-bold text-sm text-neutral-900 mb-2">Attached Evidence ({reportDetail.attachments.length})</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {reportDetail.attachments.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-lg overflow-hidden border border-neutral-200 hover:opacity-95 transition-opacity relative group bg-neutral-100"
                          >
                            <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-32 object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                              <ExternalLink size={20} />
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Contextual Metadata Audit Trail Snapshot */}
                {reportDetail.context_metadata && Object.keys(reportDetail.context_metadata).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-sm text-neutral-900">Automatically Attached Contextual Metadata</h4>
                    <div className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto">
                      <pre>{JSON.stringify(reportDetail.context_metadata, null, 2)}</pre>
                    </div>
                  </div>
                )}

                {/* Moderation Actions Panel */}
                <div className="p-5 bg-amber-50/40 border border-amber-200 rounded-xl space-y-4">
                  <h4 className="font-extrabold text-sm text-neutral-900 uppercase tracking-wide">
                    Perform Moderation & Enforcement Action
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">Update Status</label>
                      <select
                        value={actionStatus}
                        onChange={(e) => setActionStatus(e.target.value as ReportStatus)}
                        className="w-full border border-neutral-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                        <option value="NEEDS_EVIDENCE">NEEDS_EVIDENCE</option>
                        <option value="ACTION_TAKEN">ACTION_TAKEN</option>
                        <option value="DISMISSED">DISMISSED</option>
                        <option value="RESOLVED">RESOLVED</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">Set Priority</label>
                      <select
                        value={actionPriority}
                        onChange={(e) => setActionPriority(e.target.value as ReportPriority)}
                        className="w-full border border-neutral-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="URGENT">URGENT</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">Account Enforcement Action</label>
                      <select
                        value={actionTaken}
                        onChange={(e) => setActionTaken(e.target.value as ModerationAction)}
                        className="w-full border border-neutral-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="NONE">NONE</option>
                        <option value="WARNING_ISSUED">WARNING_ISSUED</option>
                        <option value="TEMPORARY_SUSPENSION">TEMPORARY_SUSPENSION</option>
                        <option value="PERMANENT_BAN">PERMANENT_BAN</option>
                        <option value="EVIDENCE_REQUESTED">EVIDENCE_REQUESTED</option>
                        <option value="DISMISSED">DISMISSED</option>
                      </select>
                    </div>
                  </div>

                  {actionTaken === 'TEMPORARY_SUSPENSION' && (
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Suspension Duration (days)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={actionSuspendDays}
                        onChange={(e) => setActionSuspendDays(Math.max(1, Number(e.target.value) || 1))}
                        className="w-full sm:w-40 border border-neutral-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-primary/20"
                      />
                      <p className="text-[11px] text-neutral-500 mt-1">
                        Account auto-reactivates after this period. Defaults to 7 days.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Resolution Summary / Note for Reporter</label>
                    <input
                      type="text"
                      placeholder="e.g. Action taken following investigation. Reporter notified without disclosing identity."
                      value={resolutionReason}
                      onChange={(e) => setResolutionReason(e.target.value)}
                      className="w-full border border-neutral-300 rounded-lg p-2 text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Private Moderator Internal Notes</label>
                    <textarea
                      rows={2}
                      placeholder="Internal moderation notes (confidential to admin team only)..."
                      value={moderationNotes}
                      onChange={(e) => setModerationNotes(e.target.value)}
                      className="w-full border border-neutral-300 rounded-lg p-2 text-xs bg-white"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleApplyModeration}
                      disabled={isSubmittingAction}
                      className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                      {isSubmittingAction ? 'Applying Action...' : 'Apply & Permanently Audit Log'}
                    </button>
                  </div>
                </div>

                {/* Audit Log Timeline */}
                {reportDetail.audit_logs && reportDetail.audit_logs.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-sm text-neutral-900">Immutable Audit Trail Timeline</h4>
                    <div className="space-y-2">
                      {reportDetail.audit_logs.map((log) => (
                        <div key={log.id} className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex items-start justify-between text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-neutral-900">{log.action}</span>
                              <span className="px-1.5 py-0.5 text-[10px] bg-neutral-200 text-neutral-700 rounded font-mono">
                                Role: {log.actor_role}
                              </span>
                            </div>
                            <p className="text-neutral-600 mt-1">{log.notes}</p>
                          </div>
                          <span className="text-neutral-400 whitespace-nowrap ml-4">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
