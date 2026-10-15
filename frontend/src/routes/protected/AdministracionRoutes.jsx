import { lazy } from "react";
import { Route } from "react-router-dom";

import Layout from "../../components/layout/Layout";

const Accesos = lazy(() => import("../../pages/accesos/Accesos"));
const AccesosManualPage = lazy(() => import("../../pages/accesos/AccesosManualPage"));
const AccesosMetricsPage = lazy(() => import("../../pages/accesos/AccesosMetricsPage"));
const AccesosInactivosPage = lazy(() => import("../../pages/accesos/AccesosInactivosPage"));
const Aplicaciones = lazy(() => import("../../pages/aplicaciones/Aplicaciones"));
const AplicacionesManualPage = lazy(() => import("../../pages/aplicaciones/AplicacionesManualPage"));
const Cumpleanos = lazy(() => import("../../pages/cumpleanos/Cumpleanos"));
const CumpleanosManualPage = lazy(() => import("../../pages/cumpleanos/CumpleanosManualPage"));
const CumpleanosMetricsPage = lazy(() => import("../../pages/cumpleanos/CumpleanosMetricsPage"));
const Areas = lazy(() => import("../../pages/areas/Areas"));
const Cargos = lazy(() => import("../../pages/Cargos/Cargos"));
const Roles = lazy(() => import("../../pages/Roles/Roles"));
const Usuarios = lazy(() => import("../../pages/usuarios/Usuarios"));
const UsuariosManualPage = lazy(() => import("../../pages/usuarios/UsuariosManualPage"));
const Bitacora = lazy(() => import("../../pages/bitacora/Bitacora"));
const BitacoraMetricsPage = lazy(() => import("../../pages/bitacora/BitacoraMetricsPage"));
const BitacoraManualPage = lazy(() => import("../../pages/bitacora/BitacoraManualPage"));

import RoleRoute from "../RoleRoute";
import { ROUTE_PERMISSIONS } from "../routePermissions";

const AdministracionRoutes = (
  <>
    {/* Bitácora */}
    <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.bitacora} />}>
      <Route
        path="/bitacora"
        element={
          <Layout>
            <Bitacora />
          </Layout>
        }
      />
      <Route
        path="/bitacora/manual"
        element={
          <Layout>
            <BitacoraManualPage />
          </Layout>
        }
      />
      <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.bitacoraVerMetricas} />}>
        <Route
          path="/bitacora/metricas"
          element={
            <Layout>
              <BitacoraMetricsPage />
            </Layout>
          }
        />
      </Route>
    </Route>

    {/* Aplicaciones */}
    <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.aplicaciones} />}>
      <Route
        path="/aplicaciones"
        element={
          <Layout>
            <Aplicaciones />
          </Layout>
        }
      />
      <Route
        path="/aplicaciones/manual"
        element={
          <Layout>
            <AplicacionesManualPage />
          </Layout>
        }
      />
    </Route>

    {/* Accesos */}
    <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.accesos} />}>
      <Route
        path="/accesos"
        element={
          <Layout>
            <Accesos />
          </Layout>
        }
      />
      <Route
        path="/accesos/manual"
        element={
          <Layout>
            <AccesosManualPage />
          </Layout>
        }
      />
      <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.accesosVerInactivos} />}>
        <Route
          path="/accesos/inactivos"
          element={
            <Layout>
              <AccesosInactivosPage />
            </Layout>
          }
        />
      </Route>
      <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.accesosVerMetricas} />}>
        <Route
          path="/accesos/metricas"
          element={
            <Layout>
              <AccesosMetricsPage />
            </Layout>
          }
        />
      </Route>
    </Route>

    {/* Cumpleaños */}
    <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.cumpleanos} />}>
      <Route
        path="/cumpleanos"
        element={
          <Layout>
            <Cumpleanos />
          </Layout>
        }
      />
      <Route
        path="/cumpleanos/manual"
        element={
          <Layout>
            <CumpleanosManualPage />
          </Layout>
        }
      />
      <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.cumpleanosVerMetricas} />}>
        <Route
          path="/cumpleanos/metricas"
          element={
            <Layout>
              <CumpleanosMetricsPage />
            </Layout>
          }
        />
      </Route>
    </Route>

    {/* Áreas */}
    <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.areas} />}>
      <Route
        path="/areas"
        element={
          <Layout>
            <Areas />
          </Layout>
        }
      />
    </Route>

    {/* Cargos */}
    <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.cargos} />}>
      <Route
        path="/cargos"
        element={
          <Layout>
            <Cargos />
          </Layout>
        }
      />
    </Route>

    {/* Roles */}
    <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.roles} />}>
      <Route
        path="/roles"
        element={
          <Layout>
            <Roles />
          </Layout>
        }
      />
    </Route>

    {/* Usuarios */}
    <Route element={<RoleRoute requiredPermission={ROUTE_PERMISSIONS.usuarios} />}>
      <Route
        path="/usuarios"
        element={
          <Layout>
            <Usuarios />
          </Layout>
        }
      />
      <Route
        path="/usuarios/manual"
        element={
          <Layout>
            <UsuariosManualPage />
          </Layout>
        }
      />
    </Route>
  </>
);

export default AdministracionRoutes;
