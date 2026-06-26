import { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar, Briefcase,
  FileText, CheckCircle, XCircle, AlertCircle, Shield, User,
  ExternalLink, FileImage, File as FileIcon, RefreshCw, Zap
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { StatusBadge, LevelBadge, ConfidenceScore } from '../../components/ui/StatusBadge';
import { FraudIndicators } from '../../components/ui/FraudIndicators';
import { adminGet, adminPatch } from '../../lib/api';
import { REJECTION_REASONS } from '../../lib/constants';
import type {
  WorkerVerification, VerificationReference,
  VerificationAuditLog, VerificationDocument, DocumentType,
  AdminCategory
} from '../../types';

interface ApplicationDetailProps {
  application: WorkerVerification;
  onNavigate: (page: string, data?: unknown) => void;
}

type ModalType = 'approve' | 'reject' | 'more_info' | null;

interface ApplicationBundle {
  application: WorkerVerification;
  references: VerificationReference[];
  documents: VerificationDocument[];
  audit_logs: VerificationAuditLog[];
}

const docTypeLabels: Record<DocumentType, string> = {
  id_front: 'ID Front',
  id_back: 'ID Back',
  selfie: 'Selfie',
  certification: 'Certification',
  training: 'Training Docs',
  portfolio: 'Portfolio',
};

const docTypeOrder: DocumentType[] = ['id_front', 'id_back', 'selfie', 'certification', 'training', 'portfolio'];

const auditActionConfig = {
  submitted:           { label: 'Submitted',             color: 'bg-primary',      Icon: FileText },
  reviewed:            { label: 'Reviewed',              color: 'bg-info-dark',    Icon: FileText },
  approved:            { label: 'Approved',              color: 'bg-success',      Icon: CheckCircle },
  rejected:            { label: 'Rejected',              color: 'bg-error',        Icon: XCircle },
  more_info_requested: { label: 'More Info Requested',   color: 'bg-gold-500',     Icon: AlertCircle },
  documents_uploaded:  { label: 'Documents Uploaded',    color: 'bg-primary',      Icon: FileImage },
  status_changed:      { label: 'Status Changed',        color: 'bg-neutral-400',  Icon: RefreshCw },
};

export function ApplicationDetail({ application: initialApplication, onNavigate }: ApplicationDetailProps) {
  const [application, setApplication] = useState(initialApplication);
  const [references, setReferences] = useState<VerificationReference[]>([]);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [auditLogs, setAuditLogs] = useState<VerificationAuditLog[]>([]);
  const [modal, setModal] = useState<ModalType>(null);
  const [modalData, setModalData] = useState({ level: 'identity', notes: '', reason: '', message: '', docs: '' });
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);

  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [tradeAction, setTradeAction] = useState<'keep' | 'assign' | 'adopt'>('keep');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedAssignedTrade, setSelectedAssignedTrade] = useState<string>('');

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await adminGet<AdminCategory[]>('/admin/categories');
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    loadCategories();
  }, []);

  const standardTrades = categories.flatMap(cat => cat.subcategories.map(sub => sub.name.toLowerCase()));
  const isCustomTrade = categories.length > 0 && !standardTrades.includes(application.trade_category.toLowerCase());

  const fetchData = useCallback(async () => {
    const bundle = await adminGet<ApplicationBundle>(
      `/verification/admin/applications/${application.id}`,
    );
    setApplication(bundle.application);
    setReferences(bundle.references);
    setDocuments(bundle.documents);
    setAuditLogs(bundle.audit_logs);
  }, [application.id]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscription — live status updates
  useEffect(() => {
    setRealtimeConnected(true);
  }, [application.id]);

  const handleAction = async () => {
    if (modal === 'reject' && !modalData.reason) return;
    setSubmitting(true);
    setActionError('');
    try {
      let updateData: any = { reviewed_at: new Date().toISOString() };
      if (modal === 'approve') {
        updateData = {
          ...updateData,
          status: 'approved',
          verification_level: modalData.level as WorkerVerification['verification_level'],
          admin_notes: modalData.notes,
        };
        if (isCustomTrade) {
          if (tradeAction === 'assign' && selectedAssignedTrade) {
            updateData.assigned_trade = selectedAssignedTrade;
          } else if (tradeAction === 'adopt' && selectedCategoryId) {
            updateData.adopt_trade = true;
            updateData.adopt_category_id = selectedCategoryId;
          }
        }
      } else if (modal === 'reject') {
        updateData = {
          ...updateData,
          status: 'rejected',
          rejection_reason: modalData.reason,
          admin_notes: modalData.notes,
        };
      } else if (modal === 'more_info') {
        updateData = {
          ...updateData,
          status: 'more_info_requested',
          more_info_message: modalData.message,
        };
      }

      // Update verification — realtime channel will also pick this up
      const data = await adminPatch<WorkerVerification>(
        `/verification/admin/applications/${application.id}/status`,
        updateData,
      );
      setApplication(data);
      await fetchData();

      setModal(null);
      setJustUpdated(true);
      setTimeout(() => setJustUpdated(false), 3000);
    } catch {
      setActionError('Action failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkUnderReview = async () => {
    if (application.status !== 'pending') return;
    try {
      const data = await adminPatch<WorkerVerification>(
        `/verification/admin/applications/${application.id}/status`,
        { status: 'under_review', admin_notes: 'Application moved to under review' },
      );
      setApplication(data);
      await fetchData();
    } catch {
      setActionError('Failed to update status. Please try again.');
      setTimeout(() => setActionError(''), 4000);
    }
  };

  // Group documents by type
  const docsByType = documents.reduce((acc, doc) => {
    if (!acc[doc.document_type]) acc[doc.document_type] = [];
    acc[doc.document_type].push(doc);
    return acc;
  }, {} as Record<string, VerificationDocument[]>);

  const isImage = (doc: VerificationDocument) =>
    doc.mime_type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.file_url);

  return (
    <AdminLayout currentPage="applications" onNavigate={onNavigate}>
      <div className="space-y-4 animate-fade-in">
        {/* Header row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button onClick={() => onNavigate('applications')} className="btn-ghost">
            <ArrowLeft size={16} />
            Back to Applications
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Realtime indicator */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-300
              ${realtimeConnected
                ? 'bg-success-light border-success/20 text-success-dark'
                : 'bg-neutral-100 border-neutral-200 text-text-muted'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${realtimeConnected ? 'bg-success animate-pulse' : 'bg-neutral-300'}`} />
              {realtimeConnected ? 'Live' : 'Connecting...'}
            </div>
            {justUpdated && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-50 border border-primary/20 text-primary animate-fade-in">
                <Zap size={12} />
                Status updated
              </div>
            )}
            <StatusBadge status={application.status} />
            <LevelBadge level={application.verification_level} />
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-5">
          {/* ── Left column ─────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Profile card */}
            <div className="card p-5">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0 shadow-primary-glow">
                  <span className="text-white text-xl font-bold">{application.full_name.charAt(0)}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-primary">{application.full_name}</h2>
                  <p className="text-sm text-text-muted font-mono">{application.application_number}</p>
                  {application.business_name && (
                    <p className="text-sm text-primary font-medium">{application.business_name}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2.5">
                {[
                  { Icon: Phone, value: application.phone_number },
                  { Icon: Mail, value: application.email },
                  { Icon: MapPin, value: `${application.current_city}, ${application.current_region}` },
                  {
                    Icon: Calendar,
                    value: application.date_of_birth
                      ? `${new Date(application.date_of_birth).toLocaleDateString('en-GH', { day: '2-digit', month: 'long', year: 'numeric' })} · ${application.gender}`
                      : application.gender,
                  },
                ].map(({ Icon, value }) => (
                  <div key={value} className="flex items-center gap-2.5 text-sm">
                    <Icon size={15} className="text-text-muted flex-shrink-0" />
                    <span className="text-text-primary">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Professional */}
            <div className="card p-5">
              <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                <Briefcase size={16} className="text-primary" />
                Professional Details
              </h3>
              <div className="space-y-2">
                {[
                  ['Trade', application.trade_category],
                  ['Experience', `${application.years_of_experience} years`],
                  ['Submitted', new Date(application.submitted_at).toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric' })],
                  ...(application.reviewed_at ? [['Reviewed', new Date(application.reviewed_at).toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric' })]] : []),
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center py-1 border-b border-neutral-50 last:border-0">
                    <span className="text-sm text-text-muted">{label}</span>
                    <span className="text-sm font-semibold text-text-primary">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Score & Risk */}
            <div className="card p-5">
              <ConfidenceScore score={application.confidence_score} size="md" />
              {application.fraud_indicators && application.fraud_indicators.length > 0 && (
                <div className="mt-4 pt-4 border-t border-neutral-100">
                  <p className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wide">Fraud Indicators</p>
                  <FraudIndicators indicators={application.fraud_indicators} />
                </div>
              )}
            </div>

            {/* References */}
            {references.length > 0 && (
              <div className="card p-5">
                <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                  <User size={16} className="text-primary" />
                  References ({references.length})
                </h3>
                <div className="space-y-3">
                  {references.map((ref) => (
                    <div key={ref.id} className="p-3 bg-neutral-50 rounded-xl">
                      <p className="text-sm font-semibold text-text-primary">{ref.reference_name}</p>
                      <p className="text-xs text-text-muted">{ref.relationship} · {ref.phone_number}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin notes / rejection reason */}
            {(application.admin_notes || application.rejection_reason) && (
              <div className={`card p-4 border-l-4 ${application.status === 'rejected' ? 'border-error' : 'border-primary'}`}>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">
                  {application.status === 'rejected' ? 'Rejection Reason' : 'Admin Notes'}
                </p>
                <p className="text-sm text-text-secondary">
                  {application.rejection_reason || application.admin_notes}
                </p>
              </div>
            )}
            {application.more_info_message && (
              <div className="card p-4 border-l-4 border-gold-500">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Request Message</p>
                <p className="text-sm text-text-secondary">{application.more_info_message}</p>
              </div>
            )}
          </div>

          {/* ── Right column ────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Current status banner */}
            {application.status === 'approved' && (
              <div className="card p-4 border border-success/30 bg-success-light/50 flex items-center gap-3">
                <CheckCircle size={22} className="text-success flex-shrink-0" />
                <div>
                  <p className="font-bold text-success-dark">Approved — {application.verification_level} verification</p>
                  {application.admin_notes && <p className="text-sm text-text-secondary mt-0.5">{application.admin_notes}</p>}
                </div>
              </div>
            )}
            {application.status === 'rejected' && (
              <div className="card p-4 border border-error/30 bg-error-light/50 flex items-center gap-3">
                <XCircle size={22} className="text-error flex-shrink-0" />
                <div>
                  <p className="font-bold text-error">Rejected</p>
                  {application.rejection_reason && <p className="text-sm text-text-secondary mt-0.5">{application.rejection_reason}</p>}
                </div>
              </div>
            )}
            {application.status === 'more_info_requested' && (
              <div className="card p-4 border border-gold-200 bg-gold-50/50 flex items-center gap-3">
                <AlertCircle size={22} className="text-gold-600 flex-shrink-0" />
                <p className="font-bold text-gold-800">Awaiting additional documents from applicant</p>
              </div>
            )}

            {/* Admin action buttons */}
            {!['approved', 'rejected'].includes(application.status) && (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-text-primary">Admin Actions</h3>
                  {application.status === 'pending' && (
                    <button
                      onClick={handleMarkUnderReview}
                      className="text-xs font-semibold text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                    >
                      Mark as Under Review
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      setModal('approve');
                      setModalData({ level: 'identity', notes: '', reason: '', message: '', docs: '' });
                      setTradeAction('keep');
                      setSelectedCategoryId('');
                      setSelectedAssignedTrade('');
                    }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-success-light border border-success/20 text-success-dark hover:bg-success/10 transition-colors group"
                  >
                    <CheckCircle size={22} className="group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold">Approve</span>
                  </button>
                  <button
                    onClick={() => { setModal('reject'); setModalData({ level: 'identity', notes: '', reason: '', message: '', docs: '' }); }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-error-light border border-error/20 text-error hover:bg-error/10 transition-colors group"
                  >
                    <XCircle size={22} className="group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold">Reject</span>
                  </button>
                  <button
                    onClick={() => { setModal('more_info'); setModalData({ level: 'identity', notes: '', reason: '', message: '', docs: '' }); }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gold-50 border border-gold-200 text-gold-700 hover:bg-gold-100 transition-colors group"
                  >
                    <AlertCircle size={22} className="group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold">Request Info</span>
                  </button>
                </div>
              </div>
            )}

            {/* Documents */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-text-primary flex items-center gap-2">
                  <FileText size={16} className="text-primary" />
                  Submitted Documents
                </h3>
                <span className="text-xs text-text-muted">{documents.length} file{documents.length !== 1 ? 's' : ''}</span>
              </div>

              {documents.length === 0 ? (
                <div className="py-10 text-center border-2 border-dashed border-neutral-100 rounded-xl">
                  <FileImage size={28} className="text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-text-muted">No documents uploaded</p>
                  <p className="text-xs text-text-muted mt-1">Documents submitted via the application form appear here.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {docTypeOrder
                    .filter(type => docsByType[type]?.length > 0)
                    .map((type) => (
                      <div key={type}>
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                          {docTypeLabels[type]}
                          <span className="ml-1.5 text-text-light font-normal normal-case">({docsByType[type].length})</span>
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {docsByType[type].map((doc) => (
                            <div key={doc.id} className="group relative">
                              {isImage(doc) ? (
                                <div
                                  className="aspect-[4/3] rounded-xl overflow-hidden bg-neutral-100 border border-neutral-100 cursor-pointer"
                                  onClick={() => setPreviewUrl(doc.file_url)}
                                >
                                  <img
                                    src={doc.file_url}
                                    alt={doc.file_name || docTypeLabels[type]}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      (e.target as HTMLImageElement).parentElement!.classList.add('flex', 'items-center', 'justify-center');
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <span className="text-white text-xs font-semibold bg-black/40 px-2 py-1 rounded-lg">View</span>
                                  </div>
                                </div>
                              ) : (
                                <a
                                  href={doc.file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="aspect-[4/3] rounded-xl border border-neutral-100 bg-neutral-50 flex flex-col items-center justify-center gap-2 hover:bg-neutral-100 transition-colors cursor-pointer"
                                >
                                  <FileIcon size={24} className="text-error" />
                                  <span className="text-xs text-text-muted font-medium">PDF</span>
                                </a>
                              )}
                              <div className="flex items-center justify-between mt-1.5 px-0.5">
                                <p className="text-xs text-text-muted truncate max-w-[80%]">{doc.file_name || 'Document'}</p>
                                <a
                                  href={doc.file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary hover:text-primary-dark flex-shrink-0"
                                  title="Open in new tab"
                                >
                                  <ExternalLink size={12} />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Audit trail */}
            <div className="card p-5">
              <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                <Shield size={16} className="text-primary" />
                Activity Log
              </h3>
              {auditLogs.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">No activity yet</p>
              ) : (
                <div>
                  {auditLogs.map((log, i) => {
                    const cfg = auditActionConfig[log.action] || auditActionConfig.status_changed;
                    const Icon = cfg.Icon;
                    return (
                      <div key={log.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white ${cfg.color}`}>
                            <Icon size={13} />
                          </div>
                          {i < auditLogs.length - 1 && <div className="w-0.5 h-4 bg-neutral-100 my-1" />}
                        </div>
                        <div className="pb-3 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-text-primary">{cfg.label}</span>
                            {log.admin_name && (
                              <span className="text-xs text-text-muted">by {log.admin_name}</span>
                            )}
                          </div>
                          {log.notes && <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{log.notes}</p>}
                          <p className="text-xs text-text-muted mt-0.5">
                            {new Date(log.created_at).toLocaleString('en-GH', {
                              day: '2-digit', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Approve modal ───────────────────────────────────────── */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div className="bg-white rounded-2xl shadow-warm-xl w-full max-w-md animate-slide-up">
            <div className="p-6">

              {modal === 'approve' && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 rounded-xl bg-success-light flex items-center justify-center">
                      <CheckCircle size={22} className="text-success" />
                    </div>
                    <div>
                      <h3 className="font-bold text-text-primary">Approve Application</h3>
                      <p className="text-sm text-text-muted">{application.full_name} · {application.application_number}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="label">Verification Level</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['identity', 'professional', 'premium'] as const).map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setModalData(d => ({ ...d, level: lvl }))}
                            className={`py-2.5 rounded-xl text-xs font-bold border transition-all capitalize
                              ${modalData.level === lvl
                                ? 'bg-primary text-white border-primary shadow-primary-glow'
                                : 'bg-neutral-50 text-text-secondary border-neutral-200 hover:border-primary/40'}`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>

                    {isCustomTrade && (
                      <div className="border border-gold-200 bg-gold-50/30 rounded-xl p-4 space-y-3">
                        <div className="flex gap-2 text-gold-800">
                          <AlertCircle size={16} className="text-gold-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-bold">Custom Trade Category Detected</p>
                            <p className="text-xs text-gold-700">The trade <strong className="text-text-primary">"{application.trade_category}"</strong> is not in the standard catalog.</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-text-secondary block">Handling Action</label>
                          <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-xs text-text-primary cursor-pointer">
                              <input
                                type="radio"
                                name="tradeAction"
                                checked={tradeAction === 'keep'}
                                onChange={() => setTradeAction('keep')}
                                className="text-primary focus:ring-primary"
                              />
                              Keep as custom trade
                            </label>
                            <label className="flex items-center gap-2 text-xs text-text-primary cursor-pointer">
                              <input
                                type="radio"
                                name="tradeAction"
                                checked={tradeAction === 'assign'}
                                onChange={() => setTradeAction('assign')}
                                className="text-primary focus:ring-primary"
                              />
                              Assign worker to an existing trade
                            </label>
                            <label className="flex items-center gap-2 text-xs text-text-primary cursor-pointer">
                              <input
                                type="radio"
                                name="tradeAction"
                                checked={tradeAction === 'adopt'}
                                onChange={() => setTradeAction('adopt')}
                                className="text-primary focus:ring-primary"
                              />
                              Adopt as a new standard trade
                            </label>
                          </div>
                        </div>

                        {tradeAction === 'assign' && (
                          <div className="space-y-2 pt-2 border-t border-gold-200/50">
                            <div>
                              <label className="text-xs font-semibold text-text-muted block mb-1">Select Standard Category</label>
                              <select
                                  className="input-field py-1.5 text-xs"
                                  value={selectedCategoryId}
                                  onChange={(e) => {
                                    setSelectedCategoryId(e.target.value);
                                    setSelectedAssignedTrade('');
                                  }}
                                >
                                <option value="">-- Choose Category --</option>
                                {categories.map((cat) => (
                                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                              </select>
                            </div>
                            {selectedCategoryId && (
                              <div>
                                <label className="text-xs font-semibold text-text-muted block mb-1">Select Standard Trade</label>
                                <select
                                  className="input-field py-1.5 text-xs"
                                  value={selectedAssignedTrade}
                                  onChange={(e) => setSelectedAssignedTrade(e.target.value)}
                                >
                                  <option value="">-- Choose Trade --</option>
                                  {categories
                                    .find((c) => c.id === selectedCategoryId)
                                    ?.subcategories.map((sub) => (
                                      <option key={sub.id} value={sub.name}>{sub.name}</option>
                                    ))}
                                </select>
                              </div>
                            )}
                          </div>
                        )}

                        {tradeAction === 'adopt' && (
                          <div className="space-y-2 pt-2 border-t border-gold-200/50">
                            <div>
                              <label className="text-xs font-semibold text-text-muted block mb-1">Adopt Under Category</label>
                              <select
                                className="input-field py-1.5 text-xs"
                                value={selectedCategoryId}
                                onChange={(e) => setSelectedCategoryId(e.target.value)}
                              >
                                <option value="">-- Choose Category --</option>
                                {categories.map((cat) => (
                                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="label">Admin Notes <span className="text-text-muted text-xs font-normal">(optional)</span></label>
                      <textarea
                        className="input-field h-24 resize-none"
                        placeholder="Notes for the record..."
                        value={modalData.notes}
                        onChange={e => setModalData(d => ({ ...d, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                </>
              )}

              {modal === 'reject' && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 rounded-xl bg-error-light flex items-center justify-center">
                      <XCircle size={22} className="text-error" />
                    </div>
                    <div>
                      <h3 className="font-bold text-text-primary">Reject Application</h3>
                      <p className="text-sm text-text-muted">{application.full_name} · {application.application_number}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="label">Reason <span className="text-error">*</span></label>
                      <select
                        className="input-field mb-2"
                        value={modalData.reason}
                        onChange={e => setModalData(d => ({ ...d, reason: e.target.value }))}
                      >
                        <option value="">Select a reason</option>
                        {REJECTION_REASONS.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                      <textarea
                        className="input-field h-20 resize-none"
                        placeholder="Additional context (optional)..."
                        value={modalData.notes}
                        onChange={e => setModalData(d => ({ ...d, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                </>
              )}

              {modal === 'more_info' && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 rounded-xl bg-gold-50 flex items-center justify-center">
                      <AlertCircle size={22} className="text-gold-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-text-primary">Request More Information</h3>
                      <p className="text-sm text-text-muted">{application.full_name}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="label">Message to Applicant <span className="text-error">*</span></label>
                      <textarea
                        className="input-field h-28 resize-none"
                        placeholder="Explain what additional documents or information you need..."
                        value={modalData.message}
                        onChange={e => setModalData(d => ({ ...d, message: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="label">Required Documents <span className="text-text-muted text-xs font-normal">(optional)</span></label>
                      <input
                        className="input-field"
                        placeholder="e.g. Clearer selfie with ID, Trade certificate"
                        value={modalData.docs}
                        onChange={e => setModalData(d => ({ ...d, docs: e.target.value }))}
                      />
                    </div>
                  </div>
                </>
              )}

              {actionError && (
                <div className="mt-4 p-3 bg-error-light border border-error/20 rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} className="text-error flex-shrink-0" />
                  <p className="text-sm text-error">{actionError}</p>
                </div>
              )}

              <div className="flex gap-3 mt-6 pt-4 border-t border-neutral-100">
                <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
                <button
                  onClick={handleAction}
                  disabled={
                    submitting ||
                    (modal === 'reject' && !modalData.reason) ||
                    (modal === 'more_info' && !modalData.message) ||
                    (modal === 'approve' && isCustomTrade && (
                      (tradeAction === 'assign' && !selectedAssignedTrade) ||
                      (tradeAction === 'adopt' && !selectedCategoryId)
                    ))
                  }
                  className={`flex-1 btn-primary justify-center
                    ${modal === 'reject' ? 'bg-error hover:bg-error-dark' :
                      modal === 'more_info' ? 'bg-gold-500 hover:bg-gold-600' : ''}`}
                >
                  {submitting ? (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  ) : modal === 'approve' ? 'Approve Application' :
                     modal === 'reject' ? 'Reject Application' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document preview lightbox */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="max-w-3xl w-full animate-fade-in" onClick={e => e.stopPropagation()}>
            <img
              src={previewUrl}
              alt="Document preview"
              className="w-full rounded-2xl shadow-warm-xl max-h-[80vh] object-contain"
            />
            <div className="flex items-center justify-between mt-3">
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors"
              >
                <ExternalLink size={14} />
                Open original
              </a>
              <button
                onClick={() => setPreviewUrl(null)}
                className="text-white/70 hover:text-white text-sm transition-colors"
              >
                Close (click outside)
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
