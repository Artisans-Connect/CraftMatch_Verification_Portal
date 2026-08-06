import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

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
  const [reference, setReference] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Reference can arrive via path query (?reference=...) or hash query (#/payment-gateway?reference=...)
    const searchParams = new URLSearchParams(window.location.search);
    let ref = searchParams.get('reference');
    if (!ref) {
      const hashParts = window.location.hash.split('?');
      if (hashParts.length > 1) {
        const hashParams = new URLSearchParams(hashParts[1]);
        ref = hashParams.get('reference');
      }
    }
    setReference(ref);

    if (!ref) {
      setError('Invalid reference. No payment reference was specified in the URL.');
      setLoading(false);
      return;
    }

    async function fetchPayment() {
      try {
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
      } catch (err: any) {
        setError(err.message || 'Failed to load payment details.');
      } finally {
        setLoading(false);
      }
    }

    fetchPayment();

    const subscription = supabase
      .channel('payment-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'payments', filter: `reference=eq.${ref}` },
        (payload) => {
          setPayment((prev) => prev ? { ...prev, status: payload.new.status } : null);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [reference]);

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
    if (payment?.paystack_payload?.authorization_url) {
      window.location.href = payment.paystack_payload.authorization_url;
    } else {
      setError('Payment URL is missing. Please contact support.');
    }
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
        <div className="bg-teal-600 p-6 text-white text-center">
          <h1 className="text-2xl font-extrabold tracking-tight">CraftMatch Checkout</h1>
          <p className="text-teal-100 text-sm mt-1">Ghana Mobile Money & Card Payment Gateway</p>
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
              <span className="text-2xl font-black text-teal-600">GHS {totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {isCompleted ? (
            <div className="space-y-4 text-center">
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-sm font-medium border border-emerald-100">
                ✓ Payment completed successfully! Funds are held securely in escrow.
              </div>
              <p className="text-slate-600 text-xs mt-4">
                Redirecting you back to the CraftMatch mobile app in <span className="font-bold text-teal-600">{countdown}s</span>...
              </p>
              <a
                href={`craftmatch://payment-success?reference=${reference}`}
                className="w-full bg-teal-600 text-white py-3.5 rounded-xl font-semibold hover:bg-teal-700 transition block text-center"
              >
                Return to App Now
              </a>
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
