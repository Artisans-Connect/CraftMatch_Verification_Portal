import React from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle, FileText, Shield } from 'lucide-react';
import type { VerificationStatus, VerificationLevel } from '../../types';

interface StatusBadgeProps {
  status: VerificationStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<VerificationStatus, { label: string; className: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', className: 'badge-pending', icon: Clock },
  under_review: { label: 'Under Review', className: 'badge-under-review', icon: FileText },
  approved: { label: 'Approved', className: 'badge-approved', icon: CheckCircle },
  rejected: { label: 'Rejected', className: 'badge-rejected', icon: XCircle },
  more_info_requested: { label: 'More Info Needed', className: 'badge-more-info', icon: AlertCircle },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <span className={`${config.className} ${size === 'sm' ? 'text-xs px-2 py-0.5' : ''}`}>
      <Icon size={size === 'sm' ? 12 : 14} />
      {config.label}
    </span>
  );
}

interface LevelBadgeProps {
  level: VerificationLevel;
}

const levelConfig: Record<VerificationLevel, { label: string; className: string }> = {
  identity: { label: 'Identity', className: 'bg-neutral-100 text-neutral-700' },
  professional: { label: 'Professional', className: 'bg-primary-50 text-primary-700' },
  premium: { label: 'Premium', className: 'bg-gold-100 text-gold-700' },
};

export function LevelBadge({ level }: LevelBadgeProps) {
  const config = levelConfig[level];
  return (
    <span className={`badge ${config.className}`}>
      <Shield size={12} />
      {config.label}
    </span>
  );
}

interface ConfidenceScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ConfidenceScore({ score, size = 'md' }: ConfidenceScoreProps) {
  const color = score >= 80 ? 'text-success-dark' : score >= 60 ? 'text-gold-600' : 'text-error';
  const bgColor = score >= 80 ? 'bg-success-light' : score >= 60 ? 'bg-gold-50' : 'bg-error-light';
  const barColor = score >= 80 ? 'bg-success' : score >= 60 ? 'bg-gold-500' : 'bg-error';

  if (size === 'sm') {
    return (
      <span className={`font-bold ${color}`}>{score}</span>
    );
  }

  return (
    <div className={`${bgColor} rounded-xl p-3`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-text-secondary">Confidence Score</span>
        <span className={`text-lg font-bold ${color}`}>{score}</span>
      </div>
      <div className="w-full bg-white/60 rounded-full h-2">
        <div
          className={`${barColor} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
