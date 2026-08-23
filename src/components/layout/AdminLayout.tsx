import { useState } from 'react';
import {
  Shield, LayoutDashboard, FileText,
  ClipboardList, Settings, ChevronLeft, ChevronRight, LogOut,
  Clock, AlertCircle, Layers3, Users, Menu, ShieldAlert
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

const navSections = [
  {
    title: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/portal/admin' },
    ],
  },
  {
    title: 'Verification & Safety',
    items: [
      { id: 'applications', label: 'Applications Queue', icon: FileText, route: '/portal/admin/applications' },
      { id: 'pending', label: 'Pending Reviews', icon: Clock, route: '/portal/admin/pending' },
      { id: 'more_info', label: 'Awaiting Docs', icon: AlertCircle, route: '/portal/admin/more-info' },
      { id: 'reports', label: 'Trust & Safety', icon: ShieldAlert, route: '/portal/admin/reports' },
    ],
  },
  {
    title: 'Management',
    items: [
      { id: 'accounts', label: 'Accounts Manager', icon: Users, route: '/portal/admin/accounts' },
      { id: 'catalog', label: 'Service Catalog', icon: Layers3, route: '/portal/admin/catalog' },
    ],
  },
  {
    title: 'System',
    items: [
      { id: 'audits', label: 'Audit Trail', icon: ClipboardList, route: '/portal/admin/audits' },
      { id: 'settings', label: 'System Settings', icon: Settings, route: '/portal/admin/settings' },
    ],
  },
];

const allNavItems = navSections.flatMap((s) => s.items);

export function AdminLayout({ children, currentPage = 'dashboard', onNavigate }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<{ email?: string; name?: string }>({
    name: 'Admin User',
    email: 'admin@artisans.gh',
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setAdminUser({
          email: data.user.email || 'admin@artisans.gh',
          name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Admin User',
        });
      }
    }).catch(() => {});
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (_) {}
    if (onNavigate) onNavigate('home');
  };

  const handleNavigate = (item: typeof allNavItems[0]) => {
    window.location.hash = item.route;
    setIsMobileOpen(false);
    if (onNavigate) onNavigate(item.id);
  };

  return (
    <div className="flex h-screen bg-surface-base overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`z-50 border-r border-neutral-100 flex flex-col transition-all duration-300 md:static md:translate-x-0 flex-shrink-0
          ${isMobileOpen 
            ? 'fixed inset-y-0 left-0 w-56 translate-x-0' 
            : 'hidden md:flex -translate-x-full'}
          ${collapsed ? 'md:w-16' : 'md:w-56'}`}
        style={{ backgroundColor: '#FFFCF8' }}
      >
        {/* Logo */}
        <div className="p-4 border-b border-neutral-100">
          <div className={`flex items-center gap-2.5 ${collapsed ? 'md:justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0"
              style={{ boxShadow: '0 2px 8px rgba(193,90,61,0.3)' }}>
              <Shield size={16} className="text-white" />
            </div>
            {(!collapsed || isMobileOpen) && (
              <div>
                <p className="font-bold text-text-primary text-sm leading-tight">CraftMatch</p>
                <p className="text-[10px] text-text-muted">Admin Portal</p>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto scrollbar-hide">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {(!collapsed || isMobileOpen) && (
                <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 mb-1">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                const isCollapsedState = collapsed && !isMobileOpen;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item)}
                    className={`w-full text-left ${isActive ? 'sidebar-item-active' : 'sidebar-item'} ${isCollapsedState ? 'justify-center px-2' : ''}`}
                    title={isCollapsedState ? item.label : undefined}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {(!collapsed || isMobileOpen) && <span>{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-100 space-y-2">
          <button
            onClick={handleSignOut}
            className={`w-full sidebar-item ${(collapsed && !isMobileOpen) ? 'justify-center px-2' : ''} text-error hover:bg-error-light hover:text-error`}
            title={(collapsed && !isMobileOpen) ? 'Sign Out' : undefined}
          >
            <LogOut size={18} />
            {(!collapsed || isMobileOpen) && <span>Sign Out</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full sidebar-item justify-center hidden md:flex"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="border-b border-neutral-100 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between"
          style={{ backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-1.5 rounded-lg border border-neutral-200 text-text-primary hover:bg-neutral-50 md:hidden flex-shrink-0"
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-text-primary capitalize">
                {allNavItems.find(n => n.id === currentPage)?.label || 'Dashboard'}
              </h1>
              <p className="text-xs text-text-muted">Artisans Verification Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-text-primary">{adminUser.name}</p>
              <p className="text-xs text-text-muted">{adminUser.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white text-sm font-bold">{(adminUser.name || 'A').charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6" style={{ backgroundColor: '#FFF8F0' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
