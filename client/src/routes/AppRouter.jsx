import { Navigate, Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuthBootstrap } from "../hooks/useAuthBootstrap";
import { LoginPage } from "../pages/auth/LoginPage";
import { AdminOverviewPage } from "../pages/admin/AdminOverviewPage";
import { AdminUsersPage } from "../pages/admin/AdminUsersPage";
import { AgentWorkspacePage } from "../pages/agent/AgentWorkspacePage";
import { DriverWorkspacePage } from "../pages/driver/DriverWorkspacePage";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleRoute } from "./RoleRoute";

function HomeRedirect() {
  const user = useSelector((state) => state.auth.user);
  const status = useSelector((state) => state.auth.status);

  if (status === "checking") {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  if (user.role === "AGENT") {
    return <Navigate to="/agent" replace />;
  }

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
        </Route>
        <Route element={<RoleRoute allowedRoles={["AGENT"]} />}>
          <Route path="/agent" element={<AgentWorkspacePage />} />
        </Route>
        <Route element={<RoleRoute allowedRoles={["DRIVER"]} />}>
          <Route path="/driver" element={<DriverWorkspacePage />} />
        </Route>
      </Route>
    </Routes>
  );
}
