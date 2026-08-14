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
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { adminGet, adminPatch, adminPost } from '../../lib/api';
import type { AdminAccount, AdminAccountDetail, AdminAccountWorker } from '../../types';

interface SettingsPageProps {
  onNavigate: (page: string, data?: unknown) => void;
  initialTab?: 'broadcast' | 'blocked' | 'general';
}

function workerFrom(account: { workers?: AdminAccountWorker | AdminAccountWorker[] | null }) {
  if (Array.isArray(account.workers)) return account.workers[0] ?? null;
  return account.workers ?? null;
}

function displayRole(account: AdminAccount): 'worker' | 'client' {
  if (workerFrom(account)) return 'worker';
  const role = account.signup_type ?? account.role ?? account.last_active_mode ?? '';
  return role.toLowerCase().includes('worker') ? 'worker' : 'client';
}

function formatDate(isoStr: string | null) {
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
  const [activeTab, setActiveTab] = useState<'broadcast' | 'blocked' | 'general'>(initialTab);
  const [blockedAccounts, setBlockedAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<'all' | 'worker' | 'client'>('all');
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

  const loadBlockedAccounts = () => {
    setLoading(true);
    setError(null);
    adminGet<AdminAccount[]>('/admin/accounts?status=suspended')
      .then((data) => {
        setBlockedAccounts(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not load blocked accounts.');
        setBlockedAccounts([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'blocked') {
      loadBlockedAccounts();
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
      loadBlockedAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unblock account.');
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

  const totalBlocked = blockedAccounts.length;
  const blockedWorkersCount = blockedAccounts.filter((a) => displayRole(a) === 'worker').length;
  const blockedClientsCount = blockedAccounts.filter((a) => displayRole(a) === 'client').length;

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
                Admin Settings & System Control
              </h2>
              <p className="text-sm text-text-muted mt-1">
                Manage push notifications, user moderation policies, and admin-blocked accounts.
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
              Blocked Accounts
              <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-error-light text-error font-bold">
                {totalBlocked}
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

        {/* TAB CONTENT: BLOCKED ACCOUNTS */}
        {activeTab === 'blocked' && (
          <div className="space-y-6">
            {/* Stats Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-error-light text-error flex items-center justify-center flex-shrink-0">
                  <ShieldOff size={24} />
                </div>
                <div>
                  <p className="text-xs text-text-muted font-medium">Total Admin Blocked</p>
                  <p className="text-2xl font-bold text-text-primary">{totalBlocked}</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
                  <Briefcase size={24} />
                </div>
                <div>
                  <p className="text-xs text-text-muted font-medium">Blocked Workers</p>
                  <p className="text-2xl font-bold text-text-primary">{blockedWorkersCount}</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
                  <User size={24} />
                </div>
                <div>
                  <p className="text-xs text-text-muted font-medium">Blocked Clients</p>
                  <p className="text-2xl font-bold text-text-primary">{blockedClientsCount}</p>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Role filter buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter size={16} className="text-text-muted hidden sm:block" />
                <button
                  onClick={() => setRoleFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    roleFilter === 'all'
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-text-secondary hover:bg-neutral-200'
                  }`}
                >
                  All ({totalBlocked})
                </button>
                <button
                  onClick={() => setRoleFilter('worker')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    roleFilter === 'worker'
                      ? 'bg-amber-600 text-white'
                      : 'bg-neutral-100 text-text-secondary hover:bg-neutral-200'
                  }`}
                >
                  Workers ({blockedWorkersCount})
                </button>
                <button
                  onClick={() => setRoleFilter('client')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    roleFilter === 'client'
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-100 text-text-secondary hover:bg-neutral-200'
                  }`}
                >
                  Clients ({blockedClientsCount})
                </button>
              </div>

              {/* Search Box & Refresh */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search name, phone, reason..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <button
                  onClick={loadBlockedAccounts}
                  className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-text-secondary"
                  title="Refresh blocked list"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Blocked Accounts List */}
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-12 text-center text-text-muted">
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Loading admin blocked accounts...</p>
                </div>
              ) : filteredBlockedAccounts.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <ShieldOff size={48} className="mx-auto text-neutral-300" />
                  <h3 className="text-base font-bold text-text-primary">No Blocked Accounts Found</h3>
                  <p className="text-xs text-text-muted max-w-sm mx-auto">
                    {search || roleFilter !== 'all'
                      ? 'No blocked accounts match your selected filter or search criteria.'
                      : 'There are currently no accounts blocked or suspended by the admin.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {filteredBlockedAccounts.map((account) => {
                    const role = displayRole(account);
                    const isWorker = role === 'worker';
                    const isProcessing = actionLoadingId === account.id;

                    return (
                      <div
                        key={account.id}
                        className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-50/50 transition-colors"
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
                              <div className="w-12 h-12 rounded-full bg-error-light text-error flex items-center justify-center font-bold text-base border border-error/20">
                                {(account.full_name || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 bg-error text-white p-0.5 rounded-full border-2 border-white" title="Account Blocked">
                              <ShieldOff size={10} />
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
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-700">
                                Blocked / Suspended
                              </span>
                            </div>

                            <p className="text-xs text-text-muted flex items-center gap-2">
                              <span>Phone: {account.phone || 'N/A'}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock size={12} /> Blocked: {formatDate(account.suspended_at)}
                              </span>
                            </p>

                            {/* Reason Box */}
                            <div className="mt-2 bg-red-50/70 border border-red-100 rounded-lg p-2.5 max-w-2xl">
                              <p className="text-[11px] text-red-900 font-semibold flex items-center gap-1">
                                <ShieldAlert size={12} className="text-red-600 flex-shrink-0" />
                                Admin Reason:
                              </p>
                              <p className="text-xs text-red-800 mt-0.5">
                                {account.suspension_reason || 'No specific suspension reason recorded.'}
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
                            onClick={() => handleUnblock(account)}
                            disabled={isProcessing}
                            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <>
                                <RefreshCw size={14} className="animate-spin" /> Unblocking...
                              </>
                            ) : (
                              <>
                                <UserCheck size={14} /> Unblock Account
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
          </div>
        )}

        {/* TAB CONTENT: PLATFORM CONTROLS */}
        {activeTab === 'general' && (
          <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-text-primary border-b border-neutral-100 pb-3">
              Platform & Safety Policy Controls
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
                      <UserCheck size={14} /> Unblock Account
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
