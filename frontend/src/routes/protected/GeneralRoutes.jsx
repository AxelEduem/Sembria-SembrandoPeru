import { Fragment, lazy } from "react";
import { Navigate, Route } from "react-router-dom";

import Layout from "../../components/layout/Layout";

const Inicio = lazy(() => import("../../pages/inicio/Inicio"));
const CambiarPassword = lazy(() => import("../../pages/cambiarpassword/CambiarPassword"));
const PerfilAdministracion = lazy(() => import("../../pages/Configuracion"));
const Seguridad = lazy(() => import("../../pages/Seguridad"));
const FotoPerfil = lazy(() => import("../../pages/FotoPerfil"));
const AccesoDenegado = lazy(() => import("../../pages/AccesoDenegado"));
const Agenda = lazy(() => import("../../pages/agenda/Agenda"));
const AgendaHome = lazy(() => import("../../pages/agenda/AgendaHome"));
const AgendaHistoryPage = lazy(() => import("../../pages/agenda/AgendaHistoryPage"));
const AgendaManualPage = lazy(() => import("../../pages/agenda/AgendaManualPage"));
const AgendaMetricsPage = lazy(() => import("../../pages/agenda/AgendaMetricsPage"));
const NotasPersonales = lazy(() => import("../../pages/agenda/NotasPersonales"));
const NotasManualPage = lazy(() => import("../../pages/agenda/NotasManualPage"));
const Tareas = lazy(() => import("../../pages/tareas/Tareas"));
const TareasManualPage = lazy(() => import("../../pages/tareas/TareasManualPage"));

const GeneralRoutes = (
  <Fragment>
    <Route
      path="/inicio"
      element={
        <Layout>
          <Inicio />
        </Layout>
      }
    />

    <Route path="/cambiar-password" element={<CambiarPassword />} />

    <Route
      path="/perfil-administracion"
      element={
        <Layout>
          <PerfilAdministracion />
        </Layout>
      }
    />

    <Route path="/agenda" element={<Layout><AgendaHome /></Layout>} />
    <Route path="/agenda/tareas" element={<Layout><Tareas /></Layout>} />
    <Route path="/agenda/tareas/manual" element={<Layout><TareasManualPage /></Layout>} />
    <Route path="/agenda/notas" element={<Layout><NotasPersonales /></Layout>} />
    <Route path="/agenda/notas/manual" element={<Layout><NotasManualPage /></Layout>} />
    <Route path="/agenda/reuniones" element={<Layout><Agenda /></Layout>} />
    <Route path="/agenda/reuniones/historial" element={<Layout><AgendaHistoryPage /></Layout>} />
    <Route path="/agenda/reuniones/metricas" element={<Layout><AgendaMetricsPage /></Layout>} />
    <Route path="/agenda/reuniones/manual" element={<Layout><AgendaManualPage /></Layout>} />
    <Route path="/tareas" element={<Navigate to="/agenda/tareas" replace />} />
    <Route path="/agenda/historial" element={<Navigate to="/agenda/reuniones/historial" replace />} />
    <Route path="/agenda/metricas" element={<Navigate to="/agenda/reuniones/metricas" replace />} />
    <Route path="/agenda/manual" element={<Navigate to="/agenda/reuniones/manual" replace />} />

    <Route
      path="/seguridad"
      element={
        <Layout>
          <Seguridad />
        </Layout>
      }
    />

    <Route path="/foto-perfil" element={<FotoPerfil />} />

    <Route path="/acceso-denegado" element={<AccesoDenegado />} />
  </Fragment>
);

export default GeneralRoutes;
