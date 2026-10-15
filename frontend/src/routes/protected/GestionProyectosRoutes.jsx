import { lazy } from "react";
import { Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import RoleRoute from "@/routes/RoleRoute";
import { ROUTE_PERMISSIONS } from "@/routes/routePermissions";
import { PERMISSIONS } from "@/utils/permissions";

const Convocatorias = lazy(() => import("@/pages/gestion-proyectos/Convocatorias"));
const ConvocatoriasManualPage = lazy(
  () => import("@/pages/gestion-proyectos/ConvocatoriasManualPage"),
);
const ConvocatoriaFormPage = lazy(
  () => import("@/pages/gestion-proyectos/ConvocatoriaFormPage"),
);
const ConvocatoriaDetailPage = lazy(
  () => import("@/pages/gestion-proyectos/ConvocatoriaDetailPage"),
);
const ConvocatoriaEvaluationPage = lazy(
  () => import("@/pages/gestion-proyectos/ConvocatoriaEvaluationPage"),
);
const ConvocatoriaSecondFilterPage = lazy(
  () => import("@/pages/gestion-proyectos/ConvocatoriaSecondFilterPage"),
);
const ConvocatoriaApprovalPage = lazy(
  () => import("@/pages/gestion-proyectos/ConvocatoriaApprovalPage"),
);
const ConvocatoriaPostulacionPage = lazy(
  () => import("@/pages/gestion-proyectos/ConvocatoriaPostulacionPage"),
);
const ConvocatoriaSeguimientoPage = lazy(
  () => import("@/pages/gestion-proyectos/ConvocatoriaSeguimientoPage"),
);
const Equipos = lazy(() => import("@/pages/gestion-proyectos/Equipos"));
const EquipoFormPage = lazy(() => import("@/pages/gestion-proyectos/EquipoFormPage"));
const EquipoManualPage = lazy(() => import("@/pages/gestion-proyectos/EquipoManualPage"));
const EquipoMetricsPage = lazy(() => import("@/pages/gestion-proyectos/EquipoMetricsPage"));
const CapacitacionPage = lazy(() => import("@/pages/gestion-proyectos/CapacitacionPage"));

const GestionProyectosRoutes = (
  <>
  <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.gpCapacitaciones} />}>
    <Route
      path="/gestion-proyectos/capacitacion"
      element={<Layout><CapacitacionPage /></Layout>}
    />
  </Route>
  <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.gpEquipos} />}>
    <Route
      path="/gestion-proyectos/detecta/equipos"
      element={<Layout><Equipos /></Layout>}
    />
    <Route
      path="/gestion-proyectos/detecta/equipos/manual"
      element={<Layout><EquipoManualPage /></Layout>}
    />
    <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.gpEquiposCrear} />}>
      <Route
        path="/gestion-proyectos/detecta/equipos/nuevo"
        element={<Layout><EquipoFormPage /></Layout>}
      />
    </Route>
    <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.gpEquiposEditar} />}>
      <Route
        path="/gestion-proyectos/detecta/equipos/:equipoId/editar"
        element={<Layout><EquipoFormPage /></Layout>}
      />
    </Route>
    <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.gpEquiposVerMetricas} />}>
      <Route
        path="/gestion-proyectos/detecta/equipos/metricas"
        element={<Layout><EquipoMetricsPage /></Layout>}
      />
    </Route>
  </Route>
  <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.convocatorias} />}>
    <Route
      path="/gestion-proyectos/detecta/convocatorias"
      element={
        <Layout>
          <Convocatorias />
        </Layout>
      }
    />
    <Route
      path="/gestion-proyectos/detecta/convocatorias/manual"
      element={
        <Layout>
          <ConvocatoriasManualPage />
        </Layout>
      }
    />
    <Route
      path="/gestion-proyectos/detecta/convocatorias/:id"
      element={
        <Layout>
          <ConvocatoriaDetailPage />
        </Layout>
      }
    />
    <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.gpConvocatoriasCrear} />}>
      <Route
        path="/gestion-proyectos/detecta/convocatorias/nueva"
        element={
          <Layout>
            <ConvocatoriaFormPage mode="new" />
          </Layout>
        }
      />
    </Route>
    <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.gpConvocatoriasEditar} />}>
      <Route
        path="/gestion-proyectos/detecta/convocatorias/:id/editar"
        element={
          <Layout>
            <ConvocatoriaFormPage mode="edit" />
          </Layout>
        }
      />
    </Route>
    <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.gpConvocatoriasEvaluar} />}>
      <Route
        path="/gestion-proyectos/detecta/convocatorias/:id/evaluacion"
        element={<Layout><ConvocatoriaEvaluationPage /></Layout>}
      />
    </Route>
    <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.gpConvocatoriasRevisar} />}>
      <Route
        path="/gestion-proyectos/detecta/convocatorias/:id/segundo-filtro"
        element={<Layout><ConvocatoriaSecondFilterPage /></Layout>}
      />
    </Route>
    <Route element={<RoleRoute requiredAnyPermissions={[ROUTE_PERMISSIONS.gpConvocatoriasAprobar, PERMISSIONS.GP_CONVOCATORIAS_VER_APROBACION]} />}>
      <Route path="/gestion-proyectos/detecta/convocatorias/:id/aprobacion" element={<Layout><ConvocatoriaApprovalPage /></Layout>} />
    </Route>
    <Route element={<RoleRoute requiredAnyPermissions={[ROUTE_PERMISSIONS.gpConvocatoriasPostular, PERMISSIONS.GP_CONVOCATORIAS_VER_POSTULACION, PERMISSIONS.GP_CONVOCATORIAS_VER_ENVIO]} />}>
      <Route path="/gestion-proyectos/detecta/convocatorias/:id/postulacion" element={<Layout><ConvocatoriaPostulacionPage /></Layout>} />
    </Route>
    <Route element={<RoleRoute requiredAnyPermissions={[ROUTE_PERMISSIONS.gpConvocatoriasPostular, PERMISSIONS.GP_CONVOCATORIAS_VER_SEGUIMIENTO, PERMISSIONS.GP_CONVOCATORIAS_VER_CIERRE]} />}>
      <Route path="/gestion-proyectos/detecta/convocatorias/:id/seguimiento" element={<Layout><ConvocatoriaSeguimientoPage /></Layout>} />
    </Route>
  </Route>
  </>
);

export default GestionProyectosRoutes;
