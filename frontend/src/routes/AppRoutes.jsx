import { Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import Login from "../pages/login/Login";

import ProtectedRoute from "./ProtectedRoute";

import GeneralRoutes from "./protected/GeneralRoutes";
import IntegrantesRoutes from "./protected/IntegrantesRoutes";
import AsistenciaRoutes from "./protected/AsistenciaRoutes";
import AdministracionRoutes from "./protected/AdministracionRoutes";
import GestionProyectosRoutes from "./protected/GestionProyectosRoutes";

function AppRoutes() {
  return (
    <Suspense fallback={null}>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Login />} />

        {/* Rutas protegidas */}
        <Route element={<ProtectedRoute />}>
          {GeneralRoutes}
          {IntegrantesRoutes}
          {AsistenciaRoutes}
          {AdministracionRoutes}
          {GestionProyectosRoutes}
        </Route>
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
