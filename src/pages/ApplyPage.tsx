import { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle,
  User,
  Briefcase,
  FileImage,
  Award,
  Users,
  ClipboardCheck,
  AlertCircle,
} from 'lucide-react';
import { PublicLayout } from '../components/layout/PublicLayout';
import { StepIndicator } from '../components/ui/StepIndicator';
import { FileUpload } from '../components/ui/FileUpload';
import { TRADE_CATEGORIES, GHANA_REGIONS } from '../lib/constants';
import { apiPost } from '../lib/api';
import type {
  PersonalInfoData,
  ProfessionalInfoData,
  ReferenceData,
  ApplicationFormData,
  WorkerVerification,
} from '../types';

interface ApplyPageProps {
  onNavigate: (page: string) => void;
  handoffCode?: string;
  handoffContext?: Record<string, unknown> | null;
}

const STEPS = [
  'Personal Info',
  'Identity',
  'Professional',
  'Credentials',
  'References',
  'Review & Submit',
];

const emptyForm: ApplicationFormData = {
  personal: { full_name: '', phone_number: '', email: '', date_of_birth: '', gender: '' },
  professional: { trade_category: '', years_of_experience: 0, business_name: '', current_region: '', current_city: '' },
  references: [{ reference_name: '', phone_number: '', relationship: '' }],
  documents: { id_front: null, id_back: null, selfie: null, certifications: [], training: [], portfolio: [] },
  agreedToTerms: false,
};

function computeConfidenceScore(form: ApplicationFormData): number {
  let score = 30; // base
  if (form.documents.id_front) score += 15;
  if (form.documents.id_back) score += 10;
  if (form.documents.selfie) score += 15;
  if (form.documents.certifications.length > 0) score += 10;
  if (form.documents.portfolio.length > 0) score += 5;
  if (form.references.filter(r => r.reference_name && r.phone_number).length >= 2) score += 10;
  if (form.professional.years_of_experience >= 5) score += 5;
  return Math.min(score, 100);
}

function computeFraudIndicators(form: ApplicationFormData): string[] {
  const indicators: string[] = [];
  if (!form.documents.selfie) indicators.push('missing_selfie');
  if (!form.documents.id_front || !form.documents.id_back) indicators.push('low_quality_id');
  if (form.references.filter(r => r.reference_name && r.phone_number).length === 0) indicators.push('no_references');
  return indicators;
}

async function toBase64(file: File): Promise<string> {
  const reader = new FileReader();
  const result = await new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve(String(reader.result ?? '').split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
  return result;
}

export function ApplyPage({ onNavigate, handoffContext, handoffCode }: ApplyPageProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ApplicationFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [applicationNumber, setApplicationNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const existingVerification = handoffContext?.verification as WorkerVerification | null | undefined;
  const isMoreInfoResubmission = existingVerification?.status === 'more_info_requested';
  const isBlockedExistingApplication = Boolean(
    existingVerification &&
      existingVerification.status !== 'more_info_requested' &&
      existingVerification.status !== 'rejected',
  );

  useEffect(() => {
    if (!handoffContext) return;
    const profile = handoffContext.profile as Record<string, unknown> | null;
    const worker = handoffContext.worker as Record<string, unknown> | null;
    const verification = handoffContext.verification as WorkerVerification | null;
    setForm(prev => ({
      ...prev,
      personal: {
        ...prev.personal,
        full_name: verification?.full_name || (profile?.full_name as string | undefined) || prev.personal.full_name,
        phone_number: verification?.phone_number || (profile?.phone as string | undefined) || prev.personal.phone_number,
        email: verification?.email || (profile?.email as string | undefined) || prev.personal.email,
        date_of_birth: verification?.date_of_birth || prev.personal.date_of_birth,
        gender: verification?.gender || prev.personal.gender,
      },
      professional: {
        ...prev.professional,
        trade_category:
          verification?.trade_category ||
          (Array.isArray(worker?.skills) && worker?.skills[0]
            ? String(worker.skills[0])
            : prev.professional.trade_category),
        years_of_experience: verification?.years_of_experience ?? prev.professional.years_of_experience,
        business_name: verification?.business_name || prev.professional.business_name,
        current_region: verification?.current_region || prev.professional.current_region,
        current_city:
          verification?.current_city ||
          (profile?.location_label as string | undefined) ||
          prev.professional.current_city,
      },
    }));
  }, [handoffContext]);

  const updatePersonal = (field: keyof PersonalInfoData, value: string) => {
    setForm(f => ({ ...f, personal: { ...f.personal, [field]: value } }));
  };

  const updateProfessional = (field: keyof ProfessionalInfoData, value: string | number) => {
    setForm(f => ({ ...f, professional: { ...f.professional, [field]: value } }));
  };

  const updateReference = (index: number, field: keyof ReferenceData, value: string) => {
    const refs = [...form.references];
    refs[index] = { ...refs[index], [field]: value };
    setForm(f => ({ ...f, references: refs }));
  };

  const addReference = () => {
    setForm(f => ({ ...f, references: [...f.references, { reference_name: '', phone_number: '', relationship: '' }] }));
  };

  const removeReference = (index: number) => {
    setForm(f => ({ ...f, references: f.references.filter((_, i) => i !== index) }));
  };

  const validateStep = (): boolean => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!form.personal.full_name.trim()) errs.full_name = 'Full name is required';
      if (!form.personal.phone_number.trim()) errs.phone_number = 'Phone number is required';
      if (!form.personal.email.trim()) errs.email = 'Email is required';
      if (!form.personal.date_of_birth) errs.date_of_birth = 'Date of birth is required';
      if (!form.personal.gender) errs.gender = 'Gender is required';
    }
    if (step === 2) {
      if (!form.documents.id_front) errs.id_front = 'ID front is required';
      if (!form.documents.id_back) errs.id_back = 'ID back is required';
    }
    if (step === 3) {
      if (!form.professional.trade_category) errs.trade_category = 'Trade category is required';
      if (!form.professional.current_region) errs.current_region = 'Region is required';
      if (!form.professional.current_city.trim()) errs.current_city = 'City is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setStep(s => Math.min(s + 1, 6));
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!form.agreedToTerms) {
      setErrors({ terms: 'You must confirm the information is accurate.' });
      return;
    }
    if (!handoffCode) {
      setErrors({ submit: 'Open verification from your worker profile before submitting.' });
      return;
    }
    setSubmitting(true);
    setUploadProgress(isMoreInfoResubmission ? 'Updating application...' : 'Creating application...');
    try {
      const refs = form.references.filter(r => r.reference_name && r.phone_number);
      const application = await apiPost<{ id: string; application_number: string }>(
        '/verification/me/application',
        {
          handoff_code: handoffCode,
          verification_level: 'identity',
          full_name: form.personal.full_name,
          phone_number: form.personal.phone_number,
          email: form.personal.email,
          date_of_birth: form.personal.date_of_birth || null,
          gender: form.personal.gender,
          trade_category: form.professional.trade_category,
          years_of_experience: form.professional.years_of_experience,
          business_name: form.professional.business_name,
          current_region: form.professional.current_region,
          current_city: form.professional.current_city,
          confidence_score: computeConfidenceScore(form),
          fraud_indicators: computeFraudIndicators(form),
          references: refs,
        },
      );

      const toUpload: { file: File; type: string }[] = [];
      if (form.documents.id_front) toUpload.push({ file: form.documents.id_front, type: 'id_front' });
      if (form.documents.id_back) toUpload.push({ file: form.documents.id_back, type: 'id_back' });
      if (form.documents.selfie) toUpload.push({ file: form.documents.selfie, type: 'selfie' });
      form.documents.certifications.forEach(f => toUpload.push({ file: f, type: 'certification' }));
      form.documents.training.forEach(f => toUpload.push({ file: f, type: 'training' }));
      form.documents.portfolio.forEach(f => toUpload.push({ file: f, type: 'portfolio' }));

      if (toUpload.length > 0) {
        setUploadProgress('Uploading documents...');
        await apiPost('/verification/me/application/documents', {
          handoff_code: handoffCode,
          verification_id: application.id,
          files: await Promise.all(
            toUpload.map(async ({ file, type }) => ({
              document_type: type,
              file_name: file.name,
              mime_type: file.type || 'application/octet-stream',
              size: file.size,
              content_base64: await toBase64(file),
            })),
          ),
        });
      }

      setApplicationNumber(application.application_number);
      setSubmitted(true);
    } catch (error) {
      console.error(error);
      setErrors({ submit: 'Submission failed. Please try again.' });
    } finally {
      setSubmitting(false);
      setUploadProgress('');
    }
  };

  const handleTrackSubmittedApplication = () => {
    const params = new URLSearchParams();
    if (applicationNumber) params.set('application_number', applicationNumber);
    const query = params.toString();
    window.history.replaceState(null, '', `${query ? `?${query}` : ''}#/status`);
    onNavigate('status');
  };

  if (submitted) {
    return (
      <PublicLayout onNavigate={onNavigate}>
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
          <div className="max-w-lg w-full text-center animate-slide-up">
            <div className="w-20 h-20 rounded-3xl bg-success-light flex items-center justify-center mx-auto mb-6 shadow-warm-md">
              <CheckCircle size={36} className="text-success" />
            </div>
            <h1 className="text-display-sm font-bold text-text-primary mb-3">
              {isMoreInfoResubmission ? 'Application Updated!' : 'Application Submitted!'}
            </h1>
            <p className="text-text-secondary mb-6">
              {isMoreInfoResubmission
                ? 'Your updated verification details have been received. Our team will review them shortly.'
                : 'Your verification application has been received. Our team will review it within 48 hours.'}
            </p>
            <div className="card p-5 mb-8">
              <p className="text-sm text-text-muted mb-1">Your Application Number</p>
              <p className="text-2xl font-bold text-primary font-mono">{applicationNumber}</p>
              <p className="text-xs text-text-muted mt-2">Save this number to track your application status</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleTrackSubmittedApplication}
                className="btn-primary"
              >
                Track My Application
                <ArrowRight size={18} />
              </button>
              <button onClick={() => onNavigate('home')} className="btn-secondary">
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (isBlockedExistingApplication && existingVerification) {
    return (
      <PublicLayout onNavigate={onNavigate}>
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-16">
          <div className="card p-6 text-center animate-slide-up">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-5">
              <ClipboardCheck size={28} className="text-primary" />
            </div>
            <h1 className="text-xl font-bold text-text-primary mb-2">
              {existingVerification.status === 'approved'
                ? 'Verification Approved'
                : 'Application Already Submitted'}
            </h1>
            <p className="text-sm text-text-secondary mb-5">
              {existingVerification.status === 'approved'
                ? 'Your worker profile has already been verified.'
                : 'Your application is already with the verification team. You can track it from the status page.'}
            </p>
            <div className="card p-4 mb-5 bg-neutral-50 shadow-none">
              <p className="text-xs text-text-muted mb-1">Application Number</p>
              <p className="font-mono font-bold text-primary">{existingVerification.application_number}</p>
            </div>
            <button
              onClick={() => {
                const params = new URLSearchParams();
                params.set('application_number', existingVerification.application_number);
                window.history.replaceState(null, '', `?${params.toString()}#/status`);
                onNavigate('status');
              }}
              className="btn-primary mx-auto"
            >
              Track Application
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout onNavigate={onNavigate}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-display-sm font-bold text-text-primary mb-2">
            {isMoreInfoResubmission ? 'Update Verification Application' : 'Verification Application'}
          </h1>
          <p className="text-text-secondary">
            {isMoreInfoResubmission
              ? 'Update the requested details and upload any replacement documents.'
              : 'Complete all steps to apply for official artisan verification.'}
          </p>
        </div>

        {isMoreInfoResubmission && (
          <div className="card p-4 mb-6 border-l-4 border-gold-500 bg-gold-50/60">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-gold-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-text-primary">More information requested</p>
                <p className="text-sm text-text-secondary mt-1">
                  {existingVerification?.more_info_message ||
                    existingVerification?.admin_notes ||
                    'The verification team needs updated details or documents before continuing.'}
                </p>
                {existingVerification?.application_number && (
                  <p className="text-xs text-text-muted mt-2 font-mono">
                    {existingVerification.application_number}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <StepIndicator steps={STEPS} currentStep={step} />

        <div className="card p-6 sm:p-8 mt-8 animate-fade-in">
          {/* Step 1: Personal */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <User size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Personal Information</h2>
                  <p className="text-sm text-text-muted">Tell us about yourself</p>
                </div>
              </div>
              <div>
                <label className="label">Full Name <span className="text-error">*</span></label>
                <input className="input-field" placeholder="e.g. Kwame Asante" value={form.personal.full_name}
                  onChange={e => updatePersonal('full_name', e.target.value)} />
                {errors.full_name && <p className="text-xs text-error mt-1">{errors.full_name}</p>}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Phone Number <span className="text-error">*</span></label>
                  <input className="input-field" placeholder="+233 24 123 4567" value={form.personal.phone_number}
                    onChange={e => updatePersonal('phone_number', e.target.value)} />
                  {errors.phone_number && <p className="text-xs text-error mt-1">{errors.phone_number}</p>}
                </div>
                <div>
                  <label className="label">Email Address <span className="text-error">*</span></label>
                  <input type="email" className="input-field" placeholder="you@example.com" value={form.personal.email}
                    onChange={e => updatePersonal('email', e.target.value)} />
                  {errors.email && <p className="text-xs text-error mt-1">{errors.email}</p>}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Date of Birth <span className="text-error">*</span></label>
                  <input type="date" className="input-field" value={form.personal.date_of_birth}
                    onChange={e => updatePersonal('date_of_birth', e.target.value)} />
                  {errors.date_of_birth && <p className="text-xs text-error mt-1">{errors.date_of_birth}</p>}
                </div>
                <div>
                  <label className="label">Gender <span className="text-error">*</span></label>
                  <select className="input-field" value={form.personal.gender} onChange={e => updatePersonal('gender', e.target.value)}>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && <p className="text-xs text-error mt-1">{errors.gender}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Identity */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <FileImage size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Identity Verification</h2>
                  <p className="text-sm text-text-muted">Upload your government-issued ID and a selfie</p>
                </div>
              </div>
              <FileUpload
                label="Government ID Front"
                required
                onFilesChange={(f) => setForm(prev => ({ ...prev, documents: { ...prev.documents, id_front: f[0] || null } }))}
                files={form.documents.id_front ? [form.documents.id_front] : []}
                hint="Clear photo of the front of your Ghana Card, Passport, or Voter ID"
              />
              {errors.id_front && <p className="text-xs text-error">{errors.id_front}</p>}
              <FileUpload
                label="Government ID Back"
                required
                onFilesChange={(f) => setForm(prev => ({ ...prev, documents: { ...prev.documents, id_back: f[0] || null } }))}
                files={form.documents.id_back ? [form.documents.id_back] : []}
                hint="Clear photo of the back of your ID"
              />
              {errors.id_back && <p className="text-xs text-error">{errors.id_back}</p>}
              <FileUpload
                label="Selfie Photo"
                onFilesChange={(f) => setForm(prev => ({ ...prev, documents: { ...prev.documents, selfie: f[0] || null } }))}
                files={form.documents.selfie ? [form.documents.selfie] : []}
                hint="A clear photo of your face. Make sure there's good lighting."
              />
            </div>
          )}

          {/* Step 3: Professional */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Briefcase size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Professional Information</h2>
                  <p className="text-sm text-text-muted">Tell us about your trade</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Trade Category <span className="text-error">*</span></label>
                  <select className="input-field" value={form.professional.trade_category}
                    onChange={e => updateProfessional('trade_category', e.target.value)}>
                    <option value="">Select trade</option>
                    {TRADE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.trade_category && <p className="text-xs text-error mt-1">{errors.trade_category}</p>}
                </div>
                <div>
                  <label className="label">Years of Experience</label>
                  <input type="number" min="0" max="50" className="input-field"
                    value={form.professional.years_of_experience || ''}
                    onChange={e => updateProfessional('years_of_experience', parseInt(e.target.value) || 0)} />
                </div>
              </div>
              <div>
                <label className="label">Business Name <span className="text-text-muted text-xs font-normal">(optional)</span></label>
                <input className="input-field" placeholder="e.g. Asante Electrical Works"
                  value={form.professional.business_name}
                  onChange={e => updateProfessional('business_name', e.target.value)} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Region <span className="text-error">*</span></label>
                  <select className="input-field" value={form.professional.current_region}
                    onChange={e => updateProfessional('current_region', e.target.value)}>
                    <option value="">Select region</option>
                    {GHANA_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {errors.current_region && <p className="text-xs text-error mt-1">{errors.current_region}</p>}
                </div>
                <div>
                  <label className="label">City <span className="text-error">*</span></label>
                  <input className="input-field" placeholder="e.g. Accra"
                    value={form.professional.current_city}
                    onChange={e => updateProfessional('current_city', e.target.value)} />
                  {errors.current_city && <p className="text-xs text-error mt-1">{errors.current_city}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Credentials */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Award size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Skills & Credentials</h2>
                  <p className="text-sm text-text-muted">All fields are optional but improve your score</p>
                </div>
              </div>
              <div className="bg-gold-50 border border-gold-200 rounded-xl p-4 flex gap-3">
                <Award size={20} className="text-gold-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gold-800">Boost your confidence score</p>
                  <p className="text-xs text-gold-700 mt-0.5">Adding certifications and portfolio increases your approval chances significantly.</p>
                </div>
              </div>
              <FileUpload label="Certifications" multiple
                onFilesChange={(f) => setForm(prev => ({ ...prev, documents: { ...prev.documents, certifications: f } }))}
                files={form.documents.certifications}
                hint="Trade certificates, NVTI certificates, or other relevant qualifications" />
              <FileUpload label="Training Documents" multiple
                onFilesChange={(f) => setForm(prev => ({ ...prev, documents: { ...prev.documents, training: f } }))}
                files={form.documents.training}
                hint="Training completion letters or workshop attendance" />
              <FileUpload label="Portfolio Images" multiple
                onFilesChange={(f) => setForm(prev => ({ ...prev, documents: { ...prev.documents, portfolio: f } }))}
                files={form.documents.portfolio}
                hint="Photos of your recent work (up to 5 images)" />
            </div>
          )}

          {/* Step 5: References */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Users size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Professional References</h2>
                  <p className="text-sm text-text-muted">Add people who can vouch for your work</p>
                </div>
              </div>
              {form.references.map((ref, index) => (
                <div key={index} className="p-4 border border-neutral-100 rounded-xl bg-neutral-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-text-primary">Reference {index + 1}</span>
                    {index > 0 && (
                      <button onClick={() => removeReference(index)} className="text-error hover:text-error-dark">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label text-xs">Full Name</label>
                      <input className="input-field text-sm" placeholder="Reference name"
                        value={ref.reference_name} onChange={e => updateReference(index, 'reference_name', e.target.value)} />
                    </div>
                    <div>
                      <label className="label text-xs">Phone Number</label>
                      <input className="input-field text-sm" placeholder="+233 ..."
                        value={ref.phone_number} onChange={e => updateReference(index, 'phone_number', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="label text-xs">Relationship</label>
                    <select className="input-field text-sm" value={ref.relationship}
                      onChange={e => updateReference(index, 'relationship', e.target.value)}>
                      <option value="">Select relationship</option>
                      <option value="Former Employer">Former Employer</option>
                      <option value="Client">Client</option>
                      <option value="Colleague">Colleague</option>
                      <option value="Supervisor">Supervisor</option>
                      <option value="Mentor">Mentor</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              ))}
              {form.references.length < 3 && (
                <button onClick={addReference} className="btn-ghost w-full border border-dashed border-neutral-200 justify-center">
                  <Plus size={16} />
                  Add Another Reference
                </button>
              )}
            </div>
          )}

          {/* Step 6: Review */}
          {step === 6 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <ClipboardCheck size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Review & Submit</h2>
                  <p className="text-sm text-text-muted">Check your information before submitting</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-neutral-50 rounded-xl">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Personal Information</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-text-muted">Name:</span> <span className="font-medium text-text-primary">{form.personal.full_name || '—'}</span></div>
                    <div><span className="text-text-muted">Phone:</span> <span className="font-medium text-text-primary">{form.personal.phone_number || '—'}</span></div>
                    <div><span className="text-text-muted">Email:</span> <span className="font-medium text-text-primary">{form.personal.email || '—'}</span></div>
                    <div><span className="text-text-muted">Gender:</span> <span className="font-medium text-text-primary">{form.personal.gender || '—'}</span></div>
                  </div>
                </div>

                <div className="p-4 bg-neutral-50 rounded-xl">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Professional Information</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-text-muted">Trade:</span> <span className="font-medium text-text-primary">{form.professional.trade_category || '—'}</span></div>
                    <div><span className="text-text-muted">Experience:</span> <span className="font-medium text-text-primary">{form.professional.years_of_experience} years</span></div>
                    <div><span className="text-text-muted">Region:</span> <span className="font-medium text-text-primary">{form.professional.current_region || '—'}</span></div>
                    <div><span className="text-text-muted">City:</span> <span className="font-medium text-text-primary">{form.professional.current_city || '—'}</span></div>
                  </div>
                </div>

                <div className="p-4 bg-neutral-50 rounded-xl">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Documents</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className={`flex items-center gap-1.5 ${form.documents.id_front ? 'text-success-dark' : 'text-text-muted'}`}>
                      <CheckCircle size={14} /> ID Front
                    </div>
                    <div className={`flex items-center gap-1.5 ${form.documents.id_back ? 'text-success-dark' : 'text-text-muted'}`}>
                      <CheckCircle size={14} /> ID Back
                    </div>
                    <div className={`flex items-center gap-1.5 ${form.documents.selfie ? 'text-success-dark' : 'text-text-muted'}`}>
                      <CheckCircle size={14} /> Selfie
                    </div>
                    <div className={`flex items-center gap-1.5 ${form.documents.certifications.length > 0 ? 'text-success-dark' : 'text-text-muted'}`}>
                      <CheckCircle size={14} /> {form.documents.certifications.length} Certification(s)
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-neutral-50 rounded-xl">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">References</p>
                  <p className="text-sm text-text-primary">{form.references.filter(r => r.reference_name).length} reference(s) added</p>
                </div>
              </div>

              <div className="p-4 border border-neutral-100 rounded-xl">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.agreedToTerms}
                    onChange={e => setForm(f => ({ ...f, agreedToTerms: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 accent-primary"
                  />
                  <span className="text-sm text-text-secondary">
                    I confirm that all information provided in this application is accurate and complete.
                    I understand that providing false information may result in rejection or permanent ban.
                  </span>
                </label>
                {errors.terms && <p className="text-xs text-error mt-2">{errors.terms}</p>}
              </div>

              {errors.submit && (
                <div className="p-3 bg-error-light border border-error/20 rounded-xl">
                  <p className="text-sm text-error">{errors.submit}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-100">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            {step < 6 ? (
              <button onClick={handleNext} className="btn-primary">
                Continue
                <ArrowRight size={16} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary min-w-[160px]">
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    <span className="truncate text-sm">{uploadProgress || 'Submitting...'}</span>
                  </span>
                ) : (
                  <>Submit Application <ArrowRight size={16} /></>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
