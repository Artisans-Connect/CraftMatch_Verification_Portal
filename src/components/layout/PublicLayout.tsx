import React, { useRef, useState } from 'react';
import { Shield, ArrowLeft, Lock, Menu, X } from 'lucide-react';

interface PublicLayoutProps {
  children: React.ReactNode;
  showBack?: boolean;
  backLabel?: string;
  onBack?: () => void;
  onNavigate?: (page: string) => void;
}

export function PublicLayout({ children, showBack, backLabel = 'Back', onBack, onNavigate }: PublicLayoutProps) {
  const clickCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSecretClick = () => {
    clickCountRef.current += 1;
    if (timerRef.current) clearTimeout(timerRef.current);

    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      setMobileMenuOpen(false);
      onNavigate?.('dashboard');
    } else {
      timerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 1200);
    }
  };

  const handleNav = (page: string) => {
    setMobileMenuOpen(false);
    onNavigate?.(page);
  };

  return (
    <div className="min-h-screen bg-surface-base">
      <header className="sticky top-0 z-50 border-b border-neutral-100"
        style={{ backgroundColor: 'rgba(255,248,240,0.95)', backdropFilter: 'blur(8px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => handleNav('home')}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-primary-glow group-hover:bg-primary-dark transition-colors">
                <Shield size={20} className="text-white" />
              </div>
              <div className="text-left">
                <span className="font-bold text-text-primary text-base block leading-none">CraftMatch</span>
                <span className="block text-[10px] text-text-muted font-medium">Verification Portal</span>
              </div>
            </button>

            {/* Desktop nav — no admin button */}
            <nav className="hidden md:flex items-center gap-1">
              <button onClick={() => handleNav('home')} className="btn-ghost text-sm">Home</button>
              <button onClick={() => handleNav('apply')} className="btn-ghost text-sm">Apply</button>
              <button onClick={() => handleNav('status')} className="btn-ghost text-sm">Check Status</button>
              <button onClick={() => handleNav('faq')} className="btn-ghost text-sm">Support</button>
            </nav>

            {/* Mobile: hamburger / back */}
            <div className="flex items-center gap-2 md:hidden">
              {showBack && (
                <button onClick={onBack} className="btn-ghost flex items-center gap-2 text-sm">
                  <ArrowLeft size={16} />
                  {backLabel}
                </button>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl hover:bg-neutral-100 transition-colors"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X size={20} className="text-text-primary" /> : <Menu size={20} className="text-text-primary" />}
              </button>
            </div>
          </div>

          {/* Mobile dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-neutral-100 py-3 animate-fade-in">
              <div className="flex flex-col gap-1">
                <button onClick={() => handleNav('home')} className="btn-ghost text-sm w-full justify-start">Home</button>
                <button onClick={() => handleNav('apply')} className="btn-ghost text-sm w-full justify-start">Apply</button>
                <button onClick={() => handleNav('status')} className="btn-ghost text-sm w-full justify-start">Check Status</button>
                <button onClick={() => handleNav('faq')} className="btn-ghost text-sm w-full justify-start">Support</button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main>{children}</main>

      <footer className="bg-text-primary text-white pt-16 pb-12 mt-20 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Column 1: Brand */}
            <div className="space-y-4">
              <button
                onClick={handleSecretClick}
                className="flex items-center gap-3 focus:outline-none group text-left"
                aria-label="Artisans"
                title="Artisans Verification Portal"
              >
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-primary-glow group-hover:scale-105 transition-transform duration-200">
                  <Shield size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-lg leading-tight">CraftMatch</p>
                  <p className="text-xs text-neutral-400">Verification Portal</p>
                </div>
              </button>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-xs">
                Connecting trusted local artisans with clients across Ghana. Built to foster safety, quality, and economic credibility.
              </p>
              <div className="flex items-center gap-2 pt-2 text-[11px] text-neutral-500">
                <span>&copy; {new Date().getFullYear()} CraftMatch.</span>
                <button
                  onClick={() => onNavigate?.('dashboard')}
                  className="opacity-20 hover:opacity-100 focus:opacity-100 transition-opacity p-1 rounded focus:outline-none"
                  title="Admin Portal"
                  aria-label="Admin Portal access"
                >
                  <Lock size={10} />
                </button>
              </div>
            </div>

            {/* Column 2: Platform */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Platform</h4>
              <ul className="space-y-2 text-xs text-neutral-400">
                <li><button onClick={() => onNavigate?.('home')} className="hover:text-white transition-colors text-left">Home</button></li>
                <li><button onClick={() => onNavigate?.('apply')} className="hover:text-white transition-colors text-left">Apply for Verification</button></li>
                <li><button onClick={() => onNavigate?.('status')} className="hover:text-white transition-colors text-left">Check Application Status</button></li>
              </ul>
            </div>

            {/* Column 3: Support */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Support & Trust</h4>
              <ul className="space-y-2 text-xs text-neutral-400">
                <li><button onClick={() => onNavigate?.('about')} className="hover:text-white transition-colors text-left">About Us</button></li>
                <li><button onClick={() => onNavigate?.('faq')} className="hover:text-white transition-colors text-left">Frequently Asked Questions</button></li>
                <li><button onClick={() => onNavigate?.('contact')} className="hover:text-white transition-colors text-left">Contact Support</button></li>
                <li><button onClick={() => onNavigate?.('safety')} className="hover:text-white transition-colors text-left">Safety Guidelines</button></li>
                <li><button onClick={() => onNavigate?.('report_abuse')} className="hover:text-white transition-colors text-left text-error hover:text-error-light">Report Abuse / Fraud</button></li>
              </ul>
            </div>

            {/* Column 4: Legal */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Legal Policies</h4>
              <ul className="space-y-2 text-xs text-neutral-400">
                <li><button onClick={() => onNavigate?.('terms')} className="hover:text-white transition-colors text-left">Terms of Service</button></li>
                <li><button onClick={() => onNavigate?.('privacy')} className="hover:text-white transition-colors text-left">Privacy Policy</button></li>
                <li><button onClick={() => onNavigate?.('cookie_policy')} className="hover:text-white transition-colors text-left">Cookie Policy</button></li>
                <li><button onClick={() => onNavigate?.('dispute_policy')} className="hover:text-white transition-colors text-left">Dispute Resolution</button></li>
                <li><button onClick={() => onNavigate?.('cancellation_policy')} className="hover:text-white transition-colors text-left">Cancellation & Refund Policy</button></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
