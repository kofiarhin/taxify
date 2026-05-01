import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

export function RoleRoute({ allowedRoles }) {
  const user = useSelector((state) => state.auth.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultRoute(user.role)} replace />;
  }

  return <Outlet />;
}

function getDefaultRoute(role) {
  if (role === "ADMIN") {
    return "/admin";
  }

  if (role === "AGENT") {
    return "/agent";
  }

  return "/driver";
}
