import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Apple,
  CheckCircle,
  Download,
  ExternalLink,
  Globe,
  Laptop,
  MonitorDown,
  ShieldCheck,
  Smartphone,
  Wrench,
} from 'lucide-react';
import { PublicLayout } from '../components/layout/PublicLayout';
import { apiGet } from '../lib/api';

type ReleasePlatform = 'android' | 'ios' | 'windows' | 'macos' | 'web';

interface AppReleaseLink {
  platform: ReleasePlatform;
  label: string;
  href: string;
  version?: string;
  minRequirement?: string;
  available: boolean;
  external?: boolean;
}

interface AppReleaseResponse {
  appName: string;
  latestVersion: string;
  updatedAt: string;
  links: AppReleaseLink[];
}

interface DownloadPageProps {
  onNavigate: (page: string) => void;
}

const fallbackRelease: AppReleaseResponse = {
  appName: 'CraftMatch',
  latestVersion: '1.0.0',
  updatedAt: new Date().toISOString(),
  links: [
    {
      platform: 'android',
      label: 'Android APK',
      href: '',
      version: '1.0.0',
      minRequirement: 'Android 8.0 or newer',
      available: false,
      external: true,
    },
    {
      platform: 'ios',
      label: 'iPhone',
      href: '',
      version: '1.0.0',
      minRequirement: 'iOS 15 or newer',
      available: false,
      external: true,
    },
    {
      platform: 'windows',
      label: 'Windows',
      href: '',
      version: '1.0.0',
      minRequirement: 'Windows 10 or newer',
      available: false,
      external: true,
    },
    {
      platform: 'macos',
      label: 'macOS',
      href: '',
      version: '1.0.0',
      minRequirement: 'macOS 12 or newer',
      available: false,
      external: true,
    },
    {
      platform: 'web',
      label: 'Web App',
      href: '',
      version: '1.0.0',
      minRequirement: 'Latest Chrome, Edge, Safari, or Firefox',
      available: false,
      external: true,
    },
  ],
};

const platformCopy: Record<ReleasePlatform, { title: string; description: string; action: string }> = {
  android: {
    title: 'Android',
    description: 'Install the APK directly on phones used by artisans and clients.',
    action: 'Download APK',
  },
  ios: {
    title: 'iPhone',
    description: 'Get the iOS build when App Store or TestFlight distribution is ready.',
    action: 'Open iOS Download',
  },
  windows: {
    title: 'Windows',
    description: 'Use CraftMatch from a desktop device for admin demos and larger screens.',
    action: 'Download for Windows',
  },
  macos: {
    title: 'macOS',
    description: 'Install CraftMatch on Mac devices for testing and presentations.',
    action: 'Download for macOS',
  },
  web: {
    title: 'Web',
    description: 'Continue in the browser if installing the mobile or desktop app is not convenient.',
    action: 'Open Web App',
  },
};

const platformIcons: Record<ReleasePlatform, typeof Smartphone> = {
  android: Smartphone,
  ios: Apple,
  windows: MonitorDown,
  macos: Laptop,
  web: Globe,
};

const trustItems = [
  {
    icon: ShieldCheck,
    title: 'Verified Profiles',
    description: 'Clients can see trust badges and profile details before booking skilled work.',
  },
  {
    icon: Wrench,
    title: 'Work Requests',
    description: 'Post jobs, receive artisan interest, and keep work details in one place.',
  },
  {
    icon: CheckCircle,
    title: 'Status Tracking',
    description: 'Track verification, bookings, and service progress without calling support.',
  },
];

export function DownloadPage({ onNavigate }: DownloadPageProps) {
  const [release, setRelease] = useState<AppReleaseResponse>(fallbackRelease);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    apiGet<AppReleaseResponse>('/releases/app')
      .then((data) => {
        if (!active) return;
        setRelease(data);
        setError('');
      })
      .catch(() => {
        if (!active) return;
        setRelease(fallbackRelease);
        setError('Download links are temporarily unavailable. Please check back shortly.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const webLink = useMemo(
    () => release.links.find((link) => link.platform === 'web' && link.available),
    [release.links],
  );

  return (
    <PublicLayout onNavigate={onNavigate}>
      <section className="relative overflow-hidden bg-gradient-to-br from-surface-base via-primary-50/40 to-surface-base pt-14 pb-16">
        <div className="absolute inset-0 pointer-events-none opacity-60">
          <div className="absolute top-10 right-10 h-40 w-40 rounded-full bg-gold-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-primary/15 rounded-full mb-6 shadow-warm-sm">
                <Download size={14} className="text-primary" />
                <span className="text-xs font-bold text-primary uppercase tracking-wider">CraftMatch App</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-display-xl font-bold text-text-primary leading-tight mb-6 text-balance">
                Download CraftMatch for your device
              </h1>
              <p className="text-lg text-text-secondary leading-relaxed max-w-2xl mb-8">
                Install the app to find trusted artisans, manage bookings, upload verification details, and keep service updates close wherever you work.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                {webLink ? (
                  <a href={webLink.href} className="btn-primary text-base px-8 py-3.5" target="_blank" rel="noreferrer">
                    Open Web App
                    <ExternalLink size={18} />
                  </a>
                ) : (
                  <button className="btn-primary text-base px-8 py-3.5 opacity-60 cursor-not-allowed" disabled>
                    Web App Coming Soon
                  </button>
                )}
                <button onClick={() => onNavigate('faq')} className="btn-secondary text-base px-8 py-3.5">
                  Installation Help
                </button>
              </div>
              <p className="mt-5 text-xs text-text-muted">
                Latest version {release.latestVersion}. Links are supplied by the CraftMatch release service.
              </p>
            </div>

            <div className="relative">
              <div className="bg-white rounded-3xl border border-neutral-100 p-5 shadow-warm-xl">
                <div className="rounded-2xl bg-text-primary p-5 text-white">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <p className="text-xs text-neutral-400">CraftMatch</p>
                      <p className="font-bold text-xl">Ready to install</p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center shadow-primary-glow">
                      <Download size={22} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {release.links.slice(0, 3).map((link) => {
                      const Icon = platformIcons[link.platform];
                      return (
                        <div key={link.platform} className="flex items-center justify-between rounded-2xl bg-white/8 border border-white/10 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Icon size={18} className="text-gold-400" />
                            <span className="text-sm font-semibold">{platformCopy[link.platform].title}</span>
                          </div>
                          <span className={`text-[11px] font-bold ${link.available ? 'text-success' : 'text-neutral-400'}`}>
                            {link.available ? 'Available' : 'Soon'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-2">Choose Your Platform</p>
            <h2 className="text-display-sm font-bold text-text-primary">Install or open CraftMatch</h2>
          </div>
          {error && (
            <div className="inline-flex items-start gap-2 rounded-2xl border border-warning/20 bg-warning-light px-4 py-3 text-xs text-warning-dark max-w-md">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="card p-6 animate-pulse">
                <div className="h-12 w-12 rounded-2xl bg-neutral-100 mb-5" />
                <div className="h-5 w-32 bg-neutral-100 rounded mb-3" />
                <div className="h-4 w-full bg-neutral-100 rounded mb-2" />
                <div className="h-4 w-2/3 bg-neutral-100 rounded mb-6" />
                <div className="h-11 w-full bg-neutral-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {release.links.map((link) => {
              const Icon = platformIcons[link.platform];
              const copy = platformCopy[link.platform];
              return (
                <article key={link.platform} className="card-hover p-6 flex flex-col">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary">
                      <Icon size={24} />
                    </div>
                    <span className={`badge ${link.available ? 'badge-approved' : 'badge-more-info'}`}>
                      {link.available ? 'Available' : 'Coming soon'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">{copy.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed mb-4">{copy.description}</p>
                  <div className="text-xs text-text-muted space-y-1 mb-6">
                    <p>Version {link.version || release.latestVersion}</p>
                    <p>{link.minRequirement}</p>
                  </div>
                  <div className="mt-auto">
                    {link.available ? (
                      <a href={link.href} className="btn-primary w-full" target={link.external ? '_blank' : undefined} rel={link.external ? 'noreferrer' : undefined}>
                        {copy.action}
                        <ExternalLink size={16} />
                      </a>
                    ) : (
                      <button className="btn-secondary w-full opacity-60 cursor-not-allowed" disabled>
                        Coming Soon
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-white border-y border-neutral-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-2">Built For Trust</p>
            <h2 className="text-display-sm font-bold text-text-primary">Everything works with your verified account</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {trustItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="p-6 rounded-2xl border border-neutral-100 bg-surface-base">
                  <div className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center mb-4 shadow-primary-glow">
                    <Icon size={21} />
                  </div>
                  <h3 className="font-bold text-text-primary mb-2">{item.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="card p-7 md:p-9 text-center">
          <h2 className="text-display-xs font-bold text-text-primary mb-3">Need help installing?</h2>
          <p className="text-text-secondary mb-6">
            If your device blocks an APK, store link, or desktop installer, visit support for setup guidance and safety notes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => onNavigate('faq')} className="btn-primary">
              Read FAQs
            </button>
            <button onClick={() => onNavigate('contact')} className="btn-secondary">
              Contact Support
            </button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
