import { Navigate, Outlet } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { auth } from "@/lib/firebase";

export function ProtectedRoute() {
  const { authed, user } = useAppStore();
  const firebaseUser = auth.currentUser;

  if (!authed || !firebaseUser || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
}

export function AdminRoute() {
  const { authed, user } = useAppStore();
  const firebaseUser = auth.currentUser;

  if (!authed || !firebaseUser || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
