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
