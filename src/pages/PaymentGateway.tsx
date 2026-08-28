import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { apiGet, apiPost } from '../lib/api';

interface PaymentDetails {
  id: string;
  amount: number;
  status: string;
  reference: string;
  paystack_payload?: {
    authorization_url?: string;
  };
  jobs?: {
    title: string;
    description: string;
    worker?: {
      full_name: string;
    };
  };
}

export function PaymentGateway() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [simulating, setSimulating] = useState(false);
  const [platform, setPlatform] = useState<string | null>(null);
  const isSandbox = (
    window.location.pathname.includes('/sandbox') || 
    window.location.hash.includes('/sandbox') || 
    window.location.search.includes('sandbox=true') || 
    (window.location.search.includes('sessionId=') && window.location.pathname.includes('/sandbox'))
  );

  useEffect(() => {
    // Session ID and reference can arrive via path query or hash query
    const searchParams = new URLSearchParams(window.location.search);
    let sId = searchParams.get('sessionId');
    let ref = searchParams.get('reference');
    let plat = searchParams.get('platform');

    if (!sId && !ref) {
      const hashParts = window.location.hash.split('?');
      if (hashParts.length > 1) {
        const hashParams = new URLSearchParams(hashParts[1]);
        sId = hashParams.get('sessionId');
        ref = hashParams.get('reference');
        plat = hashParams.get('platform');
      }
    }
    
    setSessionId(sId);
    setReference(ref);
    setPlatform(plat);

    if (!sId && !ref) {
      setError('Invalid checkout session. No checkout session or reference was specified in the URL.');
      setLoading(false);
      return;
    }

    async function loadCheckoutData() {
      try {
        if (sId) {
          // Fetch the checkout session details via backend endpoint
          const session = await apiGet<any>(`/payments/checkout-session/${sId}`);
          
          setPayment({
            id: session.id,
            amount: Number(session.amount),
            status: session.status === 'completed' ? 'completed' : 'pending',
            reference: session.reference,
            paystack_payload: {
              authorization_url: session.authorization_url || undefined
            },
            jobs: {
              title: session.job?.title || 'CraftMatch Service',
              description: session.negotiation?.description || 'Job Booking Deposit',
              worker: session.job?.worker ? {
                full_name: session.job.worker.full_name
              } : undefined
            }
          });
          setReference(session.reference);
        } else if (ref) {
          // Legacy payment reference lookup directly from Supabase
          const { data, error: dbErr } = await supabase
            .from('payments')
            .select('id, amount, status, reference, paystack_payload, jobs(title, description, worker:profiles!jobs_worker_id_fkey(full_name))')
            .eq('reference', ref)
            .maybeSingle();

          if (dbErr) throw dbErr;
          if (!data) {
            setError('Payment record not found.');
            return;
          }

          setPayment(data as any);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load payment details.');
      } finally {
        setLoading(false);
      }
    }

    loadCheckoutData();

    // Subscribe to realtime updates for this payment reference
    let subscription: any = null;
    if (ref) {
      subscription = supabase
        .channel('payment-updates')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'payments', filter: `reference=eq.${ref}` },
          (payload) => {
            setPayment((prev) => prev ? { ...prev, status: payload.new.status } : null);
          }
        )
        .subscribe();
    } else if (sId) {
      subscription = supabase
        .channel('session-updates')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'checkout_sessions', filter: `id=eq.${sId}` },
          (payload) => {
            setPayment((prev) => prev ? { ...prev, status: payload.new.status } : null);
          }
        )
        .subscribe();
    }

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [sessionId, reference]);

  useEffect(() => {
    if (payment?.status === 'completed' && reference) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            if (platform === 'web') {
              const webUrl = import.meta.env.VITE_CRAFTMATCH_WEB_APP_URL || 'https://artisans-app-frontend.vercel.app';
              window.location.href = `${webUrl.replace(/\/$/, '')}/#/payment-success?reference=${reference}`;
            } else {
              window.location.href = `craftmatch://payment-success?reference=${reference}`;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [payment?.status, reference, platform]);

  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    if (isSandbox) {
      handleSimulateSuccess();
      return;
    }

    const existingUrl = payment?.paystack_payload?.authorization_url;
    if (existingUrl && existingUrl.startsWith('https://')) {
      window.location.href = existingUrl;
      return;
    }

    // No valid Paystack URL — request one from the backend
    if (!sessionId) {
      setError('Payment URL is missing. Please contact support.');
      return;
    }

    setPaying(true);
    try {
      const result = await apiPost<{ authorization_url: string }>(
        `/payments/checkout-session/${sessionId}/initialize-paystack`,
        { platform }
      );
      if (result.authorization_url) {
        window.location.href = result.authorization_url;
      } else {
        setError('Could not get payment URL. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize payment. Please try again.');
      setPaying(false);
    }
  };

  const handleSimulateSuccess = async () => {
    if (!reference || simulating) return;
    setSimulating(true);
    try {
      await apiPost('/payments/sandbox/callback', { reference });
      setPayment((prev) => prev ? { ...prev, status: 'completed' } : null);
    } catch (err: any) {
      setError(err.message || 'Sandbox simulation failed.');
    } finally {
      setSimulating(false);
    }
  };

  const handleSimulateFailure = () => {
    setError('Sandbox Payment Simulated Failure.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary font-medium">Securing checkout gateway...</p>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center p-4">
        <div className="bg-surface-card p-8 rounded-2xl shadow-warm-lg max-w-md w-full text-center border border-neutral-100">
          <div className="text-error text-5xl mb-4">⚠</div>
          <h1 className="text-xl font-bold text-text-primary mb-2">Checkout Error</h1>
          <p className="text-text-secondary mb-6">{error || 'An unexpected error occurred.'}</p>
          <button
            onClick={() => window.close()}
            className="w-full bg-text-primary text-white py-3 rounded-xl font-semibold hover:bg-text-secondary transition"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = payment.status === 'completed';
  const totalAmount = Number(payment.amount);
  const platformFee = totalAmount * 0.10;
  const agreedPrice = totalAmount - platformFee;

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center p-4">
      <div className="bg-surface-card rounded-3xl shadow-warm-lg max-w-md w-full overflow-hidden border border-neutral-100">
        <div className={`p-6 text-white text-center ${isSandbox ? 'bg-gold-600' : 'bg-primary'}`}>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {isSandbox ? 'CraftMatch Sandbox Checkout' : 'CraftMatch Checkout'}
          </h1>
          <p className={`${isSandbox ? 'text-gold-50' : 'text-primary-100'} text-sm mt-1`}>
            {isSandbox ? 'Simulation Payment Mode (No Real Money)' : 'Ghana Mobile Money & Card Payment Gateway'}
          </p>
        </div>

        <div className="p-6">
          <div className="bg-surface-base rounded-2xl p-5 mb-6 border border-neutral-100">
            <span className="text-xs text-text-muted font-bold uppercase tracking-wider">Job Request Description</span>
            <h2 className="text-lg font-bold text-text-primary mt-1">{payment.jobs?.title || 'Job Service'}</h2>
            <p className="text-text-secondary text-sm mt-2 line-clamp-2">{payment.jobs?.description || 'Payment for booking services.'}</p>
            {payment.jobs?.worker?.full_name && (
              <div className="mt-3 pt-3 border-t border-neutral-200 flex items-center justify-between text-xs text-text-muted">
                <span className="font-bold">Artisan:</span>
                <span className="font-medium text-text-primary">{payment.jobs.worker.full_name}</span>
              </div>
            )}
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center py-2 border-b border-neutral-100">
              <span className="text-text-muted text-sm">Payment Reference</span>
              <span className="text-text-primary font-mono text-sm">{payment.reference}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-neutral-100">
              <span className="text-text-muted text-sm">Transaction Status</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                isCompleted ? 'bg-success-light text-success' : 'bg-gold-100 text-gold-700'
              }`}>
                {isCompleted ? 'Completed' : 'Pending Payment'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-neutral-100 text-sm">
              <span className="text-text-muted">Agreed Price</span>
              <span className="text-text-secondary font-medium">GHS {agreedPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-neutral-100 text-sm">
              <span className="text-text-muted">Platform Fee (10%)</span>
              <span className="text-text-secondary font-medium">GHS {platformFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-text-primary font-bold text-base">Total Amount (GHS)</span>
              <span className={`text-2xl font-black ${isSandbox ? 'text-gold' : 'text-primary'}`}>
                GHS {totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {isCompleted ? (
            <div className="space-y-4 text-center">
              <div className="bg-success-light text-success-dark p-4 rounded-xl text-sm font-medium border border-success/20">
                ✓ {isSandbox ? 'Sandbox Simulation Successful!' : 'Payment completed successfully!'}
              </div>
              <p className="text-text-secondary text-xs mt-4">
                Redirecting you back to the CraftMatch {platform === 'web' ? 'website' : 'mobile app'} in <span className={`font-bold ${isSandbox ? 'text-gold' : 'text-primary'}`}>{countdown}s</span>...
              </p>
              <div className="flex flex-col space-y-3">
                <a
                  href={platform === 'web' 
                    ? `${(import.meta.env.VITE_CRAFTMATCH_WEB_APP_URL || 'https://artisans-app-frontend.vercel.app').replace(/\/$/, '')}/#/payment-success?reference=${reference}` 
                    : `craftmatch://payment-success?reference=${reference}`
                  }
                  className={`w-full text-white py-3.5 rounded-xl font-semibold transition block text-center ${isSandbox ? 'bg-gold-600 hover:bg-gold-700 shadow-lg shadow-gold-600/20' : 'bg-primary hover:bg-primary-600 shadow-lg shadow-primary/20'}`}
                >
                  {platform === 'web' ? 'Return to Website' : 'Return to Mobile App'}
                </a>
                <button
                  onClick={() => {
                    window.close();
                    const win = window.open('', '_self');
                    if (win) {
                      win.close();
                    }
                    setTimeout(() => {
                      alert("Browser security prevented closing this tab automatically. Please close it manually, or click the Return button above.");
                    }, 300);
                  }}
                  className="w-full bg-text-primary text-white py-3.5 rounded-xl font-semibold hover:bg-text-secondary transition"
                >
                  Close / Return
                </button>
              </div>
            </div>
          ) : isSandbox ? (
            <div className="space-y-3">
              <button
                onClick={handleSimulateSuccess}
                disabled={simulating}
                className="w-full bg-gold-600 text-white py-4 rounded-xl font-bold hover:bg-gold-700 transition shadow-lg shadow-gold-600/20 text-center block text-base"
              >
                {simulating ? 'Simulating success...' : `Simulate Local Sandbox Payment (GHS ${totalAmount.toFixed(2)})`}
              </button>
              <button
                onClick={handleSimulateFailure}
                className="w-full bg-error text-white py-4 rounded-xl font-bold hover:bg-error-dark transition shadow-lg shadow-error/20 text-center block text-base"
              >
                Simulate Failed Payment
              </button>
            </div>
          ) : (
            <button
              onClick={handlePay}
              disabled={paying}
              className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary-600 transition shadow-lg shadow-primary/20 text-center block text-base disabled:opacity-60"
            >
              {paying ? 'Connecting to payment gateway…' : `Continue to Pay GHS ${totalAmount.toFixed(2)}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
