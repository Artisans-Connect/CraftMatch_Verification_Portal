import { useEffect, useState } from 'react';
import { Shield, ArrowRight, CheckCircle, TrendingUp, Users, Star, Award, Globe } from 'lucide-react';
import { PublicLayout } from '../components/layout/PublicLayout';
import { HERO_ARTISANS, TRADE_CATEGORIES, TRADE_EMOJI } from '../lib/constants';
import { fetchPortalStats, formatPortalStats } from '../lib/stats';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

const benefits = [
  {
    icon: Shield,
    title: 'Trusted by Customers',
    description: 'Verified workers receive an official trust badge visible to all customers on the platform.',
    color: 'bg-primary-50',
    iconColor: 'text-primary',
  },
  {
    icon: TrendingUp,
    title: 'Better Visibility',
    description: 'Verified workers rank higher in search results, making it easier for customers to find you.',
    color: 'bg-success-light',
    iconColor: 'text-success-dark',
  },
  {
    icon: Users,
    title: 'Increased Opportunities',
    description: 'Customers consistently prefer verified professionals, leading to more bookings and higher earnings.',
    color: 'bg-gold-50',
    iconColor: 'text-gold-600',
  },
];

const steps = [
  { step: '01', title: 'Submit Application', desc: 'Fill out your personal and professional information.' },
  { step: '02', title: 'Upload Documents',   desc: 'Provide ID documents and professional credentials.' },
  { step: '03', title: 'Expert Review',      desc: 'Our team reviews your application within 48 hours.' },
  { step: '04', title: 'Get Verified',       desc: 'Receive your badge and start getting more customers.' },
];

export function LandingPage({ onNavigate }: LandingPageProps) {
  const [stats, setStats] = useState<{ value: string; label: string }[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [verifiedCount, setVerifiedCount] = useState(0);

  useEffect(() => {
    fetchPortalStats().then((raw) => {
      setStats(formatPortalStats(raw));
      setVerifiedCount(raw.totalVerified);
      setStatsLoading(false);
    });
  }, []);

  return (
    <PublicLayout onNavigate={onNavigate}>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-surface-base via-primary-50/30 to-surface-base pt-16 pb-24">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-gold-500/5 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary/20 rounded-full mb-6">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-semibold text-primary">Official Artisans Verification</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-text-primary leading-tight mb-6 text-balance">
                Become a{' '}
                <span className="text-primary relative">
                  Verified
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
                    <path d="M2 6C40 2 80 2 198 2" stroke="#C15A3D" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.4"/>
                  </svg>
                </span>{' '}
                Artisan
              </h1>
              <p className="text-lg text-text-secondary leading-relaxed mb-8 max-w-lg">
                Increase customer trust, improve visibility, and stand out from other workers
                across Ghana's fastest-growing skilled trades marketplace.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => onNavigate('apply')} className="btn-primary text-base px-8 py-3.5">
                  Apply for Verification
                  <ArrowRight size={18} />
                </button>
                <button onClick={() => onNavigate('status')} className="btn-secondary text-base px-8 py-3.5">
                  Check Application Status
                </button>
              </div>

              <div className="flex items-center gap-4 mt-8 pt-8 border-t border-neutral-100">
                <div className="flex -space-x-2">
                  {['K','A','Y','O'].map((initial, i) => (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: ['#C15A3D','#E6A017','#8B3A2A','#D97706'][i] }}
                    >
                      {initial}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="#E6A017" className="text-gold-500" />)}
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {statsLoading
                      ? 'Loading...'
                      : verifiedCount > 0
                        ? `Trusted by ${verifiedCount.toLocaleString()} verified artisan${verifiedCount !== 1 ? 's' : ''}`
                        : 'Be the first verified artisan'}
                  </p>
                </div>
              </div>
            </div>

            {/* Hero visual */}
            <div className="relative hidden lg:flex items-center justify-center">
              <div className="relative w-96 h-96">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-40 h-40 rounded-3xl bg-white border border-neutral-100 flex flex-col items-center justify-center gap-3 animate-pulse-slow"
                    style={{ boxShadow: '0 20px 50px rgba(44,36,24,0.15)' }}>
                    <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center"
                      style={{ boxShadow: '0 4px 20px rgba(193,90,61,0.3)' }}>
                      <Shield size={28} className="text-white" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-text-primary">VERIFIED</p>
                      <p className="text-[10px] text-text-muted">Artisan Pro</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle size={12} className="text-success" />
                      <span className="text-[10px] font-semibold text-success-dark">Active</span>
                    </div>
                  </div>
                </div>
                {HERO_ARTISANS.map((artisan, i) => {
                  const angle = (i / HERO_ARTISANS.length) * 2 * Math.PI - Math.PI / 4;
                  const r = 155;
                  const x = 50 + (r * Math.cos(angle)) / 4;
                  const y = 50 + (r * Math.sin(angle)) / 4;
                  return (
                    <div
                      key={i}
                      className={`absolute w-20 h-20 rounded-2xl bg-white border flex flex-col items-center justify-center gap-1.5 ${artisan.color}`}
                      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)',
                        boxShadow: '0 4px 12px rgba(44,36,24,0.1)' }}
                    >
                      <span className="text-2xl">{artisan.emoji}</span>
                      <span className="text-[10px] font-semibold">{artisan.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar — live from DB */}
      <section className="py-12 bg-text-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {statsLoading ? (
            <div className="flex justify-center">
              <svg className="animate-spin w-6 h-6 text-white/40" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-sm text-neutral-400">{stat.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">Why Get Verified?</p>
          <h2 className="text-display-md font-bold text-text-primary mb-4">Your badge. Your reputation.</h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Join skilled artisans across Ghana who have built credibility through official verification.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {benefits.map((benefit, i) => {
            const Icon = benefit.icon;
            return (
              <div key={i} className="card-hover p-7 group">
                <div className={`w-12 h-12 rounded-2xl ${benefit.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon size={24} className={benefit.iconColor} />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-3">{benefit.title}</h3>
                <p className="text-text-secondary leading-relaxed">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gradient-to-b from-surface-base to-primary-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-display-md font-bold text-text-primary mb-4">Simple. Fast. Trustworthy.</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6 relative">
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
            {steps.map((step, i) => (
              <div key={i} className="relative text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary mx-auto mb-5 flex items-center justify-center relative z-10"
                  style={{ boxShadow: '0 4px 16px rgba(193,90,61,0.3)' }}>
                  <span className="text-white font-bold text-sm">{step.step}</span>
                </div>
                <h3 className="font-bold text-text-primary mb-2">{step.title}</h3>
                <p className="text-sm text-text-secondary">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported trades — driven by TRADE_CATEGORIES constant */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">Supported Trades</p>
          <h2 className="text-display-sm font-bold text-text-primary">All skilled trades welcome</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {TRADE_CATEGORIES.map((label) => (
            <div key={label} className="card-hover p-5 text-center group cursor-default">
              <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform duration-200">
                {TRADE_EMOJI[label] ?? '🔧'}
              </span>
              <span className="text-sm font-semibold text-text-primary">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-12 text-center relative overflow-hidden"
            style={{ boxShadow: '0 20px 50px rgba(44,36,24,0.2)' }}>
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
              <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-gold-500/10 blur-2xl" />
            </div>
            <div className="relative">
              <Award size={40} className="text-gold-400 mx-auto mb-5" />
              <h2 className="text-3xl font-bold text-white mb-4">Ready to get verified?</h2>
              <p className="text-white/80 text-lg mb-8 max-w-lg mx-auto">
                Join Ghana's most trusted network of skilled artisans. The application takes less than 10 minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => onNavigate('apply')}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-primary font-bold rounded-xl hover:bg-neutral-50 transition-all"
                  style={{ boxShadow: '0 4px 12px rgba(44,36,24,0.15)' }}
                >
                  Apply Now <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => onNavigate('status')}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-transparent text-white border border-white/30 font-semibold rounded-xl hover:bg-white/10 transition-all"
                >
                  <Globe size={18} /> Track Status
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
