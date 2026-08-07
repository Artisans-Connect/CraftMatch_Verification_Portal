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

  const isSandbox = window.location.pathname.includes('/sandbox') || 
                    window.location.hash.includes('/sandbox') || 
                    window.location.search.includes('sandbox=true') || 
                    window.location.search.includes('sessionId=') && window.location.pathname.includes('/sandbox');

  useEffect(() => {
    // Session ID and reference can arrive via path query or hash query
    const searchParams = new URLSearchParams(window.location.search);
    let sId = searchParams.get('sessionId');
    let ref = searchParams.get('reference');

    if (!sId && !ref) {
      const hashParts = window.location.hash.split('?');
      if (hashParts.length > 1) {
        const hashParams = new URLSearchParams(hashParts[1]);
        sId = hashParams.get('sessionId');
        ref = hashParams.get('reference');
      }
    }
    
    setSessionId(sId);
    setReference(ref);

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
              authorization_url: session.status === 'completed' ? undefined : '#'
            },
            jobs: {
              title: session.job?.title || 'CraftMatch Service',
              description: session.negotiation?.description || 'Job Booking Escrow Deposit',
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
            window.location.href = `craftmatch://payment-success?reference=${reference}`;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [payment?.status, reference]);

  const handlePay = () => {
    if (isSandbox) {
      handleSimulateSuccess();
      return;
    }

    if (payment?.paystack_payload?.authorization_url) {
      window.location.href = payment.paystack_payload.authorization_url;
    } else {
      setError('Payment URL is missing. Please contact support.');
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Securing checkout gateway...</p>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100">
          <div className="text-rose-500 text-5xl mb-4">⚠</div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Checkout Error</h1>
          <p className="text-slate-600 mb-6">{error || 'An unexpected error occurred.'}</p>
          <button
            onClick={() => window.close()}
            className="w-full bg-slate-800 text-white py-3 rounded-xl font-semibold hover:bg-slate-700 transition"
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100">
        <div className={`p-6 text-white text-center ${isSandbox ? 'bg-amber-600' : 'bg-teal-600'}`}>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {isSandbox ? 'CraftMatch Sandbox checkout' : 'CraftMatch Checkout'}
          </h1>
          <p className={`${isSandbox ? 'text-amber-100' : 'text-teal-100'} text-sm mt-1`}>
            {isSandbox ? 'Simulation Payment Mode (No Real Money)' : 'Ghana Mobile Money & Card Payment Gateway'}
          </p>
        </div>

        <div className="p-6">
          <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Job Request Description</span>
            <h2 className="text-lg font-bold text-slate-800 mt-1">{payment.jobs?.title || 'Job Service'}</h2>
            <p className="text-slate-600 text-sm mt-2 line-clamp-2">{payment.jobs?.description || 'Payment for escrow services.'}</p>
            {payment.jobs?.worker?.full_name && (
              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold">Artisan:</span>
                <span className="font-medium text-slate-700">{payment.jobs.worker.full_name}</span>
              </div>
            )}
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500 text-sm">Payment Reference</span>
              <span className="text-slate-800 font-mono text-sm">{payment.reference}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500 text-sm">Transaction Status</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {isCompleted ? 'Completed' : 'Pending Payment'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100 text-sm">
              <span className="text-slate-500">Agreed Price</span>
              <span className="text-slate-700 font-medium">GHS {agreedPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100 text-sm">
              <span className="text-slate-500">Platform Fee (10%)</span>
              <span className="text-slate-700 font-medium">GHS {platformFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-800 font-bold text-base">Total Amount (GHS)</span>
              <span className={`text-2xl font-black ${isSandbox ? 'text-amber-600' : 'text-teal-600'}`}>
                GHS {totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {isCompleted ? (
            <div className="space-y-4 text-center">
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-sm font-medium border border-emerald-100">
                ✓ {isSandbox ? 'Sandbox Simulation Successful!' : 'Payment completed successfully! Funds are held securely in escrow.'}
              </div>
              <p className="text-slate-600 text-xs mt-4">
                Redirecting you back to the CraftMatch mobile app in <span className={`font-bold ${isSandbox ? 'text-amber-600' : 'text-teal-600'}`}>{countdown}s</span>...
              </p>
              <a
                href={`craftmatch://payment-success?reference=${reference}`}
                className={`w-full text-white py-3.5 rounded-xl font-semibold transition block text-center ${isSandbox ? 'bg-amber-600 hover:bg-amber-700' : 'bg-teal-600 hover:bg-teal-700'}`}
              >
                Return to App Now
              </a>
            </div>
          ) : isSandbox ? (
            <div className="space-y-3">
              <button
                onClick={handleSimulateSuccess}
                disabled={simulating}
                className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 text-center block text-base"
              >
                {simulating ? 'Simulating success...' : `Simulate Successful Payment (GHS ${totalAmount.toFixed(2)})`}
              </button>
              <button
                onClick={handleSimulateFailure}
                className="w-full bg-rose-600 text-white py-4 rounded-xl font-bold hover:bg-rose-700 transition shadow-lg shadow-rose-600/20 text-center block text-base"
              >
                Simulate Failed Payment
              </button>
            </div>
          ) : (
            <button
              onClick={handlePay}
              className="w-full bg-teal-600 text-white py-4 rounded-xl font-bold hover:bg-teal-700 transition shadow-lg shadow-teal-600/20 text-center block text-base"
            >
              Continue to Pay GHS {totalAmount.toFixed(2)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
