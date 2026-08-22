import { useEffect, useMemo, useState } from 'react';
import {
  Apple,
  CheckCircle,
  Download,
  ExternalLink,
  Globe,
  HardDrive,
  HelpCircle,
  Info,
  Laptop,
  MonitorDown,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { PublicLayout } from '../components/layout/PublicLayout';
import { apiGet } from '../lib/api';
import { QrCodeSvg } from '../components/ui/QrCodeSvg';
import type { AppReleaseResponse, ReleasePlatform } from '../types';

interface DownloadPageProps {
  onNavigate: (page: string) => void;
}

const apiBaseUrl = import.meta.env.VITE_EXPRESS_API_BASE_URL || import.meta.env.EXPRESS_API_BASE_URL || '';

const fallbackRelease: AppReleaseResponse = {
  appName: 'CraftMatch',
  latestVersion: '1.0.0',
  updatedAt: new Date().toISOString(),
  releaseNotes: 'Official CraftMatch app with verified artisan matching and status tracking.',
  links: [
    {
      platform: 'android',
      label: 'Android APK',
      href: '/api/releases/download/android',
      version: '1.0.0',
      fileSize: '~38.5 MB',
      minRequirement: 'Android 8.0 or newer',
      available: true,
      external: false,
    },
    {
      platform: 'web',
      label: 'Web PWA',
      href: 'https://artisans-app-frontend.vercel.app/',
      version: '1.0.0',
      minRequirement: 'Latest Chrome, Edge, Safari, or Firefox',
      available: true,
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
  ],
};

const platformCopy: Record<ReleasePlatform, { title: string; description: string; action: string }> = {
  android: {
    title: 'Android',
    description: 'Install the official APK directly on Android phones (Tecno, Infinix, Samsung, Xiaomi).',
    action: 'Download APK',
  },
  web: {
    title: 'Web PWA',
    description: 'Use CraftMatch immediately in any modern mobile or desktop browser without installation.',
    action: 'Open Web PWA',
  },
  ios: {
    title: 'iPhone',
    description: 'Get the iOS build when App Store or TestFlight distribution is ready.',
    action: 'Open iOS Download',
  },
  windows: {
    title: 'Windows',
    description: 'Use CraftMatch from a desktop device for admin demos, management, and larger screens.',
    action: 'Download for Windows',
  },
  macos: {
    title: 'macOS',
    description: 'Install CraftMatch on Mac devices for testing, presentations, and dispatch.',
    action: 'Download for macOS',
  },
};

const platformIcons: Record<ReleasePlatform, typeof Smartphone> = {
  android: Smartphone,
  web: Globe,
  ios: Apple,
  windows: MonitorDown,
  macos: Laptop,
};

const trustItems = [
  {
    icon: ShieldCheck,
    title: 'Verified Profiles',
    description: 'Clients can verify badges and Ghana Card authentication before booking skilled work.',
  },
  {
    icon: Wrench,
    title: 'Work Requests & Quotes',
    description: 'Post jobs, negotiate prices, receive artisan quotes, and manage tasks in one place.',
  },
  {
    icon: CheckCircle,
    title: 'Direct GPS Tracking',
    description: 'Track artisan arrival, milestones, secure payments, and service progress live.',
  },
];

export function DownloadPage({ onNavigate }: DownloadPageProps) {
  const [release, setRelease] = useState<AppReleaseResponse>(fallbackRelease);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);

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
        setError('Using cached distribution channels. Direct download links remain functional.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const androidLink = useMemo(
    () => release.links.find((link) => link.platform === 'android'),
    [release.links],
  );

  const webLink = useMemo(
    () => release.links.find((link) => link.platform === 'web' && link.available),
    [release.links],
  );

  // Compute full direct download URL for Android APK
  const resolvedAndroidDownloadUrl = useMemo(() => {
    if (!androidLink?.href) return '';
    if (androidLink.href.startsWith('http')) return androidLink.href;
    const base = apiBaseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
    return `${base}${androidLink.href.startsWith('/') ? '' : '/'}${androidLink.href}`;
  }, [androidLink]);

  return (
    <PublicLayout onNavigate={onNavigate}>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-surface-base via-primary-50/40 to-surface-base pt-14 pb-16">
        <div className="absolute inset-0 pointer-events-none opacity-60">
          <div className="absolute top-10 right-10 h-40 w-40 rounded-full bg-gold-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-primary/15 rounded-full mb-6 shadow-warm-sm">
                <Download size={14} className="text-primary" />
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  Official App Distribution
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-display-xl font-bold text-text-primary leading-tight mb-6 text-balance">
                Download CraftMatch for your device
              </h1>
              <p className="text-lg text-text-secondary leading-relaxed max-w-2xl mb-8">
                Install the official mobile app to find verified Ghanaian artisans, manage job dispatches, negotiate quotes, and track bookings wherever you go.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                {resolvedAndroidDownloadUrl ? (
                  <a
                    href={resolvedAndroidDownloadUrl}
                    download="CraftMatch.apk"
                    className="btn-primary text-base px-8 py-3.5 flex items-center justify-center gap-2 shadow-primary-glow"
                  >
                    <Download size={18} />
                    Download Android APK
                  </a>
                ) : (
                  <button className="btn-primary text-base px-8 py-3.5 opacity-60 cursor-not-allowed" disabled>
                    APK Temporarily Unavailable
                  </button>
                )}

                {webLink && (
                  <a
                    href={webLink.href}
                    className="btn-secondary text-base px-6 py-3.5 flex items-center justify-center gap-2"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Globe size={18} />
                    Open Web PWA
                    <ExternalLink size={14} className="text-text-muted" />
                  </a>
                )}

                <button
                  onClick={() => setShowQrModal(true)}
                  className="p-3.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-text-primary flex items-center justify-center gap-2 transition-colors shadow-sm"
                  title="Scan QR code with smartphone"
                >
                  <QrCode size={18} className="text-primary" />
                  <span className="text-sm font-semibold hidden sm:inline">Scan QR</span>
                </button>
              </div>

              {/* Build Meta Chips */}
              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-text-muted">
                <span className="inline-flex items-center gap-1.5 bg-white/80 px-3 py-1 rounded-full border border-neutral-200">
                  <Sparkles size={12} className="text-amber-500" />
                  Latest Version: <strong className="text-text-primary font-bold">{release.latestVersion}</strong>
                </span>
                {androidLink?.fileSize && (
                  <span className="inline-flex items-center gap-1.5 bg-white/80 px-3 py-1 rounded-full border border-neutral-200">
                    <HardDrive size={12} className="text-neutral-500" />
                    Size: <strong className="text-text-primary font-bold">{androidLink.fileSize}</strong>
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-semibold">
                  <ShieldCheck size={13} />
                  Official & Signed
                </span>
              </div>
            </div>

            {/* Right Card: QR Code & Live Download Hub */}
            <div className="relative">
              <div className="bg-white rounded-3xl border border-neutral-100 p-6 shadow-warm-xl space-y-5">
                <div className="rounded-2xl bg-text-primary p-6 text-white space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-neutral-400 font-medium">CraftMatch Mobile</p>
                      <p className="font-bold text-xl text-white">Instant Phone Download</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-primary-glow">
                      <Smartphone size={20} className="text-white" />
                    </div>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Scan with your phone's camera to download and install the Android APK directly to your device without cords or cables.
                  </p>

                  <div className="flex items-center justify-center p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15">
                    <QrCodeSvg
                      value={resolvedAndroidDownloadUrl || 'https://craft-match-verification-portal.vercel.app/#/download'}
                      size={160}
                      className="border border-white/20"
                    />
                  </div>

                  <div className="text-center">
                    <p className="text-[11px] text-neutral-400">
                      Compatible with Android 8.0+ • Tecno, Infinix, Samsung, Xiaomi
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between px-2 pt-1 text-xs text-text-muted">
                  <button
                    onClick={() => onNavigate('install_guide')}
                    className="text-primary hover:underline font-semibold flex items-center gap-1.5"
                  >
                    <HelpCircle size={14} />
                    View Installation Tutorial
                  </button>
                  <span>Build: v{release.latestVersion}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Choose Your Platform Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-2">
              Available Platforms
            </p>
            <h2 className="text-display-sm font-bold text-text-primary">Install or open CraftMatch</h2>
          </div>
          {error && (
            <div className="inline-flex items-start gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs text-text-muted max-w-md">
              <Info size={16} className="mt-0.5 text-primary flex-shrink-0" />
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
              const isAndroid = link.platform === 'android';
              const downloadUrl = isAndroid ? resolvedAndroidDownloadUrl : link.href;

              return (
                <article
                  key={link.platform}
                  className={`card-hover p-6 flex flex-col ${
                    link.available ? 'border-primary/20 bg-white ring-1 ring-primary/5' : 'bg-surface-base'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        link.available ? 'bg-primary-50 text-primary shadow-sm' : 'bg-neutral-100 text-neutral-400'
                      }`}
                    >
                      <Icon size={24} />
                    </div>
                    <span className={`badge ${link.available ? 'badge-approved' : 'badge-more-info'}`}>
                      {link.available ? 'Available' : 'Coming soon'}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-text-primary mb-2 flex items-center gap-2">
                    {copy.title}
                    {isAndroid && link.available && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed mb-4">{copy.description}</p>

                  <div className="text-xs text-text-muted space-y-1 mb-6">
                    <p className="flex items-center justify-between">
                      <span>Version:</span>
                      <strong className="text-text-primary">{link.version || release.latestVersion}</strong>
                    </p>
                    {link.fileSize && (
                      <p className="flex items-center justify-between">
                        <span>Download Size:</span>
                        <strong className="text-text-primary">{link.fileSize}</strong>
                      </p>
                    )}
                    <p className="pt-1 text-[11px] text-neutral-500">{link.minRequirement}</p>
                  </div>

                  <div className="mt-auto pt-2">
                    {link.available && downloadUrl ? (
                      <a
                        href={downloadUrl}
                        download={isAndroid ? 'CraftMatch.apk' : undefined}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                        target={link.external ? '_blank' : undefined}
                        rel={link.external ? 'noreferrer' : undefined}
                      >
                        {copy.action}
                        {link.external ? <ExternalLink size={16} /> : <Download size={16} />}
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

      {/* Trust & Safety Features */}
      <section className="bg-white border-y border-neutral-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-2">Built For Trust</p>
            <h2 className="text-display-sm font-bold text-text-primary">
              All features work seamlessly with verified profiles
            </h2>
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

      {/* Help Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="card p-7 md:p-9 text-center">
          <h2 className="text-display-xs font-bold text-text-primary mb-3">Need help installing on your phone?</h2>
          <p className="text-text-secondary mb-6 max-w-xl mx-auto">
            If your Android device blocks unknown apps, check our simple step-by-step guide tailored for Tecno, Infinix, Samsung, and Xiaomi devices.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => onNavigate('install_guide')} className="btn-primary">
              View Android Install Guide
            </button>
            <button onClick={() => onNavigate('contact')} className="btn-secondary">
              Contact Support
            </button>
          </div>
        </div>
      </section>

      {/* QR Code Pop-up Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5 text-center border border-neutral-100">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <QrCode size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">Scan to Download APK</h3>
              <p className="text-xs text-neutral-600 mt-1">
                Open your smartphone's camera app or Google Lens and point it at the QR code below.
              </p>
            </div>

            <div className="flex justify-center p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
              <QrCodeSvg
                value={resolvedAndroidDownloadUrl || 'https://craft-match-verification-portal.vercel.app/#/download'}
                size={180}
              />
            </div>

            <p className="text-[11px] text-neutral-500 font-mono break-all px-2">
              v{release.latestVersion} • {androidLink?.fileSize || '~38.5 MB'}
            </p>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="btn-primary w-full py-2.5 text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </PublicLayout>
  );
}
