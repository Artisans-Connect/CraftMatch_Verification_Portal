export type VerificationStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'more_info_requested';

export type VerificationLevel = 'identity' | 'professional' | 'premium';

export type DocumentType =
  | 'id_front'
  | 'id_back'
  | 'selfie'
  | 'certification'
  | 'training'
  | 'portfolio';

export type AuditAction =
  | 'submitted'
  | 'reviewed'
  | 'approved'
  | 'rejected'
  | 'more_info_requested'
  | 'documents_uploaded'
  | 'status_changed';

export interface WorkerVerification {
  id: string;
  worker_id: string;
  application_number: string;
  status: VerificationStatus;
  verification_level: VerificationLevel;
  full_name: string;
  phone_number: string;
  email: string;
  date_of_birth: string | null;
  gender: string;
  trade_category: string;
  years_of_experience: number;
  business_name: string;
  current_region: string;
  current_city: string;
  confidence_score: number;
  fraud_indicators: string[];
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string;
  admin_notes: string;
  more_info_message: string;
  created_at: string;
  updated_at: string;
}

export interface VerificationDocument {
  id: string;
  verification_id: string;
  worker_id: string;
  document_type: DocumentType;
  storage_path: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

export interface VerificationReference {
  id: string;
  verification_id: string;
  worker_id: string;
  reference_name: string;
  phone_number: string;
  relationship: string;
  created_at: string;
}

export interface VerificationAuditLog {
  id: string;
  verification_id: string;
  admin_id: string | null;
  admin_name: string;
  action: AuditAction;
  notes: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface AdminSubcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  base_fee?: number | null;
  created_at: string;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  icon_name: string | null;
  color_hex: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  base_fee?: number | null;
  created_at: string;
  subcategories: AdminSubcategory[];
}

export interface AdminAccountWorker {
  id: string;
  is_available: boolean;
  is_verified: boolean;
  rating: number;
  total_jobs: number;
  skills: string[];
  service_areas: string[];
}

export interface AdminAccountAuthUser {
  email: string | null;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

export interface AdminAccount {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string | null;
  signup_type: string | null;
  last_active_mode: string | null;
  avatar_url: string | null;
  account_status: 'active' | 'suspended' | 'warned' | string;
  suspended_at: string | null;
  suspension_reason: string | null;
  created_at: string;
  updated_at: string;
  workers: AdminAccountWorker | AdminAccountWorker[] | null;
  auth_user: AdminAccountAuthUser | null;
  verification: Pick<WorkerVerification, 'status' | 'verification_level' | 'application_number' | 'submitted_at'> | null;
}

export interface AdminAccountDetail {
  profile: AdminAccount & {
    workers?: AdminAccountWorker | AdminAccountWorker[] | null;
  };
  auth_user: AdminAccountAuthUser & { id: string } | null;
  verifications: WorkerVerification[];
  recent_jobs: Array<{
    id: string;
    title: string;
    status: string;
    created_at: string;
    updated_at: string;
    categories?: { name: string } | null;
  }>;
  recent_applications: Array<{
    id: string;
    job_id: string;
    status: string;
    created_at: string;
    jobs?: { title: string; status: string } | null;
  }>;
}

// Form data types
export interface PersonalInfoData {
  full_name: string;
  phone_number: string;
  email: string;
  date_of_birth: string;
  gender: string;
}

export interface ProfessionalInfoData {
  trade_category: string;
  years_of_experience: number;
  business_name: string;
  current_region: string;
  current_city: string;
}

export interface ReferenceData {
  reference_name: string;
  phone_number: string;
  relationship: string;
}

export interface ApplicationFormData {
  personal: PersonalInfoData;
  professional: ProfessionalInfoData;
  references: ReferenceData[];
  documents: {
    id_front: File | null;
    id_back: File | null;
    selfie: File | null;
    certifications: File[];
    training: File[];
    portfolio: File[];
  };
  agreedToTerms: boolean;
}

export type ReportStatus = 'PENDING' | 'UNDER_REVIEW' | 'NEEDS_EVIDENCE' | 'ACTION_TAKEN' | 'DISMISSED' | 'RESOLVED';
export type ReportPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ModerationAction = 'NONE' | 'WARNING_ISSUED' | 'TEMPORARY_SUSPENSION' | 'PERMANENT_BAN' | 'DISMISSED' | 'EVIDENCE_REQUESTED';

export interface ReportAuditLog {
  id: string;
  report_id: string;
  actor_id: string | null;
  actor_role: string;
  action: string;
  previous_status: string | null;
  new_status: string | null;
  notes: string | null;
  created_at: string;
  actor?: { full_name: string } | null;
}

export interface RepeatOffenderRisk {
  reported_user_id: string;
  total_reports_against: number;
  recent_reports_90d: number;
  confirmed_violations: number;
  emergency_reports_count: number;
  reporter_false_report_ratio: number;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  risk_flags: string[];
  requires_manual_moderator_review: boolean;
}

export interface AdminReport {
  id: string;
  ticket_number: string;
  category: string;
  description: string;
  attachments: string[];
  priority: ReportPriority;
  status: ReportStatus;
  is_emergency: boolean;
  action_taken: ModerationAction;
  resolution_reason?: string | null;
  moderation_notes?: string | null;
  assigned_moderator_id?: string | null;
  context_metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  reporter?: { id: string; full_name: string; phone?: string; avatar_url?: string; created_at?: string } | null;
  reported?: {
    id: string;
    full_name: string;
    phone?: string;
    avatar_url?: string;
    account_status?: string;
    created_at?: string;
    workers?: { is_verified: boolean; rating: number; total_jobs: number } | null;
  } | null;
  booking?: { id: string; title: string; status: string; total_amount: number; address: string; scheduled_time: string } | null;
  audit_logs?: ReportAuditLog[];
  repeat_offender_risk?: RepeatOffenderRisk | null;
}

export type ReleasePlatform = 'android' | 'ios' | 'windows' | 'macos' | 'web';

export interface AppReleaseLink {
  platform: ReleasePlatform;
  label: string;
  href: string;
  version?: string;
  fileSize?: string;
  fileSizeBytes?: number;
  sha256?: string;
  minRequirement?: string;
  available: boolean;
  external?: boolean;
}

export interface AppReleaseResponse {
  appName: string;
  latestVersion: string;
  updatedAt: string;
  releaseNotes?: string;
  links: AppReleaseLink[];
}

export interface BuildTriggerParams {
  version?: string;
  releaseNotes?: string;
  releaseType?: 'release' | 'debug';
}

export interface BuildStatusResponse {
  status: 'idle' | 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | 'timed_out' | null;
  runId?: number;
  runUrl?: string;
  runName?: string;
  version?: string;
  startedAt?: string;
  updatedAt?: string;
  durationSeconds?: number;
  message?: string;
}

