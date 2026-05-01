import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

export function ProtectedRoute() {
  const { status, token } = useSelector((state) => state.auth);
  const location = useLocation();

  if (status === "checking" || status === "loading") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-6">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.45)] backdrop-blur-sm">
          <div className="mb-4 h-4 w-32 animate-pulse rounded-full bg-white/10" />
          <div className="mb-3 h-12 animate-pulse rounded-2xl bg-white/10" />
          <div className="h-12 animate-pulse rounded-2xl bg-white/10" />
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
