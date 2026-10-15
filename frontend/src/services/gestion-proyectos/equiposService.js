import { apiRequest } from "@/services/api";
import {
  clearEquiposCache,
  loadEquipoCandidatesCached,
  loadEquiposCached,
} from "./equiposCache";
import {
  equipoContextKey,
  GESTION_PROYECTOS_CACHE_GROUPS,
  GESTION_PROYECTOS_CACHE_TTL,
  invalidateEquipoContext,
  loadGestionProyectosCached,
} from "./cache";

export function getEquipos({ force = false, cacheScope = "default" } = {}) {
  return loadEquiposCached(async () => {
    const response = await apiRequest("/api/gestion-proyectos/equipos");
    return response?.data || [];
  }, { force, cacheScope });
}

export function getIntegrantesDisponibles({ force = false, cacheScope = "default" } = {}) {
  return loadEquipoCandidatesCached(async () => {
    const response = await apiRequest("/api/gestion-proyectos/equipos/integrantes-disponibles");
    return response?.data || [];
  }, { force, cacheScope });
}

export function getMiEquipoContexto({ force = false, cacheScope = "default" } = {}) {
  return loadGestionProyectosCached(
    equipoContextKey(cacheScope),
    async () => {
      const response = await apiRequest("/api/gestion-proyectos/equipos/contexto");
      return response?.data || { puede_registrar: false, es_lider: false, equipo: null };
    },
    {
      force,
      ttl: GESTION_PROYECTOS_CACHE_TTL.LIST,
      groups: [GESTION_PROYECTOS_CACHE_GROUPS.EQUIPO_CONTEXT],
      channel: "convocatorias",
    },
  );
}

export async function saveEquipo(input, id = null) {
  const response = await apiRequest(
    id ? `/api/gestion-proyectos/equipos/${id}` : "/api/gestion-proyectos/equipos",
    { method: id ? "PUT" : "POST", csrf: true, body: input },
  );
  clearEquiposCache();
  invalidateEquipoContext();
  return response?.data;
}

export async function setEquipoActivo(id, activo) {
  const action = activo ? "reactivar" : "desactivar";
  const response = await apiRequest(`/api/gestion-proyectos/equipos/${id}/${action}`, {
    method: "PATCH",
    csrf: true,
  });
  clearEquiposCache();
  invalidateEquipoContext();
  return response?.data;
}

export async function getEquipoHistorial(id) {
  const response = await apiRequest(`/api/gestion-proyectos/equipos/${id}/historial`);
  return response?.data || [];
}
