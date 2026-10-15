import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { getPermissionScope, hasAnyPermission, hasPermission } from "@/utils/permissions";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />

        <p className="text-sm text-slate-500">Verificando permisos...</p>
      </div>
    </div>
  );
}

function RoleRoute({ requiredPermission, requiredAnyPermissions = [], requiredScope = null }) {
  const { profile, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!profile) {
    return <Navigate to="/acceso-denegado" replace />;
  }

  if (!profile.role || profile.role.activo !== true) {
    return <Navigate to="/acceso-denegado" replace />;
  }

  if (requiredPermission && !hasPermission(profile, requiredPermission)) {
    return <Navigate to="/acceso-denegado" replace />;
  }

  if (
    requiredPermission &&
    requiredScope &&
    getPermissionScope(profile, requiredPermission) !== requiredScope
  ) {
    return <Navigate to="/acceso-denegado" replace />;
  }

  if (requiredAnyPermissions.length > 0 && !hasAnyPermission(profile, requiredAnyPermissions)) {
    return <Navigate to="/acceso-denegado" replace />;
  }

  return <Outlet />;
}

export default RoleRoute;
