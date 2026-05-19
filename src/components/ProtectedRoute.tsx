import { Navigate, Outlet } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";

export function ProtectedRoute() {
  const authed = useAppStore((s) => s.authed);

  if (!authed) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
}

export function AdminRoute() {
  const { authed, user } = useAppStore();

  if (!authed) {
    return <Navigate to="/auth/login" replace />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
