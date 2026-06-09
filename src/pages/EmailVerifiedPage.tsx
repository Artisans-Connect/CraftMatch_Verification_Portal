import { CheckCircle } from 'lucide-react';

export function EmailVerifiedPage() {
  return (
    <div className="min-h-screen bg-surface-base flex flex-col items-center justify-center p-4">
      <div 
        className="max-w-md w-full text-center p-8 bg-white rounded-3xl border border-neutral-100" 
        style={{ boxShadow: '0 20px 50px rgba(44,36,24,0.1)' }}
      >
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="text-green-600 w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-4">Email Verified!</h1>
        <p className="text-lg text-text-secondary mb-8">
          Your email has been successfully verified. 
        </p>
        <p className="text-sm text-text-muted bg-neutral-50 p-4 rounded-xl">
          You can now return to the Artisans app to continue. You may safely close this tab.
        </p>
      </div>
    </div>
  );
}
