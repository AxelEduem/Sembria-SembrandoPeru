import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";

import Layout from "../../components/layout/Layout";

const MiHorario = lazy(() => import("../../pages/mihorario/MiHorario"));
const MiHorarioManualPage = lazy(() => import("../../pages/mihorario/MiHorarioManualPage"));
const HistorialHorarioPage = lazy(() => import("../../pages/mihorario/HistorialHorarioPage"));
const Horario = lazy(() => import("../../pages/horario/Horario"));
const HorarioManualPage = lazy(() => import("../../pages/horario/HorarioManualPage"));
const Asistencia = lazy(() => import("../../pages/asistencia/Asistencia"));
const AsistenciaManualPage = lazy(() => import("../../pages/asistencia/AsistenciaManualPage"));
const AsistenciaHistorial = lazy(() => import("../../pages/asistencia/AsistenciaHistorial"));
const AsistenciaSolicitudes = lazy(() => import("../../pages/asistencia/AsistenciaSolicitudes"));
const AsistenciaPermisoNuevo = lazy(() => import("../../pages/asistencia/AsistenciaPermisoNuevo"));
const AsistenciaFaltas = lazy(() => import("../../pages/asistencia/AsistenciaFaltas"));
const AsistenciaJustificacionNueva = lazy(
  () => import("../../pages/asistencia/AsistenciaJustificacionNueva"),
);
const AsistenciaAdministracion = lazy(
  () => import("../../pages/asistencia/AsistenciaAdministracion"),
);
const AsistenciaMetricas = lazy(() => import("../../pages/asistencia/AsistenciaMetricas"));
const AsistenciaConfiguracion = lazy(
  () => import("../../pages/asistencia/AsistenciaConfiguracion"),
);
const AsistenciaFeriados = lazy(
  () => import("../../pages/asistencia/AsistenciaFeriados"),
);
const AsistenciaSolicitudesAdmin = lazy(
  () => import("../../pages/asistencia/AsistenciaSolicitudesAdmin"),
);
const AsistenciaSolicitudesHistorialAdmin = lazy(
  () => import("../../pages/asistencia/AsistenciaSolicitudesHistorialAdmin"),
);
const AsistenciaAmonestacionesAdmin = lazy(
  () => import("../../pages/asistencia/AsistenciaAmonestacionesAdmin"),
);
const AsistenciaAdministracionManualPage = lazy(
  () => import("../../pages/asistencia/AsistenciaAdministracionManualPage"),
);
const AsistenciaDetalleAdmin = lazy(
  () => import("../../pages/asistencia/AsistenciaDetalleAdmin"),
);
const SolicitarCambioHorario = lazy(() => import("../../pages/SolicitarCambioHorario"));
const SolicitarCambioHorarioNuevo = lazy(
  () => import("../../pages/SolicitarCambioHorarioNuevo"),
);
const SolicitudesCambioHorario = lazy(() => import("../../pages/SolicitudesCambioHorario"));
const SolicitudesCambioHorarioManualPage = lazy(
  () => import("../../pages/SolicitudesCambioHorarioManualPage"),
);

import RoleRoute from "../RoleRoute";

import { ROUTE_PERMISSIONS } from "../routePermissions";

const AsistenciaRoutes = (
  <>
    <Route path="/mi-horario" element={<Layout><MiHorario /></Layout>} />
    <Route path="/mi-horario/historial" element={<Layout><HistorialHorarioPage /></Layout>} />
    <Route path="/mi-horario/manual" element={<Layout><MiHorarioManualPage /></Layout>} />
    <Route path="/cambiar-horario" element={<Layout><SolicitarCambioHorario /></Layout>} />
    <Route path="/cambiar-horario/nuevo" element={<Layout><SolicitarCambioHorarioNuevo /></Layout>} />

    <Route path="/horario" element={<Layout><Horario /></Layout>} />
    <Route path="/horario/manual" element={<Layout><HorarioManualPage /></Layout>} />

    <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.solicitudesCambioHorario} />}>
      <Route
        path="/solicitudes-cambio-horario"
        element={
          <Layout>
            <SolicitudesCambioHorario />
          </Layout>
        }
      />
      <Route
        path="/solicitudes-cambio-horario/manual"
        element={
          <Layout>
            <SolicitudesCambioHorarioManualPage />
          </Layout>
        }
      />
    </Route>

    <Route
      path="/asistencia"
      element={
        <Layout>
          <Asistencia />
        </Layout>
      }
    />
    <Route
      path="/asistencia/manual"
      element={
        <Layout>
          <AsistenciaManualPage />
        </Layout>
      }
    />
    <Route
      path="/asistencia/historial"
      element={
        <Layout>
          <AsistenciaHistorial />
        </Layout>
      }
    />
    <Route
      path="/asistencia/solicitudes"
      element={
        <Layout>
          <AsistenciaSolicitudes />
        </Layout>
      }
    />
    <Route
      path="/asistencia/solicitudes/nueva"
      element={
        <Layout>
          <AsistenciaPermisoNuevo />
        </Layout>
      }
    />
    <Route
      path="/asistencia/faltas"
      element={
        <Layout>
          <AsistenciaFaltas />
        </Layout>
      }
    />
    <Route
      path="/asistencia/faltas/:asistenciaId/justificar"
      element={
        <Layout>
          <AsistenciaJustificacionNueva />
        </Layout>
      }
    />
    <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.asistencia} />}>
      <Route
        path="/asistencia/seguimiento"
        element={<Navigate to="/asistencia/administracion" replace />}
      />

      <Route
        path="/asistencia/administracion"
        element={
          <Layout>
            <AsistenciaAdministracion />
          </Layout>
        }
      />
      <Route path="/asistencia/administracion/detalle" element={<Layout><AsistenciaDetalleAdmin /></Layout>} />
      <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.asistenciaVerMetricas} />}>
        <Route
          path="/asistencia/administracion/metricas"
          element={
            <Layout>
              <AsistenciaMetricas />
            </Layout>
          }
        />
      </Route>
      <Route
        element={
          <RoleRoute
            requiredPermission={ROUTE_PERMISSIONS.asistenciaGestionarConfiguracion}
            requiredScope="global"
          />
        }
      >
        <Route path="/asistencia/administracion/configuracion" element={<Layout><AsistenciaConfiguracion /></Layout>} />
        <Route path="/asistencia/administracion/feriados" element={<Layout><AsistenciaFeriados /></Layout>} />
      </Route>
      <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.asistenciaGestionarSolicitudes} />}>
        <Route path="/asistencia/administracion/solicitudes" element={<Layout><AsistenciaSolicitudesAdmin /></Layout>} />
      </Route>
      <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.asistenciaVerHistorialSolicitudes} />}>
        <Route path="/asistencia/administracion/solicitudes/historial" element={<Layout><AsistenciaSolicitudesHistorialAdmin /></Layout>} />
      </Route>
      <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.asistenciaGestionarAmonestaciones} />}>
        <Route path="/asistencia/administracion/amonestaciones" element={<Layout><AsistenciaAmonestacionesAdmin /></Layout>} />
      </Route>
      <Route path="/asistencia/administracion/manual" element={<Layout><AsistenciaAdministracionManualPage /></Layout>} />
    </Route>
  </>
);

export default AsistenciaRoutes;
