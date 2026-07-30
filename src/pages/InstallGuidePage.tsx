import {
  AlertTriangle,
  Apple,
  ArrowLeft,
  CheckCircle,
  Download,
  ExternalLink,
  Globe,
  Laptop,
  MonitorDown,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { PublicLayout } from '../components/layout/PublicLayout';

interface InstallGuidePageProps {
  onNavigate: (page: string) => void;
}

const pwaUrl = 'https://artisans-app-frontend.vercel.app/';

const platformGuides = [
  {
    title: 'Web PWA',
    icon: Globe,
    status: 'Available now',
    description: 'Use CraftMatch immediately from the browser, then install it to your home screen if your browser supports PWAs.',
    steps: [
      'Open the CraftMatch PWA link.',
      'In Chrome or Edge, use the install icon or open the browser menu and choose Install app.',
      'On Android Chrome, open the menu and choose Add to Home screen or Install app.',
      'On iPhone Safari, tap Share and choose Add to Home Screen.',
      'Allow camera, location, and notification permissions only when CraftMatch asks for features that need them.',
    ],
  },
  {
    title: 'Android APK',
    icon: Smartphone,
    status: 'Release dependent',
    description: 'Use the Android APK when it appears on the download page. The PWA remains the fallback while native builds are pending.',
    steps: [
      'Go to the Download App page and download the Android APK when it is available.',
      'Open the downloaded APK from your browser downloads or Files app.',
      'If Android asks, allow Install unknown apps only for the browser or Files app you used.',
      'After installation, turn that permission off again for better device safety.',
      'Open CraftMatch, sign in, and continue your setup.',
    ],
  },
  {
    title: 'iPhone',
    icon: Apple,
    status: 'Store dependent',
    description: 'Use App Store or TestFlight when the iOS link is available. Until then, install the PWA from Safari.',
    steps: [
      'Use the App Store or TestFlight link from the Download App page when available.',
      'If no iOS link is available yet, open the Web PWA in Safari.',
      'Tap Share, choose Add to Home Screen, then confirm the CraftMatch icon.',
      'Launch CraftMatch from your home screen and sign in.',
    ],
  },
  {
    title: 'Windows',
    icon: MonitorDown,
    status: 'Build dependent',
    description: 'Use the Windows installer when a desktop build is released. The Web PWA works from modern desktop browsers today.',
    steps: [
      'Download the Windows installer from the Download App page when available.',
      'Run the installer and accept normal Windows security prompts.',
      'Launch CraftMatch from the Start menu or desktop shortcut.',
      'If the installer is not available yet, use the Web PWA in Chrome or Edge.',
    ],
  },
  {
    title: 'macOS',
    icon: Laptop,
    status: 'Build dependent',
    description: 'Use the macOS build when released. Until then, Safari, Chrome, and Edge can open the Web PWA.',
    steps: [
      'Download the macOS package from the Download App page when available.',
      'Open the package or app file and follow the install prompts.',
      'If macOS shows a security prompt, approve only if the file came from the official CraftMatch download page.',
      'If the build is not available yet, use the Web PWA.',
    ],
  },
];

const troubleshooting = [
  {
    title: 'Browser blocks a download',
    body: 'Confirm you are using the official portal, then allow the download from the browser download shelf or security panel.',
  },
  {
    title: 'APK will not install',
    body: 'Check that the file finished downloading, your device has enough storage, and Android version requirements are met.',
  },
  {
    title: 'PWA install button is missing',
    body: 'Try Chrome, Edge, or Safari, refresh the page, and use the browser menu. Some in-app browsers do not show PWA installation.',
  },
  {
    title: 'Login or verification opens the wrong place',
    body: 'Return to the verification portal or PWA manually, then sign in again. Redirect behavior can differ by browser and device.',
  },
  {
    title: 'Camera, location, or notifications do not work',
    body: 'Check browser or system permissions for CraftMatch, then reload the app after changing permissions.',
  },
];

export function InstallGuidePage({ onNavigate }: InstallGuidePageProps) {
  return (
    <PublicLayout onNavigate={onNavigate}>
      <section className="bg-gradient-to-br from-surface-base via-primary-50/40 to-surface-base pt-14 pb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button onClick={() => onNavigate('download')} className="btn-ghost mb-6">
            <ArrowLeft size={16} />
            Back to Downloads
          </button>

          <div className="grid lg:grid-cols-[1.08fr_0.92fr] gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-primary/15 rounded-full mb-6 shadow-warm-sm">
                <Download size={14} className="text-primary" />
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Installation Guide</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-display-xl font-bold text-text-primary leading-tight mb-5 text-balance">
                Install CraftMatch
              </h1>
              <p className="text-lg text-text-secondary leading-relaxed max-w-2xl mb-8">
                You can use the Web PWA right now. Native mobile and desktop builds will appear on the download page as soon as each release is available.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={pwaUrl} target="_blank" rel="noreferrer" className="btn-primary text-base px-8 py-3.5">
                  Open Web PWA
                  <ExternalLink size={18} />
                </a>
                <button onClick={() => onNavigate('download')} className="btn-secondary text-base px-8 py-3.5">
                  Back to Downloads
                </button>
              </div>
            </div>

            <div className="card p-6">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-primary-glow mb-5">
                <ShieldCheck size={24} />
              </div>
              <h2 className="text-display-xs font-bold text-text-primary mb-3">Install safely</h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                Only install CraftMatch from the official verification portal, the Download App page, or the known PWA link.
              </p>
              <div className="rounded-2xl border border-error/15 bg-error-light p-4 flex items-start gap-3">
                <AlertTriangle size={18} className="text-error mt-0.5 flex-shrink-0" />
                <p className="text-xs text-text-secondary leading-relaxed">
                  Do not install APKs sent through random chats or unknown file-sharing links.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="mb-9">
          <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-2">Platform Steps</p>
          <h2 className="text-display-sm font-bold text-text-primary">Choose your device</h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          {platformGuides.map((guide) => {
            const Icon = guide.icon;
            return (
              <article key={guide.title} className="card-hover p-6">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary">
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-text-primary">{guide.title}</h3>
                      <p className="text-xs text-text-muted mt-1">{guide.status}</p>
                    </div>
                  </div>
                  {guide.status === 'Available now' && (
                    <span className="badge-approved">
                      <CheckCircle size={13} />
                      Ready
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-secondary leading-relaxed mb-5">{guide.description}</p>
                <ol className="space-y-3">
                  {guide.steps.map((step, index) => (
                    <li key={step} className="flex gap-3">
                      <span className="mt-0.5 w-6 h-6 rounded-full bg-primary-50 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-sm text-text-secondary leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-white border-y border-neutral-100 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-9">
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-2">Troubleshooting</p>
            <h2 className="text-display-sm font-bold text-text-primary">Common install issues</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {troubleshooting.map((item) => (
              <div key={item.title} className="rounded-2xl border border-neutral-100 bg-surface-base p-5">
                <h3 className="font-bold text-text-primary mb-2">{item.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="card p-7 md:p-9 text-center">
          <h2 className="text-display-xs font-bold text-text-primary mb-3">Still stuck?</h2>
          <p className="text-text-secondary mb-6">
            If installation still fails, contact support with your device type, browser, and any error message you saw.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => onNavigate('contact')} className="btn-primary">
              Contact Support
            </button>
            <button onClick={() => onNavigate('download')} className="btn-secondary">
              Return to Downloads
            </button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
