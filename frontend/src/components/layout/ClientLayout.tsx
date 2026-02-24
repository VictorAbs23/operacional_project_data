import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export function ClientLayout() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Header variant="client" />

      {/* Decorative gradient strip */}
      <div className="h-32 bg-gradient-to-b from-primary-50/60 to-transparent pointer-events-none" />

      <main className="max-w-4xl mx-auto -mt-20 px-4 pb-12 animate-fade-in flex-1 w-full">
        <Outlet />
      </main>

      {/* Minimal footer */}
      <footer className="border-t border-neutral-100 py-6 mt-auto">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <img
            src="/Logo_Absolut_Sport_Preto_e_Azul.svg"
            alt="AbsolutSport"
            className="h-5 opacity-30"
          />
          <span className="text-xs text-neutral-400">
            &copy; {new Date().getFullYear()} AbsolutSport
          </span>
        </div>
      </footer>
    </div>
  );
}
