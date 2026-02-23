import { useAuthStore } from '../../stores/authStore';
import { useLanguageStore } from '../../stores/languageStore';
import { LanguageToggle } from '../shared/LanguageToggle';
import { Avatar } from '../ui/Avatar';
import { LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const t = useLanguageStore((s) => s.t);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-4 lg:px-8">
      {/* Mobile: hamburger + logo */}
      <div className="flex items-center gap-3 lg:hidden">
        {onMenuToggle && (
          <button onClick={onMenuToggle} className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
            <Menu className="h-5 w-5 text-neutral-700" />
          </button>
        )}
        <img
          src="/Logo_Absolut_Sport_Preto_e_Azul.svg"
          alt="AbsolutSport"
          className="h-6"
        />
      </div>

      {/* Desktop: empty left side (logo is in sidebar) */}
      <div className="hidden lg:block" />

      {/* Right controls */}
      <div className="flex items-center gap-3">
        <LanguageToggle />
        <div className="h-5 w-px bg-neutral-200" />
        <div className="flex items-center gap-2.5">
          <Avatar src={user?.profilePhotoUrl} name={user?.name} size="sm" />
          <span className="hidden sm:block text-sm font-medium text-neutral-700">{user?.name}</span>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
          title={t('auth.logout')}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
