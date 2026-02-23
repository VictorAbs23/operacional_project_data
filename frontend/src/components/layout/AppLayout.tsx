import { Outlet } from 'react-router-dom';
import { ToastProvider } from '../ui/Toast';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Outlet />
      <ToastProvider />
    </div>
  );
}
