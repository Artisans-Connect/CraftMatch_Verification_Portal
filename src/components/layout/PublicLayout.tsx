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
                <span className="font-bold text-text-primary text-base block leading-none">Artisans</span>
                <span className="block text-[10px] text-text-muted font-medium">Verification Portal</span>
              </div>
            </button>

            {/* Desktop nav — no admin button */}
            <nav className="hidden md:flex items-center gap-1">
              <button onClick={() => handleNav('home')} className="btn-ghost text-sm">Home</button>
              <button onClick={() => handleNav('apply')} className="btn-ghost text-sm">Apply</button>
              <button onClick={() => handleNav('status')} className="btn-ghost text-sm">Check Status</button>
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
              </div>
            </div>
          )}
        </div>
      </header>

      <main>{children}</main>

      <footer className="bg-text-primary text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Triple-click trigger on the brand logo */}
            <button
              onClick={handleSecretClick}
              className="flex items-center gap-3 focus:outline-none group"
              aria-label="Artisans"
              title="Artisans Verification Portal"
            >
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <Shield size={20} className="text-white" />
              </div>
              <div className="text-left">
                <p className="font-bold">Artisans Verification Portal</p>
                <p className="text-sm text-neutral-400">Building trust across Ghana</p>
              </div>
            </button>

            <div className="flex flex-col md:flex-row gap-4 md:gap-8 text-sm text-neutral-400">
              <button onClick={() => onNavigate?.('apply')} className="hover:text-white transition-colors text-left">
                Apply for Verification
              </button>
              <button onClick={() => onNavigate?.('status')} className="hover:text-white transition-colors text-left">
                Check Status
              </button>
            </div>

            <div className="flex items-center gap-3">
              <p className="text-sm text-neutral-500">&copy; 2024 Artisans.</p>
              {/* Hidden admin entry — discoverable on hover/focus/keyboard */}
              <button
                onClick={() => onNavigate?.('dashboard')}
                className="opacity-0 hover:opacity-40 focus:opacity-50 transition-opacity duration-300 p-1.5 rounded focus:outline-none focus:ring-2 focus:ring-neutral-600"
                title="Portal"
                aria-label="Portal access"
              >
                <Lock size={12} className="text-neutral-500" />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
