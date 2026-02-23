import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export function ClientLayout() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      <main className="max-w-4xl mx-auto pt-6 px-4 pb-12 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}
