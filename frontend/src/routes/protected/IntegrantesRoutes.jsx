import { lazy } from "react";
import { Navigate, Route, useLocation } from "react-router-dom";

import Layout from "../../components/layout/Layout";

const IntegrantesPage = lazy(() => import("../../pages/Integrantes/IntegrantesPage"));
const IntegranteFormPage = lazy(() => import("../../pages/Integrantes/IntegranteFormPage"));
const IntegranteDetailPage = lazy(() => import("../../pages/Integrantes/IntegranteDetailPage"));
const IntegranteHistoryPage = lazy(() => import("../../pages/Integrantes/IntegranteHistoryPage"));
const IntegranteRehirePage = lazy(() => import("../../pages/Integrantes/IntegranteRehirePage"));
const IntegrantesManualPage = lazy(() => import("../../pages/Integrantes/IntegrantesManualPage"));
const IntegrantesMetricsPage = lazy(() => import("../../pages/Integrantes/IntegrantesMetricsPage"));

import RoleRoute from "../RoleRoute";
import { ROUTE_PERMISSIONS } from "../routePermissions";

/** Redirect que preserva los search params (filtros de la URL). */
function NavigateWithSearch({ to, ...rest }) {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}`} {...rest} />;
}

const IntegrantesRoutes = (
  <>
    <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.integrantes} />}>
      {/* Listado de integrantes */}
      <Route
        path="/integrantes"
        element={
          <Layout>
            <IntegrantesPage />
          </Layout>
        }
      />

      {/* Manual del módulo */}
      <Route
        path="/integrantes/manual"
        element={
          <Layout>
            <IntegrantesManualPage />
          </Layout>
        }
      />

      <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.integrantesVerMetricas} />}>
        <Route
          path="/integrantes/metricas"
          element={
            <Layout>
              <IntegrantesMetricsPage />
            </Layout>
          }
        />
      </Route>

      {/* Crear integrante */}
      <Route
        element={
          <RoleRoute requiredPermission={ROUTE_PERMISSIONS.integrantesCrear} />
        }
      >
        <Route
          path="/integrantes/nuevo"
          element={
            <Layout>
              <IntegranteFormPage mode="create" />
            </Layout>
          }
        />
      </Route>

      {/* Detalle de integrante */}
      <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.integrantesVerDetalle} />}>
        <Route
          path="/integrantes/:id"
          element={
            <Layout>
              <IntegranteDetailPage />
            </Layout>
          }
        />
      </Route>

      {/* Historial completo del integrante */}
      <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.integrantesVerHistorial} />}>
        <Route
          path="/integrantes/:id/historial"
          element={
            <Layout>
              <IntegranteHistoryPage />
            </Layout>
          }
        />
      </Route>

      {/* Editar integrante */}
      <Route
        element={
          <RoleRoute requiredPermission={ROUTE_PERMISSIONS.integrantesEditar} />
        }
      >
        <Route
          path="/integrantes/:id/editar"
          element={
            <Layout>
              <IntegranteFormPage mode="edit" />
            </Layout>
          }
        />
      </Route>

      {/* Recontratar integrante */}
      <Route
        element={
          <RoleRoute requiredPermission={ROUTE_PERMISSIONS.integrantesRecontratar} />
        }
      >
        <Route
          path="/integrantes/:id/recontratar"
          element={
            <Layout>
              <IntegranteRehirePage />
            </Layout>
          }
        />
      </Route>
    </Route>

    <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.voluntarios} />}>
      <Route
        path="/voluntarios"
        element={
          <Layout>
            <NavigateWithSearch to="/integrantes" replace />
          </Layout>
        }
      />

      <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.voluntariosCrear} />}>
        <Route
          path="/voluntarios/nuevo"
          element={
            <Layout>
              <NavigateWithSearch to="/integrantes/nuevo" replace />
            </Layout>
          }
        />
      </Route>

      <Route
        path="/voluntarios/:id"
        element={
          <Layout>
            <NavigateWithSearch to="/integrantes" replace />
          </Layout>
        }
      />

      <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.voluntariosEditar} />}>
        <Route
          path="/voluntarios/:id/editar"
          element={
            <Layout>
              <NavigateWithSearch to="/integrantes" replace />
            </Layout>
          }
        />
      </Route>
    </Route>

    <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.practicantes} />}>
      <Route
        path="/practicantes"
        element={
          <Layout>
            <NavigateWithSearch to="/integrantes" replace />
          </Layout>
        }
      />

      <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.practicantesCrear} />}>
        <Route
          path="/practicantes/nuevo"
          element={
            <Layout>
              <NavigateWithSearch to="/integrantes/nuevo" replace />
            </Layout>
          }
        />
      </Route>

      <Route
        path="/practicantes/:id"
        element={
          <Layout>
            <NavigateWithSearch to="/integrantes" replace />
          </Layout>
        }
      />

      <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.practicantesEditar} />}>
        <Route
          path="/practicantes/:id/editar"
          element={
            <Layout>
              <NavigateWithSearch to="/integrantes" replace />
            </Layout>
          }
        />
      </Route>
    </Route>
  </>
);

export default IntegrantesRoutes;
