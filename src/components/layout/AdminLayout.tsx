import React, { useState } from 'react';
import {
  Shield, LayoutDashboard, FileText, CheckCircle, XCircle,
  ClipboardList, Settings, ChevronLeft, ChevronRight, LogOut,
  Clock, AlertCircle, Layers3, Users, Menu
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/portal/admin' },
  { id: 'applications', label: 'All Applications', icon: FileText, route: '/portal/admin/applications' },
  { id: 'pending', label: 'Pending Reviews', icon: Clock, route: '/portal/admin/pending' },
  { id: 'more_info', label: 'More Info Needed', icon: AlertCircle, route: '/portal/admin/more-info' },
  { id: 'approved', label: 'Approved', icon: CheckCircle, route: '/portal/admin/approved' },
  { id: 'rejected', label: 'Rejected', icon: XCircle, route: '/portal/admin/rejected' },
  { id: 'catalog', label: 'Service Catalog', icon: Layers3, route: '/portal/admin/catalog' },
  { id: 'accounts', label: 'Accounts', icon: Users, route: '/portal/admin/accounts' },
  { id: 'audits', label: 'Audit Log', icon: ClipboardList, route: '/portal/admin/audits' },
  { id: 'settings', label: 'Settings', icon: Settings, route: '/portal/admin/settings' },
];

export function AdminLayout({ children, currentPage = 'dashboard', onNavigate }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleNavigate = (item: typeof navItems[0]) => {
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
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
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
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-100 space-y-2">
          <button
            onClick={() => onNavigate?.('home')}
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
        <header className="border-b border-neutral-100 px-6 py-4 flex items-center justify-between"
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
                {navItems.find(n => n.id === currentPage)?.label || 'Dashboard'}
              </h1>
              <p className="text-xs text-text-muted">Artisans Verification Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-text-primary">Admin User</p>
              <p className="text-xs text-text-muted">admin@artisans.gh</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white text-sm font-bold">A</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: '#FFF8F0' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
