import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { hasAccessTotal } from "@/utils/permissions";
export default function AccessTotalRoute() {
  const { profile, loading, isAuthenticated } = useAuth();
  if (loading) return null;
  return isAuthenticated && hasAccessTotal(profile) ? (
    <Outlet />
  ) : (
    <Navigate to="/acceso-denegado" replace />
  );
}
