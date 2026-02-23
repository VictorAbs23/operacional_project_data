import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { AdminLayout } from './components/layout/AdminLayout';
import { ClientLayout } from './components/layout/ClientLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { ChangePasswordPage } from './pages/auth/ChangePasswordPage';
import { DashboardPage } from './pages/admin/DashboardPage';
import { ProposalsPage } from './pages/admin/ProposalsPage';
import { SyncPage } from './pages/admin/SyncPage';
import { UsersPage } from './pages/master/UsersPage';
import { AuditLogPage } from './pages/master/AuditLogPage';
import { ExportsPage } from './pages/admin/ExportsPage';
import { ProposalDetailPage } from './pages/admin/ProposalDetailPage';
import { DataMatrixPage } from './pages/admin/DataMatrixPage';
import { ClientDashboard } from './pages/client/ClientDashboard';
import { ProposalFormPage } from './pages/client/ProposalFormPage';
import { PassengerFormPage } from './pages/client/PassengerFormPage';

export function AppRouter() {
  const user = useAuthStore((s) => s.user);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/change-password" element={
        <ProtectedRoute>
          <ChangePasswordPage />
        </ProtectedRoute>
      } />

      {/* Admin / Master routes */}
      <Route path="/admin" element={
        <ProtectedRoute roles={['MASTER', 'ADMIN']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<DashboardPage />} />
        <Route path="proposals" element={<ProposalsPage />} />
        <Route path="proposals/:id" element={<ProposalDetailPage />} />
        <Route path="proposals/:id/matrix" element={<DataMatrixPage />} />
        <Route path="sync" element={<SyncPage />} />
        <Route path="exports" element={<ExportsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="audit" element={<AuditLogPage />} />
      </Route>

      {/* Client routes */}
      <Route path="/client" element={
        <ProtectedRoute roles={['CLIENT']}>
          <ClientLayout />
        </ProtectedRoute>
      }>
        <Route index element={<ClientDashboard />} />
        <Route path="proposal/:accessId" element={<ProposalFormPage />} />
        <Route path="proposal/:accessId/passenger/:slotId" element={<PassengerFormPage />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={
        user?.role === 'CLIENT'
          ? <Navigate to="/client" replace />
          : <Navigate to="/admin" replace />
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
