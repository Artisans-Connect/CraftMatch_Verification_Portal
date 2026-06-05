import { AlertTriangle } from 'lucide-react';

interface FraudIndicatorProps {
  indicators: string[];
}

const indicatorLabels: Record<string, string> = {
  missing_selfie: 'Missing Selfie',
  low_quality_id: 'Low Quality ID',
  no_references: 'No References',
  duplicate_phone: 'Duplicate Phone',
  suspicious_documents: 'Suspicious Documents',
};

export function FraudIndicators({ indicators }: FraudIndicatorProps) {
  if (!indicators || indicators.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {indicators.map((indicator) => (
        <div
          key={indicator}
          className="flex items-center gap-2 px-2.5 py-1.5 bg-error-light rounded-lg"
        >
          <AlertTriangle size={12} className="text-error flex-shrink-0" />
          <span className="text-xs font-semibold text-error">
            {indicatorLabels[indicator] || indicator}
          </span>
        </div>
      ))}
    </div>
  );
}
