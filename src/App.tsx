import { useEffect, useState } from 'react';
import { LandingPage } from './pages/LandingPage';
import { ApplyPage } from './pages/ApplyPage';
import { StatusPage } from './pages/StatusPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ApplicationsTable } from './pages/admin/ApplicationsTable';
import { ApplicationDetail } from './pages/admin/ApplicationDetail';
import { AuditLogPage } from './pages/admin/AuditLogPage';
import { ServiceCatalogPage } from './pages/admin/ServiceCatalogPage';
import { AccountsPage } from './pages/admin/AccountsPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { EmailVerifiedPage } from './pages/EmailVerifiedPage';
import { UpdatePasswordPage } from './pages/UpdatePasswordPage';
import { SupportHub } from './pages/SupportHub';
import { DownloadPage } from './pages/DownloadPage';
import { InstallGuidePage } from './pages/InstallGuidePage';
import { PaymentGateway } from './pages/PaymentGateway';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import type { WorkerVerification, VerificationStatus } from './types';
import { apiPost } from './lib/api';

type Page =
  | 'home'
  | 'apply'
  | 'status'
  | 'dashboard'
  | 'reports'
  | 'applications'
  | 'pending'
  | 'more_info'
  | 'approved'
  | 'rejected'
  | 'application_detail'
  | 'audits'
  | 'catalog'
  | 'accounts'
  | 'settings'
  | 'email_verified'
  | 'update_password'
  | 'download'
  | 'install_guide'
  | 'payment_gateway'
  | 'about'
  | 'faq'
  | 'contact'
  | 'safety'
  | 'report_abuse'
  | 'terms'
  | 'privacy'
  | 'cookie_policy'
  | 'dispute_policy'
  | 'cancellation_policy';

const filterMap: Record<string, VerificationStatus | null> = {
  pending: 'pending',
  more_info: 'more_info_requested',
  approved: 'approved',
  rejected: 'rejected',
  applications: null,
};

interface RouteState {
  page: Page;
  appId?: string;
}

function parseHashRoute(): RouteState {
  const hash = window.location.hash.replace('#', '').trim() || '/';
  const pathname = window.location.pathname;

  if (pathname.startsWith('/payment-gateway') || hash.startsWith('/payment-gateway')) return { page: 'payment_gateway' };
  if (pathname.includes('/email-verified') || hash.startsWith('/email-verified')) return { page: 'email_verified' };
  if (pathname.includes('/update-password') || hash.startsWith('/update-password')) return { page: 'update_password' };

  if (hash.startsWith('/portal/admin/applications/')) {
    const rawId = hash.replace('/portal/admin/applications/', '').split('?')[0];
    if (rawId && rawId !== 'pending' && rawId !== 'more-info' && rawId !== 'approved' && rawId !== 'rejected') {
      return { page: 'application_detail', appId: rawId };
    }
  }

  if (hash.startsWith('/portal/admin/reports')) return { page: 'reports' };
  if (hash.startsWith('/portal/admin/audits')) return { page: 'audits' };
  if (hash.startsWith('/portal/admin/catalog')) return { page: 'catalog' };
  if (hash.startsWith('/portal/admin/accounts')) return { page: 'accounts' };
  if (hash.startsWith('/portal/admin/applications')) return { page: 'applications' };
  if (hash.startsWith('/portal/admin/pending')) return { page: 'pending' };
  if (hash.startsWith('/portal/admin/more-info')) return { page: 'more_info' };
  if (hash.startsWith('/portal/admin/approved')) return { page: 'approved' };
  if (hash.startsWith('/portal/admin/rejected')) return { page: 'rejected' };
  if (hash.startsWith('/portal/admin/settings')) return { page: 'settings' };
  if (hash.startsWith('/portal/admin')) return { page: 'dashboard' };

  if (hash.startsWith('/apply')) return { page: 'apply' };
  if (hash.startsWith('/status')) return { page: 'status' };
  if (hash.startsWith('/download')) return { page: 'download' };
  if (hash.startsWith('/install-guide')) return { page: 'install_guide' };
  if (hash.startsWith('/about')) return { page: 'about' };
  if (hash.startsWith('/faq')) return { page: 'faq' };
  if (hash.startsWith('/contact')) return { page: 'contact' };
  if (hash.startsWith('/safety')) return { page: 'safety' };
  if (hash.startsWith('/report-abuse')) return { page: 'report_abuse' };
  if (hash.startsWith('/terms')) return { page: 'terms' };
  if (hash.startsWith('/privacy')) return { page: 'privacy' };
  if (hash.startsWith('/cookie-policy')) return { page: 'cookie_policy' };
  if (hash.startsWith('/dispute-policy')) return { page: 'dispute_policy' };
  if (hash.startsWith('/cancellation-policy')) return { page: 'cancellation_policy' };

  return { page: 'home' };
}

export default function App() {
  const initialRoute = parseHashRoute();
  const [page, setPage] = useState<Page>(initialRoute.page);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | undefined>(initialRoute.appId);
  const [selectedApplication, setSelectedApplication] = useState<WorkerVerification | null>(null);
  const [handoffCode, setHandoffCode] = useState('');
  const [handoffContext, setHandoffContext] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const handleHashChange = () => {
      const route = parseHashRoute();
      setPage(route.page);
      setSelectedApplicationId(route.appId);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('handoff') || '';
    if (!code) return;
    setHandoffCode(code);
    setPage('apply');
    apiPost<Record<string, unknown>>('/verification/handoff/exchange', { handoff_code: code })
      .then(setHandoffContext)
      .catch(() => setHandoffContext(null));
  }, []);

  const navigate = (targetPage: string, data?: unknown) => {
    let targetHash = '/';
    if (targetPage === 'application_detail') {
      const appObj = data as WorkerVerification | undefined;
      const appId = typeof data === 'string' ? data : appObj?.id || selectedApplicationId;
      if (appObj && typeof data !== 'string') {
        setSelectedApplication(appObj);
      }
      if (appId) {
        setSelectedApplicationId(appId);
        targetHash = `/portal/admin/applications/${appId}`;
      } else {
        targetHash = '/portal/admin/applications';
      }
    } else {
      const routeByPage: Partial<Record<Page, string>> = {
        home: '/',
        apply: '/apply',
        status: '/status',
        dashboard: '/portal/admin',
        reports: '/portal/admin/reports',
        applications: '/portal/admin/applications',
        pending: '/portal/admin/pending',
        more_info: '/portal/admin/more-info',
        approved: '/portal/admin/approved',
        rejected: '/portal/admin/rejected',
        catalog: '/portal/admin/catalog',
        accounts: '/portal/admin/accounts',
        audits: '/portal/admin/audits',
        settings: '/portal/admin/settings',
        update_password: '/update-password',
        download: '/download',
        install_guide: '/install-guide',
        payment_gateway: '/payment-gateway',
        about: '/about',
        faq: '/faq',
        contact: '/contact',
        safety: '/safety',
        report_abuse: '/report-abuse',
        terms: '/terms',
        privacy: '/privacy',
        cookie_policy: '/cookie-policy',
        dispute_policy: '/dispute-policy',
        cancellation_policy: '/cancellation-policy',
      };
      targetHash = routeByPage[targetPage as Page] || '/';
    }

    setPage(targetPage as Page);
    window.location.hash = targetHash;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    if (page === 'home') return <LandingPage onNavigate={navigate} />;
    if (page === 'apply') {
      return (
        <ApplyPage
          onNavigate={navigate}
          handoffCode={handoffCode}
          handoffContext={handoffContext}
        />
      );
    }
    if (page === 'status') return <StatusPage onNavigate={navigate} />;
    if (page === 'download') return <DownloadPage onNavigate={navigate} />;
    if (page === 'install_guide') return <InstallGuidePage onNavigate={navigate} />;
    if (page === 'payment_gateway') return <PaymentGateway />;

    if (page === 'dashboard') return <AdminDashboard onNavigate={navigate} />;
    if (page === 'reports') return <ReportsPage onNavigate={navigate} />;

    if (page === 'applications' || page === 'pending' || page === 'more_info' || page === 'approved' || page === 'rejected') {
      return (
        <ApplicationsTable
          onNavigate={navigate}
          currentPage={page}
          filterStatus={filterMap[page] ?? null}
        />
      );
    }

    if (page === 'application_detail') {
      return (
        <ApplicationDetail
          application={selectedApplication}
          applicationId={selectedApplicationId}
          onNavigate={navigate}
        />
      );
    }

    if (page === 'audits') return <AuditLogPage onNavigate={navigate} />;
    if (page === 'catalog') return <ServiceCatalogPage onNavigate={navigate} />;
    if (page === 'accounts') return <AccountsPage onNavigate={navigate} />;

    if (page === 'settings') {
      return <SettingsPage onNavigate={navigate} />;
    }

    if (page === 'email_verified') {
      return <EmailVerifiedPage />;
    }

    if (page === 'update_password') {
      return <UpdatePasswordPage />;
    }

    if (['about', 'faq', 'contact', 'safety', 'report_abuse', 'terms', 'privacy', 'cookie_policy', 'dispute_policy', 'cancellation_policy'].includes(page)) {
      return <SupportHub activeTab={page} onNavigate={navigate} />;
    }

    return <LandingPage onNavigate={navigate} />;
  };

  return <ErrorBoundary>{renderPage()}</ErrorBoundary>;
}
