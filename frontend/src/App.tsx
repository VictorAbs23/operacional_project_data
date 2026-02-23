import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router';
import { useAuthStore } from './stores/authStore';
import { ToastProvider } from './components/ui/Toast';

export default function App() {
  const validateSession = useAuthStore((s) => s.validateSession);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  return (
    <BrowserRouter>
      <AppRouter />
      <ToastProvider />
    </BrowserRouter>
  );
}
