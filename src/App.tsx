import { useEffect, useState } from 'react';
import { LandingPage } from './pages/LandingPage';
import { ApplyPage } from './pages/ApplyPage';
import { StatusPage } from './pages/StatusPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ApplicationsTable } from './pages/admin/ApplicationsTable';
import { ApplicationDetail } from './pages/admin/ApplicationDetail';
import { AuditLogPage } from './pages/admin/AuditLogPage';
import { EmailVerifiedPage } from './pages/EmailVerifiedPage';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import type { WorkerVerification, VerificationStatus } from './types';
import { apiPost } from './lib/api';

type Page =
  | 'home'
  | 'apply'
  | 'status'
  | 'dashboard'
  | 'applications'
  | 'pending'
  | 'more_info'
  | 'approved'
  | 'rejected'
  | 'application_detail'
  | 'audits'
  | 'settings'
  | 'email_verified';

const filterMap: Record<string, VerificationStatus | null> = {
  pending: 'pending',
  more_info: 'more_info_requested',
  approved: 'approved',
  rejected: 'rejected',
  applications: null,
};

function getInitialPage(): Page {
  const hash = window.location.hash.replace('#', '') || '/';
  if (window.location.pathname.includes('/email-verified') || hash.startsWith('/email-verified')) return 'email_verified';
  if (hash.startsWith('/portal/admin/audits')) return 'audits';
  if (hash.startsWith('/portal/admin/applications')) return 'applications';
  if (hash.startsWith('/portal/admin')) return 'dashboard';
  if (hash.startsWith('/apply')) return 'apply';
  if (hash.startsWith('/status')) return 'status';
  return 'home';
}

export default function App() {
  const [page, setPage] = useState<Page>(getInitialPage());
  const [selectedApplication, setSelectedApplication] = useState<WorkerVerification | null>(null);
  const [handoffCode, setHandoffCode] = useState('');
  const [handoffContext, setHandoffContext] = useState<Record<string, unknown> | null>(null);

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
    if (targetPage === 'application_detail' && data) {
      setSelectedApplication(data as WorkerVerification);
    }
    setPage(targetPage as Page);
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

    if (page === 'dashboard') return <AdminDashboard onNavigate={navigate} />;

    if (page === 'applications' || page === 'pending' || page === 'more_info' || page === 'approved' || page === 'rejected') {
      return (
        <ApplicationsTable
          onNavigate={navigate}
          currentPage={page}
          filterStatus={filterMap[page] ?? null}
        />
      );
    }

    if (page === 'application_detail' && selectedApplication) {
      return <ApplicationDetail application={selectedApplication} onNavigate={navigate} />;
    }

    if (page === 'audits') return <AuditLogPage onNavigate={navigate} />;

    if (page === 'settings') {
      return <AdminDashboard onNavigate={navigate} />;
    }

    if (page === 'email_verified') {
      return <EmailVerifiedPage />;
    }

    return <LandingPage onNavigate={navigate} />;
  };

  return <ErrorBoundary>{renderPage()}</ErrorBoundary>;
}
