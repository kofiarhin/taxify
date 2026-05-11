import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminBookingsPage } from '../pages/admin/AdminBookingsPage';
import { AdminCommissionsPage } from '../pages/admin/AdminCommissionsPage';
import { AdminComplaintsPage } from '../pages/admin/AdminComplaintsPage';
import { AdminDriversPage } from '../pages/admin/AdminDriversPage';
import { AdminOverviewPage } from '../pages/admin/AdminOverviewPage';
import { AgentComplaintsPage } from '../pages/agent/AgentComplaintsPage';
import { AgentQueuePage } from '../pages/agent/AgentQueuePage';
import { AgentWorkspacePage } from '../pages/agent/AgentWorkspacePage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterClientPage } from '../pages/auth/RegisterClientPage';
import { ClientBookingCreatePage } from '../pages/client/ClientBookingCreatePage';
import { ClientCurrentBookingPage } from '../pages/client/ClientCurrentBookingPage';
import { ClientDashboardPage } from '../pages/client/ClientDashboardPage';
import { DriverCommissionsPage } from '../pages/driver/DriverCommissionsPage';
import { DriverWorkspacePage } from '../pages/driver/DriverWorkspacePage';
import { AppShell } from '../components/shared/AppShell';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterClientPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route element={<RoleRoute roles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminOverviewPage />} />
            <Route path="/admin/drivers" element={<AdminDriversPage />} />
            <Route path="/admin/bookings" element={<AdminBookingsPage />} />
            <Route path="/admin/commissions" element={<AdminCommissionsPage />} />
            <Route path="/admin/complaints" element={<AdminComplaintsPage />} />
          </Route>
          <Route element={<RoleRoute roles={['AGENT']} />}>
            <Route path="/agent" element={<AgentWorkspacePage />} />
            <Route path="/agent/queue" element={<AgentQueuePage />} />
            <Route path="/agent/complaints" element={<AgentComplaintsPage />} />
          </Route>
          <Route element={<RoleRoute roles={['DRIVER']} />}>
            <Route path="/driver" element={<DriverWorkspacePage />} />
            <Route path="/driver/commissions" element={<DriverCommissionsPage />} />
          </Route>
          <Route element={<RoleRoute roles={['CLIENT']} />}>
            <Route path="/client" element={<ClientDashboardPage />} />
            <Route path="/client/book" element={<ClientBookingCreatePage />} />
            <Route path="/client/current" element={<ClientCurrentBookingPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
