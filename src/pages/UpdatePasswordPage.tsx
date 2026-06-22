import { useState, useEffect, FormEvent } from 'react';
import { KeyRound, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Handle PKCE code exchange if present in URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then((response: any) => {
        if (response.error) setError(response.error.message);
      });
    } else {
      // Handle implicit flow hash errors
      const hash = window.location.hash;
      if (hash.includes('error=')) {
        const hashParams = new URLSearchParams(hash.replace('#', '?'));
        const errDesc = hashParams.get('error_description');
        if (errDesc) setError(errDesc.replace(/\+/g, ' '));
      }
    }

    // Verify session exists
    supabase.auth.getSession().then((response: any) => {
      if (!response.data?.session && !code && !window.location.hash.includes('access_token')) {
        setError('Your password reset link is invalid or has expired. Please request a new one from the app.');
      }
    });
  }, []);
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred while updating your password.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-surface-base flex flex-col items-center justify-center p-4">
        <div 
          className="max-w-md w-full text-center p-8 bg-white rounded-3xl border border-neutral-100" 
          style={{ boxShadow: '0 20px 50px rgba(44,36,24,0.1)' }}
        >
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600 w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">CraftMatch</h1>
          <h2 className="text-xl font-semibold text-text-primary mb-4">Password Updated!</h2>
          <p className="text-lg text-text-secondary mb-8">
            Your password has been successfully changed.
          </p>
          <p className="text-sm text-text-muted bg-neutral-50 p-4 rounded-xl mb-6">
            You can now return to the CraftMatch app and log in with your new password. You may safely close this tab.
          </p>
          <a
            href="craftmatch://login"
            className="inline-flex w-full py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-primary/30 transition-all items-center justify-center"
          >
            Return to Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base flex flex-col items-center justify-center p-4">
      <div 
        className="max-w-md w-full p-8 bg-white rounded-3xl border border-neutral-100" 
        style={{ boxShadow: '0 20px 50px rgba(44,36,24,0.1)' }}
      >
        <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mb-6">
          <KeyRound className="text-primary-dark w-8 h-8" />
        </div>
        <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-1">CraftMatch</h2>
        <h1 className="text-3xl font-bold text-text-primary mb-2">Create new password</h1>
        <p className="text-text-secondary mb-8">
          Your new password must be different from previous used passwords.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all pr-12"
                  placeholder="Enter your new password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                placeholder="Confirm your new password"
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
