import { useEffect, useMemo, useState } from 'react';
import {
  ShieldOff,
  UserCheck,
  Search,
  Filter,
  Briefcase,
  User,
  AlertTriangle,
  RefreshCw,
  Eye,
  Settings,
  CheckCircle,
  Clock,
  ShieldAlert,
  Bell,
  Send,
  Smartphone,
  Sparkles,
  Users,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  AlertOctagon,
  Download,
  UploadCloud,
  ExternalLink,
  Play,
  Layers,
  CloudLightning,
  Database,
  Trash2,
  HardDrive,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { adminGet, adminPatch, adminPost, adminPut, adminPostMultipart } from '../../lib/api';
import type {
  AdminAccount,
  AdminAccountDetail,
  AdminReport,
  AppReleaseResponse,
  AppReleaseLink,
  BuildStatusResponse,
  StorageStatsResponse,
  StorageCleanupResponse,
} from '../../types';

interface SettingsPageProps {
  onNavigate: (page: string, data?: unknown) => void;
  initialTab?: 'broadcast' | 'blocked' | 'general' | 'releases';
}

function workerFrom(account: any) {
  if (!account) return null;
  if (Array.isArray(account.workers)) return account.workers[0] ?? null;
  return account.workers ?? null;
}

function displayRole(account: any): 'worker' | 'client' {
  if (!account) return 'client';
  if (workerFrom(account)) return 'worker';
  const role = account.signup_type ?? account.role ?? account.last_active_mode ?? '';
  return String(role).toLowerCase().includes('worker') ? 'worker' : 'client';
}

function formatDate(isoStr: string | null | undefined) {
  if (!isoStr) return 'N/A';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (_) {
    return isoStr;
  }
}

export function SettingsPage({ onNavigate, initialTab = 'broadcast' }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<'broadcast' | 'blocked' | 'general' | 'releases'>(initialTab);
  const [blockedAccounts, setBlockedAccounts] = useState<AdminAccount[]>([]);
  const [userReports, setUserReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);

  const [roleFilter, setRoleFilter] = useState<'all' | 'worker' | 'client'>('all');
  const [itemTypeFilter, setItemTypeFilter] = useState<'all' | 'reports' | 'blocked' | 'warned'>('all');
  const [search, setSearch] = useState('');

  const [selectedAccount, setSelectedAccount] = useState<AdminAccountDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Broadcast state
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'workers' | 'clients'>('all');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastConfirmModal, setBroadcastConfirmModal] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{ count: number; target: string; title: string } | null>(null);

  // Selected report detail modal state
  const [inspectedReport, setInspectedReport] = useState<AdminReport | null>(null);

  // Warning & Blocking Modal state
  const [warnModalOpen, setWarnModalOpen] = useState(false);
  const [warnTarget, setWarnTarget] = useState<{ accountId: string; name: string; reportId?: string } | null>(null);
  const [warnReasonInput, setWarnReasonInput] = useState('');

  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockTarget, setBlockTarget] = useState<{ accountId: string; name: string; reportId?: string } | null>(null);
  const [blockReasonInput, setBlockReasonInput] = useState('');

  // App Releases & Cloud Build state
  const [releaseManifest, setReleaseManifest] = useState<AppReleaseResponse | null>(null);
  const [releaseLoading, setReleaseLoading] = useState(false);
  const [buildStatus, setBuildStatus] = useState<BuildStatusResponse | null>(null);
  const [buildModalOpen, setBuildModalOpen] = useState(false);
  const [buildVersionInput, setBuildVersionInput] = useState('1.0.0');
  const [buildNotesInput, setBuildNotesInput] = useState('CraftMatch Android Release');
  const [buildTypeInput, setBuildTypeInput] = useState<'release' | 'debug'>('release');
  const [buildBranchInput, setBuildBranchInput] = useState('feature/fcm-whatsapp-sms-fallback');
  const [isTriggeringBuild, setIsTriggeringBuild] = useState(false);
  const [isPollingBuild, setIsPollingBuild] = useState(false);
  const [githubTokenInput, setGithubTokenInput] = useState('');

  // Direct APK Upload state
  const [uploadApkFile, setUploadApkFile] = useState<File | null>(null);
  const [uploadVersionInput, setUploadVersionInput] = useState('');
  const [isUploadingApk, setIsUploadingApk] = useState(false);
  const [isSavingManifest, setIsSavingManifest] = useState(false);
  const [editableLinks, setEditableLinks] = useState<AppReleaseLink[]>([]);

  // Supabase Storage & Retention state
  const [storageStats, setStorageStats] = useState<StorageStatsResponse | null>(null);
  const [storageStatsLoading, setStorageStatsLoading] = useState(false);
  const [isCleaningStorage, setIsCleaningStorage] = useState(false);
  const [cleanupModalOpen, setCleanupModalOpen] = useState(false);
  const [pruneReleasesOption, setPruneReleasesOption] = useState(true);
  const [pruneOrphansOption, setPruneOrphansOption] = useState(true);
  const [keepVersionsCount, setKeepVersionsCount] = useState(3);

  const templates = [
    {
      name: '📢 Maintenance Notice',
      title: 'Scheduled Maintenance Notice',
      body: 'CraftMatch will undergo brief scheduled maintenance tonight at 11:00 PM (30 mins). Thank you for your patience.',
      target: 'all' as const,
    },
    {
      name: '🛠️ New Services Launch',
      title: 'New Repair Service Available!',
      body: "We've expanded repair categories in Kumasi! Open CraftMatch now to explore verified plumbers, electricians, and carpenters.",
      target: 'clients' as const,
    },
    {
      name: '⚠️ Safety Badge Reminder',
      title: 'Safety & Verification Policy',
      body: 'Always check the verified artisan badge and Ghana Card identity in your app before admitting a technician to your residence.',
      target: 'clients' as const,
    },
    {
      name: '⚡ High Demand Alert',
      title: 'High Repair Demand in Kumasi!',
      body: 'Plumbing & Electrical job requests are surging near KNUST & Kotei. Set your availability status to ON to receive instant dispatch leads!',
      target: 'workers' as const,
    },
  ];

  const handleSendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) {
      setError('Title and message body are required.');
      return;
    }
    setIsBroadcasting(true);
    setError(null);
    try {
      const res = await adminPost<{ count: number; target: string; title: string }>('/admin/broadcast-notification', {
        target: broadcastTarget,
        title: broadcastTitle.trim(),
        body: broadcastBody.trim(),
      });
      setBroadcastResult(res);
      setBroadcastConfirmModal(false);
      showToast(`Broadcast sent successfully to ${res.count} ${res.target} device(s)!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send broadcast notification.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const loadBlockedAndReportedData = () => {
    setLoading(true);
    setError(null);
    adminGet<{ blockedAccounts: AdminAccount[]; reports: AdminReport[] }>('/admin/blocked-and-reported')
      .then((data) => {
        setBlockedAccounts(data.blockedAccounts || []);
        setUserReports(data.reports || []);
      })
      .catch(() => {
        // Fallback parallel requests if combined endpoint is unavailable
        Promise.all([
          adminGet<AdminAccount[]>('/admin/accounts?status=suspended'),
          adminGet<AdminReport[]>('/admin/reports'),
        ])
          .then(([accounts, reports]) => {
            setBlockedAccounts(accounts || []);
            setUserReports(reports || []);
          })
          .catch((err) => {
            setError(err instanceof Error ? err.message : 'Could not load blocked & reported moderation data.');
          });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'blocked') {
      loadBlockedAndReportedData();
    } else if (activeTab === 'releases') {
      loadReleaseManifest();
      loadStorageStats();
    }
  }, [activeTab]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleUnblock = async (account: AdminAccount) => {
    if (!window.confirm(`Are you sure you want to unblock/reactivate ${account.full_name || 'this user'}?`)) {
      return;
    }
    setActionLoadingId(account.id);
    try {
      await adminPatch(`/admin/accounts/${account.id}/reactivate`, {});
      showToast(`Account for ${account.full_name || 'User'} has been unblocked and reactivated.`);
      if (selectedAccount?.profile.id === account.id) {
        setSelectedAccount(null);
      }
      loadBlockedAndReportedData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unblock account.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleExecuteWarn = async () => {
    if (!warnTarget) return;
    if (!warnReasonInput.trim()) {
      setError('Please enter a warning reason.');
      return;
    }
    setActionLoadingId(warnTarget.accountId);
    setError(null);
    try {
      await adminPatch(`/admin/accounts/${warnTarget.accountId}/warn`, {
        reason: warnReasonInput.trim(),
        report_id: warnTarget.reportId,
      });
      showToast(`Official warning issued to ${warnTarget.name}. User notified via in-app alert.`);
      setWarnModalOpen(false);
      setWarnTarget(null);
      setWarnReasonInput('');
      setInspectedReport(null);
      loadBlockedAndReportedData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to issue warning.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleExecuteBlock = async () => {
    if (!blockTarget) return;
    if (!blockReasonInput.trim()) {
      setError('Please enter a suspension reason.');
      return;
    }
    setActionLoadingId(blockTarget.accountId);
    setError(null);
    try {
      await adminPatch(`/admin/accounts/${blockTarget.accountId}/suspend`, {
        reason: blockReasonInput.trim(),
        report_id: blockTarget.reportId,
      });
      showToast(`Account for ${blockTarget.name} has been suspended/blocked.`);
      setBlockModalOpen(false);
      setBlockTarget(null);
      setBlockReasonInput('');
      setInspectedReport(null);
      loadBlockedAndReportedData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to block account.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDismissReport = async (reportId: string) => {
    if (!window.confirm('Are you sure you want to dismiss this report with no action required?')) return;
    setActionLoadingId(reportId);
    setError(null);
    try {
      await adminPatch(`/admin/reports/${reportId}`, {
        status: 'RESOLVED',
        action_taken: 'DISMISSED',
        resolution_reason: 'Dismissed by admin after review in Moderation Portal.',
      });
      showToast('Report marked as resolved/dismissed.');
      setInspectedReport(null);
      loadBlockedAndReportedData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss report.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openAccountDetail = (accountId: string) => {
    setDetailLoading(true);
    adminGet<AdminAccountDetail>(`/admin/accounts/${accountId}`)
      .then((data) => {
        setSelectedAccount(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not load account details.');
      })
      .finally(() => setDetailLoading(false));
  };

  // Filtered lists
  const pendingReportsList = useMemo(() => {
    return userReports.filter((r) => r.status === 'PENDING' || r.status === 'UNDER_REVIEW');
  }, [userReports]);

  const filteredBlockedAccounts = useMemo(() => {
    return blockedAccounts.filter((account) => {
      const role = displayRole(account);
      if (roleFilter !== 'all' && role !== roleFilter) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const name = (account.full_name || '').toLowerCase();
        const phone = (account.phone || '').toLowerCase();
        const reason = (account.suspension_reason || '').toLowerCase();
        const id = account.id.toLowerCase();
        return name.includes(q) || phone.includes(q) || reason.includes(q) || id.includes(q);
      }
      return true;
    });
  }, [blockedAccounts, roleFilter, search]);

  const filteredReportsList = useMemo(() => {
    return userReports.filter((report) => {
      const reportedUser = report.reported;
      const role = reportedUser ? displayRole(reportedUser) : 'client';
      if (roleFilter !== 'all' && role !== roleFilter) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const ticket = (report.ticket_number || '').toLowerCase();
        const category = (report.category || '').toLowerCase();
        const desc = (report.description || '').toLowerCase();
        const reportedName = (reportedUser?.full_name || '').toLowerCase();
        const reporterName = (report.reporter?.full_name || '').toLowerCase();
        return (
          ticket.includes(q) ||
          category.includes(q) ||
          desc.includes(q) ||
          reportedName.includes(q) ||
          reporterName.includes(q)
        );
      }
      return true;
    });
  }, [userReports, roleFilter, search]);

  const totalBlocked = blockedAccounts.filter((a) => a.account_status === 'suspended').length;
  const totalWarned = blockedAccounts.filter((a) => a.account_status === 'warned').length;
  const pendingReportsCount = pendingReportsList.length;

  const loadReleaseManifest = async () => {
    setReleaseLoading(true);
    try {
      const data = await adminGet<AppReleaseResponse>('/releases/app');
      setReleaseManifest(data);
      setEditableLinks(data.links || []);
      setBuildVersionInput(data.latestVersion || '1.0.0');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load release manifest.');
    } finally {
      setReleaseLoading(false);
    }
  };

  const checkBuildStatus = async () => {
    try {
      const status = await adminGet<BuildStatusResponse>('/releases/build-status');
      setBuildStatus(status);
      return status;
    } catch {
      return null;
    }
  };

  const handleTriggerCloudBuild = async () => {
    setIsTriggeringBuild(true);
    setError(null);
    try {
      const res = await adminPost<{ success: boolean; message: string; version: string; workflowUrl: string }>('/releases/trigger-build', {
        version: buildVersionInput.trim() || '1.0.0',
        releaseNotes: buildNotesInput.trim(),
        releaseType: buildTypeInput,
        branch: buildBranchInput.trim() || 'main',
        githubToken: githubTokenInput.trim() || undefined,
      });
      if (res.success) {
        showToast(res.message || 'Build dispatched to GitHub Actions runner!');
        setBuildModalOpen(false);
        await checkBuildStatus();
        setIsPollingBuild(true);
      } else {
        setError(res.message || 'GitHub token required on server or input field.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dispatch cloud build.');
    } finally {
      setIsTriggeringBuild(false);
    }
  };

  const handleUploadApk = async () => {
    if (!uploadApkFile) {
      setError('Please select an APK file to upload.');
      return;
    }
    setIsUploadingApk(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', uploadApkFile);
      if (uploadVersionInput.trim()) {
        formData.append('version', uploadVersionInput.trim());
      }
      await adminPostMultipart('/releases/upload', formData);
      showToast(`APK ${uploadApkFile.name} uploaded and published to Supabase Cloud Storage!`);
      setUploadApkFile(null);
      setUploadVersionInput('');
      loadReleaseManifest();
      loadStorageStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload APK.');
    } finally {
      setIsUploadingApk(false);
    }
  };

  const loadStorageStats = async () => {
    setStorageStatsLoading(true);
    try {
      const data = await adminGet<StorageStatsResponse>('/releases/storage/stats');
      setStorageStats(data);
    } catch (err) {
      console.warn('Could not load storage stats:', err);
    } finally {
      setStorageStatsLoading(false);
    }
  };

  const handleStorageCleanup = async () => {
    setIsCleaningStorage(true);
    setError(null);
    try {
      const res = await adminPost<StorageCleanupResponse>('/releases/storage/cleanup', {
        pruneReleases: pruneReleasesOption,
        pruneOrphans: pruneOrphansOption,
        keepVersionsCount,
      });
      setStorageStats(res.currentStats);
      setCleanupModalOpen(false);
      const relCount = res.cleanupDetails?.releases?.prunedCount ?? 0;
      const orphCount = res.cleanupDetails?.orphans?.orphanedCount ?? 0;
      showToast(`Storage retention cleanup complete! Pruned ${relCount} old APK(s) and ${orphCount} orphaned doc(s).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Storage cleanup failed.');
    } finally {
      setIsCleaningStorage(false);
    }
  };

  const handleSavePlatformManifest = async () => {
    if (!editableLinks || editableLinks.length === 0) {
      setError('Cannot save empty release links manifest.');
      return;
    }
    setIsSavingManifest(true);
    setError(null);
    try {
      await adminPut('/releases/manifest', {
        latestVersion: releaseManifest?.latestVersion || '1.0.0',
        links: editableLinks,
      });
      showToast('Platform release configurations saved successfully.');
      loadReleaseManifest();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save release configurations.');
    } finally {
      setIsSavingManifest(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'releases') {
      loadReleaseManifest();
      checkBuildStatus();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!isPollingBuild || activeTab !== 'releases') return;
    const interval = setInterval(async () => {
      const status = await checkBuildStatus();
      if (
        status?.status === 'completed' ||
        status?.conclusion === 'success' ||
        status?.conclusion === 'failure' ||
        status?.conclusion === 'cancelled' ||
        status?.conclusion === 'timed_out'
      ) {
        setIsPollingBuild(false);
        loadReleaseManifest();
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [isPollingBuild, activeTab]);

  return (
    <AdminLayout currentPage="settings" onNavigate={onNavigate}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Toast alert */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle size={18} />
              <span className="font-medium text-sm">{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white text-sm font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Header & Tabs */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <Settings size={22} className="text-primary" />
                Admin Settings & Moderation Control
              </h2>
              <p className="text-sm text-text-muted mt-1">
                Manage system notifications, user reports for unfair treatment, and admin blocked/warned accounts.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-neutral-100 pt-2 gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('broadcast')}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'broadcast'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              <Bell size={18} />
              System Push Broadcaster
            </button>
            <button
              onClick={() => setActiveTab('blocked')}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'blocked'
                  ? 'border-error text-error'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              <ShieldOff size={18} />
              Blocked & Reported Accounts
              <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-error-light text-error font-bold">
                {totalBlocked + pendingReportsCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'general'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              <Settings size={18} />
              Platform Controls
            </button>
            <button
              onClick={() => setActiveTab('releases')}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'releases'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              <Download size={18} />
              App Releases & Cloud Build
              {isPollingBuild && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </button>
          </div>
        </div>

        {/* ERROR DISPLAY */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
            <AlertTriangle size={20} className="flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* TAB CONTENT: BROADCAST PUSH NOTIFICATIONS */}
        {activeTab === 'broadcast' && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-12 gap-6">
              {/* Left Column: Form & Presets (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm space-y-5">
                  <div>
                    <h3 className="font-bold text-text-primary text-base flex items-center gap-2">
                      <Send size={18} className="text-primary" />
                      Compose Push Broadcast
                    </h3>
                    <p className="text-xs text-text-muted mt-1">
                      Dispatch push notifications and in-app system alerts directly to mobile app users.
                    </p>
                  </div>

                  {/* Target Audience Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Target Audience
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setBroadcastTarget('all')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          broadcastTarget === 'all'
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20 text-primary font-bold'
                            : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Users size={16} />
                          <span className="text-xs">All Users</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 font-normal">Clients & Artisans</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBroadcastTarget('workers')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          broadcastTarget === 'workers'
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20 text-primary font-bold'
                            : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Briefcase size={16} />
                          <span className="text-xs">Artisans</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 font-normal">Registered Workers</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBroadcastTarget('clients')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          broadcastTarget === 'clients'
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20 text-primary font-bold'
                            : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <User size={16} />
                          <span className="text-xs">Clients</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 font-normal">Customers only</p>
                      </button>
                    </div>
                  </div>

                  {/* 1-Click Message Templates */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={14} className="text-amber-500" />
                        Quick Market Templates
                      </label>
                      <span className="text-[10px] text-neutral-400">Click to autofill</span>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {templates.map((tmpl) => (
                        <button
                          key={tmpl.name}
                          type="button"
                          onClick={() => {
                            setBroadcastTitle(tmpl.title);
                            setBroadcastBody(tmpl.body);
                            setBroadcastTarget(tmpl.target);
                          }}
                          className="px-3 py-1.5 bg-neutral-100 hover:bg-amber-50 hover:border-amber-200 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 whitespace-nowrap transition-colors"
                        >
                          {tmpl.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title & Body Inputs */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-neutral-700">Notification Title</label>
                        <span className="text-[10px] text-neutral-400">{broadcastTitle.length}/65 chars</span>
                      </div>
                      <input
                        type="text"
                        maxLength={65}
                        placeholder="e.g. Scheduled System Maintenance Notice"
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                        className="w-full p-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-neutral-700">Message Body</label>
                        <span className="text-[10px] text-neutral-400">{broadcastBody.length}/240 chars</span>
                      </div>
                      <textarea
                        rows={4}
                        maxLength={240}
                        placeholder="Type clear notification content for mobile users..."
                        value={broadcastBody}
                        onChange={(e) => setBroadcastBody(e.target.value)}
                        className="w-full p-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                    <button
                      type="button"
                      onClick={() => {
                        setBroadcastTitle('');
                        setBroadcastBody('');
                        setBroadcastResult(null);
                      }}
                      className="px-4 py-2 text-xs text-neutral-500 hover:text-neutral-700 font-medium"
                    >
                      Clear Draft
                    </button>

                    <button
                      type="button"
                      disabled={!broadcastTitle.trim() || !broadcastBody.trim() || isBroadcasting}
                      onClick={() => setBroadcastConfirmModal(true)}
                      className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      <Send size={15} />
                      Send Broadcast Push
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Lock-Screen Device Preview (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-neutral-900 p-6 rounded-2xl text-white shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                      <Smartphone size={16} />
                      Live Lock-Screen Mobile Preview
                    </h4>
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-neutral-300">
                      iOS / Android
                    </span>
                  </div>

                  {/* Mock Device Frame */}
                  <div className="p-4 bg-gradient-to-b from-neutral-800 to-neutral-900 rounded-2xl border border-neutral-700 space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                      <span>CraftMatch Mobile</span>
                      <span>Just now</span>
                    </div>

                    {/* Notification Banner Popup */}
                    <div className="p-4 bg-white/10 backdrop-blur-lg rounded-xl border border-white/15 space-y-2 shadow-2xl">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center text-neutral-900 font-black text-xs">
                          CM
                        </div>
                        <span className="text-xs font-bold text-amber-400">CraftMatch Ghana</span>
                        <span className="text-[10px] text-neutral-400 ml-auto uppercase tracking-wider font-semibold">
                          {broadcastTarget === 'all' ? 'All Users' : broadcastTarget === 'workers' ? 'Artisans' : 'Clients'}
                        </span>
                      </div>

                      <p className="text-sm font-bold text-white line-clamp-1">
                        {broadcastTitle.trim() || 'Notification Title Placeholder'}
                      </p>

                      <p className="text-xs text-neutral-300 leading-relaxed line-clamp-3">
                        {broadcastBody.trim() || 'Your message body content will render here in real-time as you type...'}
                      </p>
                    </div>

                    <div className="pt-2 flex justify-center">
                      <div className="w-24 h-1 bg-neutral-600 rounded-full" />
                    </div>
                  </div>

                  {/* Broadcast Result Summary */}
                  {broadcastResult && (
                    <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl space-y-1 text-xs">
                      <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle size={15} />
                        Broadcast Dispatched!
                      </p>
                      <p className="text-neutral-300">
                        Delivered to <strong className="text-white">{broadcastResult.count}</strong> user profiles ({broadcastResult.target}).
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Confirmation Modal */}
            {broadcastConfirmModal && (
              <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-neutral-100">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Send size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900">Confirm Push Broadcast</h3>
                    <p className="text-xs text-neutral-600 mt-1">
                      Are you sure you want to broadcast this message to <strong className="text-neutral-900 uppercase">{broadcastTarget}</strong> app users?
                    </p>
                  </div>

                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-1">
                    <p className="font-bold text-neutral-900">{broadcastTitle}</p>
                    <p className="text-neutral-600">{broadcastBody}</p>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setBroadcastConfirmModal(false)}
                      className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={isBroadcasting}
                      onClick={handleSendBroadcast}
                      className="px-5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
                    >
                      {isBroadcasting ? 'Broadcasting...' : 'Yes, Send Now'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: BLOCKED & REPORTED ACCOUNTS */}
        {activeTab === 'blocked' && (
          <div className="space-y-6">
            {/* Stats Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0">
                  <ShieldOff size={22} />
                </div>
                <div>
                  <p className="text-[11px] text-text-muted font-medium">Total Admin Blocked</p>
                  <p className="text-xl font-bold text-text-primary">{totalBlocked}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <p className="text-[11px] text-text-muted font-medium">Pending User Reports</p>
                  <p className="text-xl font-bold text-amber-900">{pendingReportsCount}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center flex-shrink-0">
                  <AlertOctagon size={22} />
                </div>
                <div>
                  <p className="text-[11px] text-text-muted font-medium">Warned Accounts</p>
                  <p className="text-xl font-bold text-orange-900">{totalWarned}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={22} />
                </div>
                <div>
                  <p className="text-[11px] text-text-muted font-medium">Total Reports Filed</p>
                  <p className="text-xl font-bold text-blue-900">{userReports.length}</p>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
              {/* Category & Item Type filter buttons */}
              <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
                <Filter size={16} className="text-text-muted hidden sm:block" />
                <button
                  onClick={() => setItemTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    itemTypeFilter === 'all'
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-text-secondary hover:bg-neutral-200'
                  }`}
                >
                  All Items ({blockedAccounts.length + userReports.length})
                </button>
                <button
                  onClick={() => setItemTypeFilter('reports')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    itemTypeFilter === 'reports'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  Pending Reports ({pendingReportsCount})
                </button>
                <button
                  onClick={() => setItemTypeFilter('blocked')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    itemTypeFilter === 'blocked'
                      ? 'bg-red-700 text-white'
                      : 'bg-red-50 text-red-900 hover:bg-red-100 border border-red-200'
                  }`}
                >
                  Blocked Accounts ({totalBlocked})
                </button>
                <button
                  onClick={() => setItemTypeFilter('warned')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    itemTypeFilter === 'warned'
                      ? 'bg-orange-600 text-white'
                      : 'bg-orange-50 text-orange-900 hover:bg-orange-100 border border-orange-200'
                  }`}
                >
                  Warned Accounts ({totalWarned})
                </button>

                <div className="h-4 w-px bg-neutral-200 mx-1 hidden sm:block" />

                {/* Role filter */}
                <button
                  onClick={() => setRoleFilter(roleFilter === 'worker' ? 'all' : 'worker')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    roleFilter === 'worker' ? 'bg-amber-800 text-white font-bold' : 'text-neutral-500 hover:bg-neutral-100'
                  }`}
                >
                  Artisans Only
                </button>
                <button
                  onClick={() => setRoleFilter(roleFilter === 'client' ? 'all' : 'client')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    roleFilter === 'client' ? 'bg-blue-800 text-white font-bold' : 'text-neutral-500 hover:bg-neutral-100'
                  }`}
                >
                  Clients Only
                </button>
              </div>

              {/* Search Box & Refresh */}
              <div className="flex items-center gap-2 w-full lg:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search name, category, ticket, reason..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <button
                  onClick={loadBlockedAndReportedData}
                  className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-text-secondary"
                  title="Refresh blocked list and reports"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Moderation Items Table / List */}
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden space-y-4 p-4">
              {loading ? (
                <div className="p-12 text-center text-text-muted">
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Loading blocked accounts & user unfair treatment reports...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* SECTION 1: USER-TO-USER UNFAIR TREATMENT REPORTS */}
                  {(itemTypeFilter === 'all' || itemTypeFilter === 'reports') && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                        <h3 className="font-bold text-sm text-neutral-800 flex items-center gap-2">
                          <MessageSquare size={16} className="text-amber-600" />
                          Client & Worker Unfair Treatment Reports ({filteredReportsList.length})
                        </h3>
                        <span className="text-[11px] text-neutral-400">Reports filed by app users for moderation</span>
                      </div>

                      {filteredReportsList.length === 0 ? (
                        <div className="p-6 text-center text-xs text-neutral-400 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                          No active user-to-user unfair treatment reports match your search or filter.
                        </div>
                      ) : (
                        <div className="divide-y divide-neutral-100">
                          {filteredReportsList.map((report) => {
                            const isPending = report.status === 'PENDING' || report.status === 'UNDER_REVIEW';
                            const reportedUser = report.reported;
                            const reporterUser = report.reporter;
                            const reportedRole = reportedUser ? displayRole(reportedUser) : 'client';
                            const reporterRole = reporterUser ? displayRole(reporterUser) : 'client';

                            return (
                              <div
                                key={report.id}
                                className="py-4 px-2 hover:bg-neutral-50/60 rounded-xl transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                              >
                                {/* Left Side: Report info */}
                                <div className="space-y-2 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-[11px] font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded">
                                      {report.ticket_number || 'REP-TICKET'}
                                    </span>
                                    {report.is_emergency && (
                                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-700 flex items-center gap-1 animate-pulse">
                                        <AlertTriangle size={10} /> Emergency
                                      </span>
                                    )}
                                    <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                                      {report.category?.replace(/_/g, ' ') || 'Unfair Treatment'}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                        isPending
                                          ? 'bg-amber-50 text-amber-800 border border-amber-300'
                                          : 'bg-emerald-50 text-emerald-800'
                                      }`}
                                    >
                                      {report.status}
                                    </span>
                                    <span className="text-[11px] text-neutral-400 ml-auto lg:ml-0 flex items-center gap-1">
                                      <Clock size={11} /> {formatDate(report.created_at)}
                                    </span>
                                  </div>

                                  {/* Parties Involved */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                                    <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-100">
                                      <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
                                        Reporter ({reporterRole}):
                                      </p>
                                      <p className="font-bold text-neutral-900 mt-0.5">
                                        {reporterUser?.full_name || 'Anonymous User'}
                                      </p>
                                      <p className="text-[11px] text-neutral-500">Phone: {reporterUser?.phone || 'N/A'}</p>
                                    </div>

                                    <div className="bg-red-50/50 p-2.5 rounded-lg border border-red-100">
                                      <div className="flex items-center justify-between">
                                        <p className="text-[10px] text-red-800 uppercase font-bold tracking-wider">
                                          Reported Target ({reportedRole}):
                                        </p>
                                        {reportedUser?.account_status && (
                                          <span
                                            className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
                                              reportedUser.account_status === 'suspended'
                                                ? 'bg-red-700 text-white'
                                                : reportedUser.account_status === 'warned'
                                                ? 'bg-orange-600 text-white'
                                                : 'bg-emerald-600 text-white'
                                            }`}
                                          >
                                            {reportedUser.account_status}
                                          </span>
                                        )}
                                      </div>
                                      <p className="font-bold text-neutral-900 mt-0.5">
                                        {reportedUser?.full_name || 'Reported Party'}
                                      </p>
                                      <p className="text-[11px] text-neutral-500">Phone: {reportedUser?.phone || 'N/A'}</p>
                                    </div>
                                  </div>

                                  {/* Report Description */}
                                  <p className="text-xs text-neutral-700 line-clamp-2 bg-white p-2 border border-neutral-100 rounded-lg">
                                    "{report.description}"
                                  </p>
                                </div>

                                {/* Right Side: Admin Actions for Reported Client/Worker */}
                                <div className="flex flex-col sm:flex-row lg:flex-col gap-2 flex-shrink-0 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-neutral-100">
                                  <button
                                    onClick={() => setInspectedReport(report)}
                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 hover:bg-neutral-100 text-text-secondary flex items-center justify-center gap-1.5 transition-colors"
                                  >
                                    <Eye size={14} />
                                    Inspect Report
                                  </button>

                                  {reportedUser && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setWarnTarget({
                                            accountId: reportedUser.id,
                                            name: reportedUser.full_name || 'Reported User',
                                            reportId: report.id,
                                          });
                                          setWarnReasonInput(`Official Warning regarding report ${report.ticket_number}: Unfair treatment / ${report.category}`);
                                          setWarnModalOpen(true);
                                        }}
                                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                                      >
                                        <AlertOctagon size={14} /> Warn Account
                                      </button>

                                      <button
                                        onClick={() => {
                                          setBlockTarget({
                                            accountId: reportedUser.id,
                                            name: reportedUser.full_name || 'Reported User',
                                            reportId: report.id,
                                          });
                                          setBlockReasonInput(`Account Blocked due to safety/unfair treatment report ${report.ticket_number}`);
                                          setBlockModalOpen(true);
                                        }}
                                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-700 hover:bg-red-800 text-white flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                                      >
                                        <ShieldOff size={14} /> Block Account
                                      </button>
                                    </>
                                  )}

                                  {isPending && (
                                    <button
                                      onClick={() => handleDismissReport(report.id)}
                                      className="px-3 py-1 text-[11px] font-semibold rounded-lg text-neutral-500 hover:bg-neutral-100 flex items-center justify-center gap-1"
                                    >
                                      Dismiss Report
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SECTION 2: ADMIN BLOCKED & WARNED ACCOUNTS */}
                  {(itemTypeFilter === 'all' || itemTypeFilter === 'blocked' || itemTypeFilter === 'warned') && (
                    <div className="space-y-3 pt-4">
                      <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                        <h3 className="font-bold text-sm text-neutral-800 flex items-center gap-2">
                          <ShieldOff size={16} className="text-red-600" />
                          Admin Blocked & Warned Accounts ({filteredBlockedAccounts.length})
                        </h3>
                        <span className="text-[11px] text-neutral-400">Users suspended or warned by admin policy decision</span>
                      </div>

                      {filteredBlockedAccounts.length === 0 ? (
                        <div className="p-6 text-center text-xs text-neutral-400 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                          No admin-blocked or warned accounts match your criteria.
                        </div>
                      ) : (
                        <div className="divide-y divide-neutral-100">
                          {filteredBlockedAccounts.map((account) => {
                            const role = displayRole(account);
                            const isWorker = role === 'worker';
                            const isSuspended = account.account_status === 'suspended';
                            const isWarned = account.account_status === 'warned';
                            const isProcessing = actionLoadingId === account.id;

                            if (itemTypeFilter === 'blocked' && !isSuspended) return null;
                            if (itemTypeFilter === 'warned' && !isWarned) return null;

                            return (
                              <div
                                key={account.id}
                                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-50/50 transition-colors"
                              >
                                {/* User Identity & Info */}
                                <div className="flex items-start gap-3 flex-1">
                                  <div className="relative">
                                    {account.avatar_url ? (
                                      <img
                                        src={account.avatar_url}
                                        alt={account.full_name || 'User'}
                                        className="w-12 h-12 rounded-full object-cover border border-neutral-200"
                                      />
                                    ) : (
                                      <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base border ${
                                          isSuspended
                                            ? 'bg-red-100 text-red-700 border-red-200'
                                            : 'bg-orange-100 text-orange-800 border-orange-200'
                                        }`}
                                      >
                                        {(account.full_name || 'U').charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <div
                                      className={`absolute -bottom-1 -right-1 text-white p-0.5 rounded-full border-2 border-white ${
                                        isSuspended ? 'bg-red-700' : 'bg-orange-600'
                                      }`}
                                      title={isSuspended ? 'Account Blocked' : 'Official Warning Issued'}
                                    >
                                      {isSuspended ? <ShieldOff size={10} /> : <AlertOctagon size={10} />}
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-bold text-text-primary text-sm">
                                        {account.full_name || 'Unnamed Account'}
                                      </h4>
                                      {isWorker ? (
                                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                                          <Briefcase size={10} /> Worker
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
                                          <User size={10} /> Client
                                        </span>
                                      )}

                                      {isSuspended && (
                                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-800">
                                          Blocked / Suspended
                                        </span>
                                      )}
                                      {isWarned && (
                                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-orange-100 text-orange-800">
                                          Official Warning Active
                                        </span>
                                      )}
                                    </div>

                                    <p className="text-xs text-text-muted flex items-center gap-2">
                                      <span>Phone: {account.phone || 'N/A'}</span>
                                      <span>•</span>
                                      <span className="flex items-center gap-1">
                                        <Clock size={12} /> Updated: {formatDate(account.updated_at || account.suspended_at)}
                                      </span>
                                    </p>

                                    {/* Reason Box */}
                                    <div
                                      className={`mt-2 rounded-lg p-2.5 max-w-2xl border ${
                                        isSuspended ? 'bg-red-50/70 border-red-100' : 'bg-orange-50/70 border-orange-100'
                                      }`}
                                    >
                                      <p
                                        className={`text-[11px] font-semibold flex items-center gap-1 ${
                                          isSuspended ? 'text-red-900' : 'text-orange-900'
                                        }`}
                                      >
                                        <ShieldAlert size={12} className="flex-shrink-0" />
                                        {isSuspended ? 'Admin Suspension Reason:' : 'Official Warning Record:'}
                                      </p>
                                      <p className={`text-xs mt-0.5 ${isSuspended ? 'text-red-800' : 'text-orange-800'}`}>
                                        {account.suspension_reason || 'No specific reason details recorded.'}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-neutral-100">
                                  <button
                                    onClick={() => openAccountDetail(account.id)}
                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 hover:bg-neutral-100 text-text-secondary flex items-center gap-1.5 transition-colors"
                                  >
                                    <Eye size={14} />
                                    View Detail
                                  </button>

                                  <button
                                    onClick={() => {
                                      setWarnTarget({
                                        accountId: account.id,
                                        name: account.full_name || 'User',
                                      });
                                      setWarnReasonInput(account.suspension_reason || 'Official conduct warning');
                                      setWarnModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-100 text-orange-900 hover:bg-orange-200 flex items-center gap-1 transition-colors"
                                  >
                                    <AlertOctagon size={13} /> Update Warning
                                  </button>

                                  <button
                                    onClick={() => handleUnblock(account)}
                                    disabled={isProcessing}
                                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                                  >
                                    {isProcessing ? (
                                      <>
                                        <RefreshCw size={14} className="animate-spin" /> Updating...
                                      </>
                                    ) : (
                                      <>
                                        <UserCheck size={14} /> Clear / Reactivate
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB CONTENT: PLATFORM CONTROLS */}
        {activeTab === 'general' && (
          <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-text-primary border-b border-neutral-100 pb-3 flex items-center justify-between">
              <span>Current Platform Policies</span>
              <span className="text-xs font-normal text-text-muted bg-neutral-100 px-2 py-0.5 rounded">Read-Only</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 space-y-2">
                <h4 className="font-bold text-sm text-text-primary">Platform Service Fee Rate</h4>
                <p className="text-xs text-text-muted">
                  Current platform commission rate applied to completed bookings.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-2xl font-extrabold text-primary">10.0%</span>
                  <span className="text-xs text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 space-y-2">
                <h4 className="font-bold text-sm text-text-primary">Trust & Safety Enforcement</h4>
                <p className="text-xs text-text-muted">
                  System policy automatically restricts accounts with active emergency reports or admin suspensions.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-bold text-error bg-error-light px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <ShieldAlert size={14} /> Strict Enforcement Enabled
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: APP RELEASES & CLOUD BUILD */}
        {activeTab === 'releases' && (
          <div className="space-y-6">
            {/* Top Row: Cloud Build Dispatcher & Status Monitor */}
            <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 rounded-3xl p-6 md:p-8 text-white shadow-xl space-y-6 border border-neutral-700">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <CloudLightning size={14} />
                    GitHub Actions Cloud CI/CD Engine
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold">1-Click Android Release Builder</h3>
                  <p className="text-xs text-neutral-300 mt-1 max-w-xl">
                    Dispatch an automated cloud runner on GitHub Actions to compile the Flutter Android APK, compute SHA-256 checksums, and publish release assets to high-speed global CDNs.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setBuildVersionInput(releaseManifest?.latestVersion || '1.0.0');
                      setBuildModalOpen(true);
                    }}
                    className="px-5 py-3 rounded-2xl bg-primary hover:bg-primary-dark text-white text-xs font-bold flex items-center gap-2 shadow-primary-glow transition-all transform hover:scale-[1.02]"
                  >
                    <Play size={16} />
                    Build & Deploy New Release
                  </button>
                  <button
                    type="button"
                    onClick={() => checkBuildStatus()}
                    className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Refresh Build Status"
                  >
                    <RefreshCw size={16} className={isPollingBuild ? 'animate-spin text-amber-400' : ''} />
                  </button>
                </div>
              </div>

              {/* Real-Time Build Status Banner */}
              {buildStatus && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base ${
                        buildStatus.status === 'in_progress' || buildStatus.status === 'queued'
                          ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                          : buildStatus.conclusion === 'success'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : buildStatus.conclusion === 'failure'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-white/10 text-neutral-300'
                      }`}
                    >
                      {buildStatus.status === 'in_progress' || buildStatus.status === 'queued' ? (
                        <RefreshCw size={20} className="animate-spin" />
                      ) : buildStatus.conclusion === 'success' ? (
                        <CheckCircle size={20} />
                      ) : buildStatus.conclusion === 'failure' ? (
                        <AlertCircle size={20} />
                      ) : (
                        <Smartphone size={20} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{buildStatus.runName || 'Cloud Build Runner'}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            buildStatus.status === 'in_progress'
                              ? 'bg-amber-500/30 text-amber-300'
                              : buildStatus.conclusion === 'success'
                              ? 'bg-emerald-500/30 text-emerald-300'
                              : buildStatus.conclusion === 'failure'
                              ? 'bg-red-500/30 text-red-300'
                              : 'bg-neutral-700 text-neutral-300'
                          }`}
                        >
                          {buildStatus.status === 'in_progress'
                            ? 'Building APK (Gradle)'
                            : buildStatus.conclusion || buildStatus.status}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">{buildStatus.message}</p>
                    </div>
                  </div>

                  {buildStatus.runUrl && (
                    <a
                      href={buildStatus.runUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 self-start md:self-auto transition-colors"
                    >
                      <span>View GitHub Logs</span>
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Middle Grid: Active Release Health & Direct Drag-and-Drop Uploader */}
            <div className="grid lg:grid-cols-12 gap-6">
              {/* Active Release Card (6 cols) */}
              <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <h4 className="font-bold text-text-primary text-base flex items-center gap-2">
                    <ShieldCheck size={18} className="text-emerald-600" />
                    Active Distribution Status
                  </h4>
                  <button
                    onClick={loadReleaseManifest}
                    className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-text-secondary"
                    title="Reload manifest"
                  >
                    <RefreshCw size={14} className={releaseLoading ? 'animate-spin text-primary' : ''} />
                  </button>
                </div>

                {releaseManifest ? (
                  <div className="space-y-3 text-xs">
                    <div className="p-4 rounded-2xl bg-surface-base border border-neutral-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted font-medium">Published Version</span>
                        <span className="text-sm font-black text-primary px-2 py-0.5 bg-primary/10 rounded-lg">
                          v{releaseManifest.latestVersion}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted font-medium">Last Published Date</span>
                        <span className="text-text-primary font-semibold">
                          {formatDate(releaseManifest.updatedAt)}
                        </span>
                      </div>
                      {releaseManifest.links.find((l) => l.platform === 'android')?.fileSize && (
                        <div className="flex items-center justify-between">
                          <span className="text-text-muted font-medium">Android APK Size</span>
                          <span className="text-text-primary font-bold">
                            {releaseManifest.links.find((l) => l.platform === 'android')?.fileSize}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Android Link Direct Action */}
                    <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
                      <p className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                        Live Android Download Endpoint
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={releaseManifest.links.find((l) => l.platform === 'android')?.href || ''}
                          className="flex-1 bg-white border border-neutral-200 px-3 py-1.5 rounded-lg text-xs font-mono text-neutral-700"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const link = releaseManifest.links.find((l) => l.platform === 'android')?.href || '';
                            navigator.clipboard.writeText(link);
                            showToast('Download URL copied to clipboard!');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-text-muted text-xs">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-primary" />
                    Loading release status...
                  </div>
                )}
              </div>

              {/* Direct Drag & Drop Uploader (6 cols) */}
              <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <h4 className="font-bold text-text-primary text-base flex items-center gap-2">
                    <UploadCloud size={18} className="text-primary" />
                    Direct APK Uploader
                  </h4>
                  <span className="text-[10px] text-neutral-400">Manual / Hotfix Publishing</span>
                </div>

                <div className="space-y-3 text-xs">
                  <label className="block p-5 border-2 border-dashed border-neutral-200 hover:border-primary rounded-2xl bg-surface-base text-center cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept=".apk,application/vnd.android.package-archive"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setUploadApkFile(file);
                      }}
                    />
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                      <Download size={20} />
                    </div>
                    {uploadApkFile ? (
                      <div>
                        <p className="font-bold text-text-primary text-sm">{uploadApkFile.name}</p>
                        <p className="text-[11px] text-text-muted mt-0.5">
                          {(uploadApkFile.size / (1024 * 1024)).toFixed(1)} MB • Click to replace
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold text-text-primary">Drag & drop your .apk file here</p>
                        <p className="text-[11px] text-text-muted mt-0.5">or browse from your local computer</p>
                      </div>
                    )}
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-neutral-700 block mb-1">Version Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 1.0.1"
                        value={uploadVersionInput}
                        onChange={(e) => setUploadVersionInput(e.target.value)}
                        className="w-full p-2.5 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        disabled={!uploadApkFile || isUploadingApk}
                        onClick={handleUploadApk}
                        className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 transition-all"
                      >
                        {isUploadingApk ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" /> Uploading...
                          </>
                        ) : (
                          <>
                            <UploadCloud size={14} /> Upload & Publish to Cloud
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-neutral-400 italic">
                    Binary is streamed directly to Supabase Storage (<code className="text-emerald-700">app-releases</code>) and preserved across server restarts.
                  </p>
                </div>
              </div>
            </div>

            {/* Supabase Storage & Retention Management Panel */}
            <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Database size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary text-base flex items-center gap-2">
                      Supabase Cloud Storage & Retention
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                        Active Bucket: {storageStats?.appReleases.bucket || 'app-releases'}
                      </span>
                    </h4>
                    <p className="text-xs text-text-muted mt-0.5">
                      Production CDN hosting for Android APK downloads with automated version pruning to respect storage quotas.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadStorageStats}
                    className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-text-secondary transition-colors"
                    title="Refresh storage statistics"
                  >
                    <RefreshCw size={14} className={storageStatsLoading ? 'animate-spin text-primary' : ''} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCleanupModalOpen(true)}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 size={14} />
                    Run Storage Retention Cleanup
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-1">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Stored APK Builds</span>
                  <p className="text-xl font-extrabold text-neutral-900">
                    {storageStats?.appReleases.totalFiles ?? '—'}
                  </p>
                  <p className="text-[11px] text-neutral-400">Total binaries in 'app-releases'</p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-1">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">APK Storage Footprint</span>
                  <p className="text-xl font-extrabold text-emerald-600">
                    {storageStats?.appReleases.totalSizeMB ?? '—'}
                  </p>
                  <p className="text-[11px] text-neutral-400">Releases quota utilization</p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-1">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Verification Docs</span>
                  <p className="text-xl font-extrabold text-primary">
                    {storageStats?.verificationDocs.registeredDocsCount ?? '—'}
                  </p>
                  <p className="text-[11px] text-neutral-400">Registered artisan ID & proof docs</p>
                </div>
              </div>

              {/* Live Public Supabase CDN URL display */}
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                    <HardDrive size={13} className="text-emerald-600" />
                    Direct Supabase Storage CDN Download Link (Permanent)
                  </p>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                    Public Read Active
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={storageStats?.appReleases.publicUrl || 'https://qdeznjpvkhrxesjykovi.supabase.co/storage/v1/object/public/app-releases/CraftMatch-latest.apk'}
                    className="flex-1 bg-white border border-neutral-200 px-3 py-1.5 rounded-lg text-xs font-mono text-neutral-700"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const link = storageStats?.appReleases.publicUrl || 'https://qdeznjpvkhrxesjykovi.supabase.co/storage/v1/object/public/app-releases/CraftMatch-latest.apk';
                      navigator.clipboard.writeText(link);
                      showToast('Public Supabase CDN download link copied to clipboard!');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 transition-colors"
                  >
                    Copy CDN Link
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Section: Multi-Platform URL & Status Configurator */}
            <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-neutral-100">
                <div>
                  <h4 className="font-bold text-text-primary text-base flex items-center gap-2">
                    <Layers size={18} className="text-primary" />
                    Multi-Platform Release Channels
                  </h4>
                  <p className="text-xs text-text-muted mt-0.5">
                    Configure download links, store URLs, and toggle availability for each client operating system.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isSavingManifest}
                  onClick={handleSavePlatformManifest}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 self-start sm:self-auto transition-all disabled:opacity-50"
                >
                  {isSavingManifest ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} /> Save Platform Changes
                    </>
                  )}
                </button>
              </div>

              <div className="divide-y divide-neutral-100">
                {editableLinks.map((link, idx) => (
                  <div key={link.platform} className="py-4 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="w-40 flex items-center gap-2.5 flex-shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-surface-base text-text-primary flex items-center justify-center font-bold text-xs uppercase border border-neutral-200">
                        {link.platform.slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-text-primary capitalize">{link.platform}</p>
                        <p className="text-[10px] text-text-muted">{link.label}</p>
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-7">
                        <label className="text-[10px] text-neutral-500 font-semibold block mb-0.5">Download / Store URL</label>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={link.href}
                          onChange={(e) => {
                            const next = [...editableLinks];
                            next[idx] = { ...next[idx], href: e.target.value };
                            setEditableLinks(next);
                          }}
                          className="w-full p-2 border border-neutral-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="text-[10px] text-neutral-500 font-semibold block mb-0.5">Min Requirement</label>
                        <input
                          type="text"
                          value={link.minRequirement || ''}
                          onChange={(e) => {
                            const next = [...editableLinks];
                            next[idx] = { ...next[idx], minRequirement: e.target.value };
                            setEditableLinks(next);
                          }}
                          className="w-full p-2 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <div className="md:col-span-2 flex items-end">
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...editableLinks];
                            next[idx] = { ...next[idx], available: !next[idx].available };
                            setEditableLinks(next);
                          }}
                          className={`w-full py-2 rounded-lg text-xs font-bold transition-colors ${
                            link.available
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                          }`}
                        >
                          {link.available ? 'Available' : 'Coming Soon'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: DISPATCH GITHUB ACTIONS CLOUD BUILD */}
        {buildModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-neutral-100">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="font-bold text-base text-neutral-900 flex items-center gap-2">
                  <CloudLightning size={20} className="text-amber-500" />
                  Dispatch GitHub Actions Cloud Build
                </h3>
                <button
                  onClick={() => setBuildModalOpen(false)}
                  className="text-neutral-400 hover:text-neutral-600 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-neutral-600 leading-relaxed">
                With 1-click, GitHub Actions compiles the Flutter Android APK in the cloud, pushes the binary directly to the Supabase Storage bucket (<code className="font-semibold text-primary">app-releases</code>), updates the download manifest, and makes it immediately available on the public Download page.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Target Git Branch</label>
                  <input
                    type="text"
                    value={buildBranchInput}
                    onChange={(e) => setBuildBranchInput(e.target.value)}
                    placeholder="e.g. feature/fcm-whatsapp-sms-fallback or main"
                    className="w-full p-3 text-xs font-mono border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-neutral-50/50"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">
                    GitHub Actions will checkout and build from this exact branch (e.g. <code className="text-neutral-700 font-bold">feature/fcm-whatsapp-sms-fallback</code>).
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Release Version Tag</label>
                  <input
                    type="text"
                    value={buildVersionInput}
                    onChange={(e) => setBuildVersionInput(e.target.value)}
                    placeholder="e.g. 1.0.1"
                    className="w-full p-3 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Build Target Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setBuildTypeInput('release')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        buildTypeInput === 'release'
                          ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      Release APK (Optimized)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuildTypeInput('debug')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        buildTypeInput === 'debug'
                          ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      Debug APK (Fast)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Release Notes & Changelog</label>
                  <textarea
                    rows={2}
                    value={buildNotesInput}
                    onChange={(e) => setBuildNotesInput(e.target.value)}
                    placeholder="Describe new features or bugfixes included in this build..."
                    className="w-full p-3 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>

                <div className="border-t border-neutral-100 pt-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-neutral-700">
                      GitHub Personal Access Token <span className="text-neutral-400 font-normal">(Optional)</span>
                    </label>
                    <a
                      href="https://github.com/Artisans-Connect/artisansApp_frontend/actions/workflows/build-android-release.yml"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold"
                    >
                      Open GitHub Actions <ExternalLink size={12} />
                    </a>
                  </div>
                  <input
                    type="password"
                    value={githubTokenInput}
                    onChange={(e) => setGithubTokenInput(e.target.value)}
                    placeholder="ghp_... (or set GITHUB_RELEASE_PAT in backend .env)"
                    className="w-full p-2.5 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Required only if GITHUB_RELEASE_PAT is not yet configured in server environment.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBuildModalOpen(false)}
                  className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!buildVersionInput.trim() || isTriggeringBuild}
                  onClick={handleTriggerCloudBuild}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {isTriggeringBuild ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Dispatching...
                    </>
                  ) : (
                    <>
                      <Play size={14} /> Dispatch Cloud Build
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: SUPABASE STORAGE CLEANUP */}
        {cleanupModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-neutral-100">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="font-bold text-base text-neutral-900 flex items-center gap-2">
                  <Trash2 size={20} className="text-red-600" />
                  Storage Retention & Quota Cleanup
                </h3>
                <button
                  onClick={() => setCleanupModalOpen(false)}
                  className="text-neutral-400 hover:text-neutral-600 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-neutral-600 leading-relaxed">
                Pruning obsolete release binaries and unlinked verification uploads frees up valuable storage quota in Supabase and keeps CDN operations performant.
              </p>

              <div className="space-y-3 bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-xs">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={pruneReleasesOption}
                    onChange={(e) => setPruneReleasesOption(e.target.checked)}
                    className="mt-0.5 rounded border-neutral-300 text-primary focus:ring-primary/20"
                  />
                  <div>
                    <span className="font-bold text-neutral-900 block">Prune Old APK Releases</span>
                    <span className="text-[11px] text-neutral-500">
                      Keeps the active <code className="font-bold">CraftMatch-latest.apk</code> plus the newest{' '}
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={keepVersionsCount}
                        onChange={(e) => setKeepVersionsCount(Math.max(1, Number(e.target.value) || 1))}
                        className="w-12 px-1.5 py-0.5 border border-neutral-300 rounded text-center font-bold inline-block mx-1"
                      />{' '}
                      versioned builds.
                    </span>
                  </div>
                </label>

                <div className="border-t border-neutral-200/60 pt-3">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={pruneOrphansOption}
                      onChange={(e) => setPruneOrphansOption(e.target.checked)}
                      className="mt-0.5 rounded border-neutral-300 text-primary focus:ring-primary/20"
                    />
                    <div>
                      <span className="font-bold text-neutral-900 block">Clean Orphan Verification Documents</span>
                      <span className="text-[11px] text-neutral-500">
                        Scans <code className="font-bold">verification-docs</code> for unlinked files from abandoned applications and deletes them.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCleanupModalOpen(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isCleaningStorage || (!pruneReleasesOption && !pruneOrphansOption)}
                  onClick={handleStorageCleanup}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 flex items-center gap-1.5 transition-all"
                >
                  {isCleaningStorage ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Pruning Cloud Storage...
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} /> Execute Storage Cleanup
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ISSUE OFFICIAL WARNING */}
        {warnModalOpen && warnTarget && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-neutral-100">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="font-bold text-base text-orange-900 flex items-center gap-2">
                  <AlertOctagon size={20} className="text-orange-600" />
                  Issue Official Warning to User
                </h3>
                <button onClick={() => setWarnModalOpen(false)} className="text-neutral-400 hover:text-neutral-600 text-lg font-bold">
                  ✕
                </button>
              </div>

              <p className="text-xs text-neutral-600">
                This will record an official warning for <strong className="text-neutral-900">{warnTarget.name}</strong> and dispatch an urgent policy notification to their mobile app.
              </p>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Warning Details / Reason</label>
                <textarea
                  rows={3}
                  value={warnReasonInput}
                  onChange={(e) => setWarnReasonInput(e.target.value)}
                  placeholder="State the exact policy breach or unfair treatment reason..."
                  className="w-full p-3 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setWarnModalOpen(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={!warnReasonInput.trim() || actionLoadingId === warnTarget.accountId}
                  onClick={handleExecuteWarn}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  <AlertOctagon size={14} /> Send Official Warning
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: BLOCK / SUSPEND ACCOUNT */}
        {blockModalOpen && blockTarget && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-neutral-100">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="font-bold text-base text-red-900 flex items-center gap-2">
                  <ShieldOff size={20} className="text-red-600" />
                  Block & Suspend Account
                </h3>
                <button onClick={() => setBlockModalOpen(false)} className="text-neutral-400 hover:text-neutral-600 text-lg font-bold">
                  ✕
                </button>
              </div>

              <p className="text-xs text-neutral-600">
                Suspending <strong className="text-neutral-900">{blockTarget.name}</strong> will prevent them from logging in, accepting jobs, or contacting platform users.
              </p>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Suspension Reason</label>
                <textarea
                  rows={3}
                  value={blockReasonInput}
                  onChange={(e) => setBlockReasonInput(e.target.value)}
                  placeholder="Specify the reason for blocking this account..."
                  className="w-full p-3 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBlockModalOpen(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={!blockReasonInput.trim() || actionLoadingId === blockTarget.accountId}
                  onClick={handleExecuteBlock}
                  className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  <ShieldOff size={14} /> Confirm Block & Suspend
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: REPORT INSPECTION DETAIL */}
        {inspectedReport && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-neutral-100">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                    {inspectedReport.ticket_number}
                  </span>
                  <h3 className="font-bold text-base text-neutral-900 mt-1">
                    Unfair Treatment & Safety Report Inspection
                  </h3>
                </div>
                <button onClick={() => setInspectedReport(null)} className="text-neutral-400 hover:text-neutral-600 text-lg font-bold">
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                    <p className="text-[10px] text-neutral-400 font-bold uppercase">Reporter</p>
                    <p className="font-bold text-neutral-900 mt-0.5">{inspectedReport.reporter?.full_name || 'Anonymous'}</p>
                    <p className="text-neutral-500">Phone: {inspectedReport.reporter?.phone || 'N/A'}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-xl border border-red-200">
                    <p className="text-[10px] text-red-700 font-bold uppercase">Reported Party</p>
                    <p className="font-bold text-neutral-900 mt-0.5">{inspectedReport.reported?.full_name || 'Unknown'}</p>
                    <p className="text-neutral-500">Status: {inspectedReport.reported?.account_status || 'active'}</p>
                  </div>
                </div>

                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 space-y-1">
                  <p className="font-bold text-neutral-900">Category & Priority</p>
                  <p className="text-neutral-700 font-semibold">{inspectedReport.category}</p>
                  <p className="text-neutral-500">Priority: {inspectedReport.priority} | Submitted: {formatDate(inspectedReport.created_at)}</p>
                </div>

                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                  <p className="font-bold text-neutral-900">Detailed Statement</p>
                  <p className="text-neutral-800 leading-relaxed">{inspectedReport.description}</p>
                </div>

                {/* Moderation Controls in Modal */}
                <div className="pt-2 border-t border-neutral-100 flex flex-wrap justify-end gap-2">
                  <button
                    onClick={() => handleDismissReport(inspectedReport.id)}
                    className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-lg"
                  >
                    Dismiss Report
                  </button>

                  {inspectedReport.reported && (
                    <>
                      <button
                        onClick={() => {
                          setWarnTarget({
                            accountId: inspectedReport.reported!.id,
                            name: inspectedReport.reported!.full_name || 'Reported User',
                            reportId: inspectedReport.id,
                          });
                          setWarnReasonInput(`Official warning regarding report ${inspectedReport.ticket_number}`);
                          setWarnModalOpen(true);
                        }}
                        className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg flex items-center gap-1"
                      >
                        <AlertOctagon size={14} /> Warn User
                      </button>

                      <button
                        onClick={() => {
                          setBlockTarget({
                            accountId: inspectedReport.reported!.id,
                            name: inspectedReport.reported!.full_name || 'Reported User',
                            reportId: inspectedReport.id,
                          });
                          setBlockReasonInput(`Account blocked due to report ${inspectedReport.ticket_number}`);
                          setBlockModalOpen(true);
                        }}
                        className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg flex items-center gap-1"
                      >
                        <ShieldOff size={14} /> Block User
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ACCOUNT DETAIL MODAL */}
        {selectedAccount && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                  <ShieldOff size={18} className="text-error" />
                  Account Moderation Detail
                </h3>
                <button
                  onClick={() => setSelectedAccount(null)}
                  className="text-text-muted hover:text-text-primary font-bold text-lg p-1"
                >
                  ✕
                </button>
              </div>

              {detailLoading ? (
                <div className="p-8 text-center text-text-muted">
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm">Loading details...</p>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center gap-3">
                    {selectedAccount.profile.avatar_url ? (
                      <img
                        src={selectedAccount.profile.avatar_url}
                        alt="Avatar"
                        className="w-14 h-14 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-error-light text-error flex items-center justify-center font-bold text-xl">
                        {(selectedAccount.profile.full_name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="text-base font-bold text-text-primary">
                        {selectedAccount.profile.full_name || 'Unnamed Account'}
                      </h4>
                      <p className="text-text-muted">Phone: {selectedAccount.profile.phone || 'N/A'}</p>
                      <p className="text-text-muted">ID: {selectedAccount.profile.id}</p>
                    </div>
                  </div>

                  <div className="bg-red-50 p-3 rounded-xl border border-red-100 space-y-1">
                    <p className="font-bold text-red-900">Suspension Details</p>
                    <p className="text-red-800">
                      <strong>Status:</strong> {selectedAccount.profile.account_status}
                    </p>
                    <p className="text-red-800">
                      <strong>Date:</strong> {formatDate(selectedAccount.profile.suspended_at)}
                    </p>
                    <p className="text-red-800">
                      <strong>Reason:</strong>{' '}
                      {selectedAccount.profile.suspension_reason || 'No specific reason entered.'}
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                    <button
                      onClick={() => setSelectedAccount(null)}
                      className="px-4 py-2 text-xs font-semibold rounded-lg border border-neutral-200 hover:bg-neutral-50"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => handleUnblock(selectedAccount.profile)}
                      disabled={actionLoadingId === selectedAccount.profile.id}
                      className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                    >
                      <UserCheck size={14} /> Clear / Reactivate Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
