import { useState, useEffect, useRef } from 'react';
import {
  Search, CheckCircle, Clock, XCircle, AlertCircle,
  FileText, Upload, ArrowRight, RefreshCw, Shield
} from 'lucide-react';
import { PublicLayout } from '../components/layout/PublicLayout';
import { StatusBadge } from '../components/ui/StatusBadge';
import { supabase } from '../lib/supabase';
import type { WorkerVerification, VerificationStatus } from '../types';

interface StatusPageProps {
  onNavigate: (page: string) => void;
}

function getStageIndex(status: VerificationStatus): number {
  if (status === 'approved' || status === 'rejected') return 3;
  if (status === 'more_info_requested' || status === 'under_review') return 2;
  return 1;
}

export function StatusPage({ onNavigate }: StatusPageProps) {
  const [applicationNumber, setApplicationNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searching, setSearching] = useState(false);
  const [application, setApplication] = useState<WorkerVerification | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [liveUpdate, setLiveUpdate] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Subscribe to realtime updates whenever an application is loaded
  useEffect(() => {
    if (!application) return;

    // Clean up previous channel
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const channel = supabase
      .channel(`status_page_${application.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'worker_verifications',
          filter: `id=eq.${application.id}`,
        },
        (payload) => {
          setApplication(payload.new as WorkerVerification);
          setLastChecked(new Date());
          setLiveUpdate(true);
          setTimeout(() => setLiveUpdate(false), 4000);
        }
      )
      .subscribe((status) => {
        setRealtimeConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [application?.id]);

  const fetchApplication = async (appNum: string, phone: string) => {
    let query = supabase.from('worker_verifications').select('*');
    if (appNum.trim()) {
      query = query.eq('application_number', appNum.trim().toUpperCase());
    } else {
      // Strip common formatting so "+233 24 123 4567" matches "+233241234567"
      const stripped = phone.trim().replace(/[\s\-()]/g, '');
      query = query.ilike('phone_number', `%${stripped}%`);
    }
    const { data } = await query.maybeSingle();
    return data as WorkerVerification | null;
  };

  const handleSearch = async () => {
    if (!applicationNumber.trim() && !phoneNumber.trim()) {
      setError('Please enter your application number or phone number.');
      return;
    }
    setError('');
    setSearching(true);
    setNotFound(false);
    setApplication(null);

    try {
      const data = await fetchApplication(applicationNumber, phoneNumber);
      if (data) {
        setApplication(data);
        setLastChecked(new Date());
      } else {
        setNotFound(true);
      }
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleRefresh = async () => {
    if (!application) return;
    setSearching(true);
    try {
      const data = await fetchApplication(application.application_number, '');
      if (data) {
        setApplication(data);
        setLastChecked(new Date());
      }
    } catch {
      setError('Refresh failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const stages = application
    ? [
        {
          label: 'Application Submitted',
          desc: 'Your application was received successfully.',
          icon: FileText,
          completedAt: application.submitted_at,
          done: true,
          active: false,
        },
        {
          label: 'Under Review',
          desc: 'Our team is reviewing your documents.',
          icon: Clock,
          completedAt: application.status !== 'pending' ? application.reviewed_at : null,
          done: application.status !== 'pending',
          active: application.status === 'under_review',
        },
        {
          label:
            application.status === 'rejected'
              ? 'Application Rejected'
              : application.status === 'more_info_requested'
              ? 'More Information Needed'
              : application.status === 'approved'
              ? 'Verification Approved'
              : 'Awaiting Decision',
          desc:
            application.status === 'rejected'
              ? 'Your application was not approved.'
              : application.status === 'more_info_requested'
              ? 'Additional documents have been requested.'
              : application.status === 'approved'
              ? 'Congratulations, you are now verified!'
              : 'Your application is being processed.',
          icon:
            application.status === 'rejected'
              ? XCircle
              : application.status === 'more_info_requested'
              ? AlertCircle
              : application.status === 'approved'
              ? CheckCircle
              : Clock,
          completedAt: application.reviewed_at,
          done: ['approved', 'rejected', 'more_info_requested'].includes(application.status),
          active: false,
        },
      ]
    : [];

  const currentStageIndex = application ? getStageIndex(application.status) - 1 : -1;

  return (
    <PublicLayout onNavigate={onNavigate}>
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-display-sm font-bold text-text-primary mb-3">Track Your Application</h1>
          <p className="text-text-secondary">
            Enter your application number or the phone number you registered with.
          </p>
        </div>

        {/* Search form */}
        <div className="card p-6">
          <div className="space-y-4">
            <div>
              <label className="label">Application Number</label>
              <input
                className="input-field font-mono tracking-wider"
                placeholder="e.g. ART-KWA001"
                value={applicationNumber}
                onChange={e => {
                  setApplicationNumber(e.target.value);
                  setPhoneNumber('');
                }}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-neutral-100" />
              <span className="text-xs text-text-muted font-medium">OR</span>
              <div className="flex-1 h-px bg-neutral-100" />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input
                className="input-field"
                placeholder="+233 24 123 4567"
                value={phoneNumber}
                onChange={e => {
                  setPhoneNumber(e.target.value);
                  setApplicationNumber('');
                }}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            {error && <p className="text-sm text-error">{error}</p>}
            <button onClick={handleSearch} disabled={searching} className="btn-primary w-full justify-center">
              {searching ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Searching...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Track Application
                </>
              )}
            </button>
          </div>
        </div>

        {/* Not found */}
        {notFound && (
          <div className="mt-6 card p-6 text-center animate-fade-in">
            <Search size={32} className="text-neutral-300 mx-auto mb-3" />
            <h3 className="font-bold text-text-primary mb-2">Application Not Found</h3>
            <p className="text-sm text-text-secondary mb-4">
              No application was found. Double-check your details, or submit a new application.
            </p>
            <button onClick={() => onNavigate('apply')} className="btn-primary text-sm">
              Apply for Verification
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {application && (
          <div className="mt-6 space-y-4 animate-slide-up">
            {/* Header card with refresh */}
            <div className="card p-5">
              {/* Live update flash */}
              {liveUpdate && (
                <div className="mb-4 flex items-center gap-2 p-3 bg-success-light border border-success/20 rounded-xl animate-fade-in">
                  <CheckCircle size={16} className="text-success flex-shrink-0" />
                  <p className="text-sm font-semibold text-success-dark">Your status was just updated!</p>
                </div>
              )}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-text-muted font-medium uppercase tracking-wide mb-1">Application</p>
                  <p className="font-bold text-text-primary font-mono text-lg">{application.application_number}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={application.status} />
                  <div className="flex items-center gap-2">
                    {/* Realtime indicator */}
                    <div className={`flex items-center gap-1 text-xs font-medium transition-all
                      ${realtimeConnected ? 'text-success-dark' : 'text-text-muted'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${realtimeConnected ? 'bg-success animate-pulse' : 'bg-neutral-300'}`} />
                      {realtimeConnected ? 'Live' : ''}
                    </div>
                    <button
                      onClick={handleRefresh}
                      disabled={searching}
                      className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors font-medium"
                      title="Refresh status"
                    >
                      <RefreshCw size={12} className={searching ? 'animate-spin' : ''} />
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-text-muted text-xs">Applicant</p>
                  <p className="font-semibold text-text-primary">{application.full_name}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs">Trade</p>
                  <p className="font-semibold text-text-primary">{application.trade_category}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs">Location</p>
                  <p className="font-semibold text-text-primary">
                    {application.current_city}, {application.current_region}
                  </p>
                </div>
                <div>
                  <p className="text-text-muted text-xs">Submitted</p>
                  <p className="font-semibold text-text-primary">
                    {new Date(application.submitted_at).toLocaleDateString('en-GH', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              {lastChecked && (
                <p className="text-[10px] text-text-muted mt-3 pt-3 border-t border-neutral-100">
                  Last checked: {lastChecked.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              )}
            </div>

            {/* Timeline */}
            <div className="card p-5">
              <h3 className="font-bold text-text-primary mb-5">Application Timeline</h3>
              <div>
                {stages.map((stage, index) => {
                  const Icon = stage.icon;
                  const isFinal = index === 2;

                  let dotBg = 'bg-neutral-200 border-neutral-300 text-neutral-400';
                  let lineColor = 'bg-neutral-100';

                  if (stage.done && isFinal) {
                    if (application.status === 'approved') dotBg = 'bg-success border-success text-white';
                    else if (application.status === 'rejected') dotBg = 'bg-error border-error text-white';
                    else if (application.status === 'more_info_requested') dotBg = 'bg-gold-500 border-gold-400 text-white';
                    else dotBg = 'bg-primary border-primary text-white';
                  } else if (stage.done) {
                    dotBg = 'bg-primary border-primary text-white';
                  } else if (stage.active) {
                    dotBg = 'bg-gold-400 border-gold-300 text-white animate-pulse';
                  }

                  if (index < currentStageIndex) lineColor = 'bg-primary';

                  return (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${dotBg}`}>
                          <Icon size={16} />
                        </div>
                        {index < stages.length - 1 && (
                          <div className={`w-0.5 flex-1 min-h-[2rem] mt-1 rounded-full transition-all duration-300 ${lineColor}`} />
                        )}
                      </div>
                      <div className="pb-6 pt-1">
                        <p className={`font-semibold text-sm ${stage.done || stage.active ? 'text-text-primary' : 'text-text-muted'}`}>
                          {stage.label}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">{stage.desc}</p>
                        {stage.completedAt && (
                          <p className="text-xs text-text-muted mt-1 font-medium">
                            {new Date(stage.completedAt).toLocaleDateString('en-GH', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            &middot;{' '}
                            {new Date(stage.completedAt).toLocaleTimeString('en-GH', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Approved */}
            {application.status === 'approved' && (
              <div className="card p-6 border-2 border-success/30 bg-success-light/40 animate-fade-in">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-success flex items-center justify-center shadow-md">
                    <Shield size={28} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-success-dark mb-1">You're Officially Verified!</h3>
                    <p className="text-sm text-text-secondary">
                      Your artisan profile now carries the official Artisans verification badge.
                      Customers will see you as a trusted professional.
                    </p>
                    {application.verification_level && (
                      <p className="mt-2 text-sm font-semibold text-success-dark capitalize">
                        Level: {application.verification_level} Verification
                      </p>
                    )}
                  </div>
                  {application.reviewed_at && (
                    <p className="text-xs text-text-muted">
                      Approved on{' '}
                      {new Date(application.reviewed_at).toLocaleDateString('en-GH', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Rejected */}
            {application.status === 'rejected' && (
              <div className="card p-5 border-l-4 border-error bg-error-light/30 animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-error-light flex items-center justify-center flex-shrink-0">
                    <XCircle size={20} className="text-error" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-text-primary mb-1">Application Not Approved</h3>
                    {application.rejection_reason ? (
                      <p className="text-sm text-text-secondary mb-3">{application.rejection_reason}</p>
                    ) : (
                      <p className="text-sm text-text-secondary mb-3">
                        Your application did not meet our verification requirements.
                      </p>
                    )}
                    <button
                      onClick={() => onNavigate('apply')}
                      className="btn-primary text-sm"
                    >
                      Re-apply
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* More info requested */}
            {application.status === 'more_info_requested' && (
              <div className="card p-5 border-l-4 border-gold-500 bg-gold-50/50 animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold-50 flex items-center justify-center flex-shrink-0">
                    <AlertCircle size={20} className="text-gold-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-text-primary mb-1">Action Required</h3>
                    <p className="text-sm text-text-secondary mb-3">
                      {application.more_info_message ||
                        application.admin_notes ||
                        'Our team needs additional documents to complete your verification.'}
                    </p>
                    <button
                      onClick={() => onNavigate('apply')}
                      className="btn-primary text-sm bg-gold-500 hover:bg-gold-600 border-0 shadow-none"
                    >
                      <Upload size={16} />
                      Re-apply with Updated Documents
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Pending / under review */}
            {(application.status === 'pending' || application.status === 'under_review') && (
              <div className="card p-5 bg-neutral-50 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <Clock size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">
                      {application.status === 'pending' ? 'Awaiting Review' : 'Currently Under Review'}
                    </p>
                    <p className="text-sm text-text-secondary">
                      Our team typically responds within 48 hours. Use the refresh button to check for updates.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
