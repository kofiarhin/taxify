import { Navigate, Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuthBootstrap } from "../hooks/useAuthBootstrap";
import { LoginPage } from "../pages/auth/LoginPage";
import { AdminOverviewPage } from "../pages/admin/AdminOverviewPage";
import { AdminUsersPage } from "../pages/admin/AdminUsersPage";
import { AdminDriversPage } from "../pages/admin/AdminDriversPage";
import { AdminBookingsPage } from "../pages/admin/AdminBookingsPage";
import { AdminQueuePage } from "../pages/admin/AdminQueuePage";
import { AdminTripsPage } from "../pages/admin/AdminTripsPage";
import { AdminCommissionsPage } from "../pages/admin/AdminCommissionsPage";
import { AdminComplaintsPage } from "../pages/admin/AdminComplaintsPage";
import { AgentWorkspacePage } from "../pages/agent/AgentWorkspacePage";
import { AgentBookingCreatePage } from "../pages/agent/AgentBookingCreatePage";
import { AgentQueuePage } from "../pages/agent/AgentQueuePage";
import { AgentComplaintsPage } from "../pages/agent/AgentComplaintsPage";
import { DriverWorkspacePage } from "../pages/driver/DriverWorkspacePage";
import { DriverTripsPage } from "../pages/driver/DriverTripsPage";
import { DriverCommissionsPage } from "../pages/driver/DriverCommissionsPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleRoute } from "./RoleRoute";

function HomeRedirect() {
  const user = useSelector((state) => state.auth.user);
  const status = useSelector((state) => state.auth.status);

  if (status === "checking") return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
  if (user.role === "AGENT") return <Navigate to="/agent" replace />;
  return <Navigate to="/driver" replace />;
}

export function AppRouter() {
  useAuthBootstrap();

  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
          <Route path="/admin" element={<AdminOverviewPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/drivers" element={<AdminDriversPage />} />
          <Route path="/admin/bookings" element={<AdminBookingsPage />} />
          <Route path="/admin/queue" element={<AdminQueuePage />} />
          <Route path="/admin/trips" element={<AdminTripsPage />} />
          <Route path="/admin/commissions" element={<AdminCommissionsPage />} />
          <Route path="/admin/complaints" element={<AdminComplaintsPage />} />
        </Route>
        <Route element={<RoleRoute allowedRoles={["AGENT"]} />}>
          <Route path="/agent" element={<AgentWorkspacePage />} />
          <Route path="/agent/bookings/new" element={<AgentBookingCreatePage />} />
          <Route path="/agent/queue" element={<AgentQueuePage />} />
          <Route path="/agent/complaints" element={<AgentComplaintsPage />} />
        </Route>
        <Route element={<RoleRoute allowedRoles={["DRIVER"]} />}>
          <Route path="/driver" element={<DriverWorkspacePage />} />
          <Route path="/driver/trips" element={<DriverTripsPage />} />
          <Route path="/driver/commissions" element={<DriverCommissionsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
