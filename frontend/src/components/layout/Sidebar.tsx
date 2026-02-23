import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useLanguageStore } from '../../stores/languageStore';
import { LayoutDashboard, FileText, RefreshCw, Download, Users, UserCheck, Shield, X } from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const t = useLanguageStore((s) => s.t);
  const isMaster = user?.role === 'MASTER';

  const links = [
    { to: '/admin', icon: LayoutDashboard, label: t('nav.dashboard'), end: true },
    { to: '/admin/proposals', icon: FileText, label: t('nav.proposals') },
    { to: '/admin/clients', icon: UserCheck, label: t('nav.clients') },
    { to: '/admin/sync', icon: RefreshCw, label: t('nav.sync') },
    { to: '/admin/exports', icon: Download, label: t('nav.exports') },
    ...(isMaster ? [
      { to: '/admin/users', icon: Users, label: t('nav.users') },
      { to: '/admin/audit', icon: Shield, label: t('nav.audit') },
    ] : []),
  ];

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-primary-50 text-primary-600 border-l-[3px] border-primary-500 pl-[13px]'
        : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 border-l-[3px] border-transparent pl-[13px]'
    }`;

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={`fixed top-0 left-0 h-screen w-64 bg-white border-r border-neutral-200 z-40 transform transition-transform lg:translate-x-0 flex flex-col ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo area — aligned with top bar height (h-14) */}
        <div className="h-14 flex items-center justify-between px-5 border-b border-neutral-200 shrink-0">
          <img
            src="/Logo_Absolut_Sport_Preto_e_Azul.svg"
            alt="AbsolutSport"
            className="h-7"
          />
          {/* Mobile close */}
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 lg:hidden">
            <X className="h-5 w-5 text-neutral-500" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 pt-4 space-y-1 overflow-y-auto">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={navLinkClass} onClick={onClose}>
              <link.icon className="h-5 w-5" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-100">
          <p className="text-[10px] text-neutral-300 font-mono">v0.1</p>
        </div>
      </aside>
    </>
  );
}
