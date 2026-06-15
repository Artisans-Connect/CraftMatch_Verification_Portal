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
  account_status: 'active' | 'suspended';
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
