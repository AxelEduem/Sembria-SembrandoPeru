import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { PAGE_TITLES } from "./pageTitles";

function PageTitle() {
  const location = useLocation();

  let currentTitle = PAGE_TITLES[location.pathname] || "Sembria";
 
  
  if (
    location.pathname.startsWith("/integrantes/") &&
    !location.pathname.endsWith("/nuevo") &&
    location.pathname !== "/integrantes/manual"
  ) {
    currentTitle = location.pathname.endsWith("/editar")
      ? "Editar integrante"
      : location.pathname.endsWith("/recontratar")
        ? "Recontratar integrante"
        : "Detalle de integrante";
  }

  if (location.pathname.startsWith("/voluntarios/") && !location.pathname.endsWith("/nuevo")) {
    currentTitle = location.pathname.endsWith("/editar")
      ? "Editar integrante"
      : "Detalle de integrante";
  }

  if (location.pathname.startsWith("/practicantes/") && !location.pathname.endsWith("/nuevo")) {
    currentTitle = location.pathname.endsWith("/editar")
      ? "Editar integrante"
      : "Detalle de integrante";
  }

  if (
    location.pathname.startsWith("/gestion-proyectos/detecta/equipos/")
    && location.pathname.endsWith("/editar")
  ) {
    currentTitle = "Editar equipo";
  }

  useEffect(() => {
    document.title = currentTitle === "Sembria" ? currentTitle : `${currentTitle} | Sembria`;
  }, [currentTitle]);

  return null;
}

export default PageTitle;
