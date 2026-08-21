import {
  AlertTriangle,
  Apple,
  ArrowLeft,
  Download,
  ExternalLink,
  Globe,
  HelpCircle,
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

const androidBrands = [
  {
    brand: 'Tecno & Infinix (HiOS / XOS)',
    tip: 'When Chrome downloads the APK, tap Open -> Settings -> Toggle "Allow from this source" -> Tap Install.',
  },
  {
    brand: 'Samsung Galaxy (One UI)',
    tip: 'Tap the downloaded APK from notification or My Files -> Settings -> Turn ON "Allow permission" -> Install.',
  },
  {
    brand: 'Xiaomi / Redmi (MIUI / HyperOS)',
    tip: 'Open file -> Tap "Settings" -> Check "I am aware of possible risks" -> Confirm -> Tap Install.',
  },
  {
    brand: 'Huawei & Other Androids',
    tip: 'Open Download history in browser -> Tap CraftMatch.apk -> Allow unknown sources -> Tap Install.',
  },
];

const platformGuides = [
  {
    title: 'Android APK Direct Install',
    icon: Smartphone,
    status: 'Available Now',
    description: 'Download the official CraftMatch APK directly onto your phone for fast, native performance.',
    steps: [
      'Tap "Download Android APK" from the CraftMatch Download page or scan the QR code.',
      'When your browser prompts "File might be harmful", tap "Download anyway" (all official builds are verified and signed).',
      'Once the download finishes, tap the notification or open your device\'s "Files" or "Downloads" app.',
      'If prompted with "Install unknown apps", tap "Settings" and toggle "Allow from this source" for Chrome or Files.',
      'Tap "Install". Once finished, tap "Open" and sign into CraftMatch with your phone number or Google account.',
    ],
  },
  {
    title: 'Web PWA (No Install Needed)',
    icon: Globe,
    status: 'Available now',
    description: 'Use CraftMatch immediately in any modern mobile browser or install it as a lightweight Progressive Web App.',
    steps: [
      'Open the CraftMatch Web PWA link in Chrome, Edge, or Safari.',
      'In Android Chrome, tap the 3-dot menu and choose "Install app" or "Add to Home screen".',
      'On iPhone Safari, tap the Share button at the bottom and tap "Add to Home Screen".',
      'The CraftMatch icon will appear on your home screen and open in full-screen mode like a native app.',
      'Allow location and camera permissions when prompted to enable artisan matching and document verification.',
    ],
  },
  {
    title: 'iPhone (iOS)',
    icon: Apple,
    status: 'PWA Available / Store Pending',
    description: 'Use the Web PWA via Safari for a full native-like experience on iPhone and iPad.',
    steps: [
      'Open the Web PWA link in Apple Safari on your iPhone.',
      'Tap the Share button (square with arrow pointing up).',
      'Scroll down and tap "Add to Home Screen".',
      'Tap "Add" in the top right corner.',
      'Launch CraftMatch directly from your home screen.',
    ],
  },
  {
    title: 'Windows Desktop',
    icon: MonitorDown,
    status: 'PWA & Browser Ready',
    description: 'Use CraftMatch on Windows desktop for administration, live map tracking, and larger displays.',
    steps: [
      'Open the Web PWA in Google Chrome or Microsoft Edge.',
      'Click the Install icon in the browser address bar (top right) or menu -> "Install CraftMatch".',
      'CraftMatch will open as an independent window with its own taskbar shortcut.',
      'Sign in as an administrator or artisan to manage dispatches and reviews.',
    ],
  },
  {
    title: 'macOS Desktop',
    icon: Laptop,
    status: 'PWA & Browser Ready',
    description: 'Install CraftMatch as a standalone macOS web app via Safari or Chrome.',
    steps: [
      'Open the Web PWA in Safari or Chrome on your Mac.',
      'In Safari: File -> "Add to Dock..." and confirm the name CraftMatch.',
      'In Chrome: 3-dot menu -> Save and Share -> "Install CraftMatch".',
      'Launch CraftMatch from your Mac Dock or Launchpad.',
    ],
  },
];

const troubleshooting = [
  {
    title: 'Phone says "File might be harmful"',
    body: 'Android displays this standard prompt for any APK downloaded outside the Google Play Store. Official CraftMatch builds are signed and malware-free. Tap "Download anyway".',
  },
  {
    title: '"Install Unknown Apps" prompt appears',
    body: 'This is a normal Android security feature. Tap "Settings" in the pop-up, enable "Allow from this source" for your browser, and press back to continue installation.',
  },
  {
    title: 'APK download fails or is slow',
    body: 'Ensure you have an active MTN, Vodafone/Telecel, or AirtelTigo data bundle and at least 100MB of free internal storage on your phone.',
  },
  {
    title: 'PWA install button is missing',
    body: 'Ensure you are using Google Chrome or Microsoft Edge on Android, or Apple Safari on iOS. Some in-app social media browsers disable PWA installation.',
  },
  {
    title: 'App permissions (Camera, GPS, Notifications)',
    body: 'CraftMatch requires GPS location to find nearby artisans and camera access to upload Ghana Card verification photos. You can enable them under Android Settings -> Apps -> CraftMatch -> Permissions.',
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
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-primary/15 rounded-full mb-4 shadow-warm-sm">
                <Smartphone size={13} className="text-primary" />
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  Ghana Mobile Setup Guide
                </span>
              </div>
              <h1 className="text-display-md font-bold text-text-primary mb-4">
                How to install CraftMatch on your device
              </h1>
              <p className="text-base text-text-secondary leading-relaxed max-w-2xl mb-6">
                Follow these simple instructions to install the Android APK or launch the Web PWA on your phone or desktop.
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => onNavigate('download')} className="btn-primary">
                  <Download size={16} />
                  Download Android APK
                </button>
                <a href={pwaUrl} target="_blank" rel="noreferrer" className="btn-secondary">
                  <Globe size={16} />
                  Open Web PWA
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            <div className="card p-6 bg-white border border-neutral-100 shadow-warm-sm space-y-4">
              <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600" />
                Device Tips for Ghanaian Phones
              </h3>
              <div className="space-y-3 text-xs">
                {androidBrands.map((b) => (
                  <div key={b.brand} className="p-3 rounded-xl bg-surface-base border border-neutral-100">
                    <p className="font-bold text-text-primary mb-1">{b.brand}</p>
                    <p className="text-text-secondary leading-relaxed">{b.tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guides for Each Platform */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="mb-10 text-center">
          <p className="text-primary font-semibold text-xs uppercase tracking-widest mb-2">Step-by-Step Instructions</p>
          <h2 className="text-display-sm font-bold text-text-primary">Installation Walkthroughs</h2>
        </div>

        <div className="space-y-8">
          {platformGuides.map((guide) => {
            const Icon = guide.icon;
            return (
              <div key={guide.title} className="card p-6 md:p-8 bg-white border border-neutral-100 shadow-warm-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-primary-50 text-primary flex items-center justify-center">
                      <Icon size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">{guide.title}</h3>
                      <p className="text-xs text-text-secondary">{guide.description}</p>
                    </div>
                  </div>
                  <span className="badge badge-approved self-start sm:self-auto text-xs">
                    {guide.status}
                  </span>
                </div>

                <div className="space-y-3">
                  {guide.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm text-text-secondary">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Troubleshooting Section */}
      <section className="bg-white border-t border-neutral-100 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <HelpCircle size={22} />
            </div>
            <h2 className="text-display-xs font-bold text-text-primary">Frequently Encountered Issues</h2>
            <p className="text-xs text-text-muted mt-1">Quick fixes for common Android installation questions</p>
          </div>

          <div className="space-y-4">
            {troubleshooting.map((item) => (
              <div key={item.title} className="p-5 rounded-2xl border border-neutral-100 bg-surface-base">
                <h4 className="font-bold text-sm text-text-primary mb-1 flex items-center gap-2">
                  <AlertTriangle size={15} className="text-amber-500" />
                  {item.title}
                </h4>
                <p className="text-xs text-text-secondary leading-relaxed pl-6">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <button onClick={() => onNavigate('contact')} className="btn-secondary text-xs">
              Still having trouble? Contact Technical Support
            </button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
