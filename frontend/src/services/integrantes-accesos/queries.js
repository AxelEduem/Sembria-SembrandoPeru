import { apiRequest } from "@/services/api";
import { getIntegrantes } from "@/services/integrantes/integrantesService";
import {
  ACCESOS_CACHE_GROUPS as GROUPS,
  ACCESOS_CACHE_TTL as TTL,
  getCachedAccesosData,
} from "./cache";
import { requireAccesosInactive, requireAccesosView, scopeKey } from "./authorization";
import { idOf } from "./utils";

async function getIntegrantesParaAccesos(profile = null, { inactive = false, force = false } = {}) {
  if (inactive) requireAccesosInactive(profile);
  else requireAccesosView(profile);
  const scope = scopeKey(profile);
  const status = inactive ? "inactive" : "active";

  return getCachedAccesosData(
    `members:${scope}:${status}:todos`,
    async () => {
      const rows = await getIntegrantes({
        inactive,
        force,
        conCuenta: false,
        cacheScope: `accesses:${scope}:todos`,
      });

      return rows.map((row) => ({
        id: row.id,
        historial_id: row.historial_id,
        persona_id: row.persona_id,
        nombre: row.nombre,
        correo: row.correo,
        avatar_path: row.avatar_path,
        avatar_url: row.avatar_url,
        tipo_integrante: row.tipo_integrante,
        area: row.area || "Sin área",
        area_id: row.area_id,
        cargo: row.cargo || "-",
        cargo_id: row.cargo_id,
        estado: row.estado || "Activo",
      }));
    },
    {
      force,
      ttl: TTL.INTEGRANTES,
      groups: [GROUPS.INTEGRANTES],
    },
  );
}

export const getIntegrantesActivos = (profile = null, options = {}) =>
  getIntegrantesParaAccesos(profile, options);
export const getIntegrantesInactivos = (profile = null, options = {}) =>
  getIntegrantesParaAccesos(profile, { ...options, inactive: true });
export const getVoluntariosActivosParaAccesos = getIntegrantesActivos;
export const getIntegrantesActivosParaAccesos = getIntegrantesActivos;

function assignmentQuery(inactive, filters) {
  const params = new URLSearchParams({ inactive: inactive ? "1" : "0" });
  const search = filters.search?.trim();

  if (search) params.set("q", search);
  if (filters.area && filters.area !== "todas") params.set("area", filters.area);
  if (filters.cargo && filters.cargo !== "todos") params.set("cargo", filters.cargo);
  if (filters.type && filters.type !== "todos") params.set("tipo", filters.type);
  if (filters.app && filters.app !== "todas") params.set("app", filters.app);

  return params.toString();
}

async function assignments(profile, inactive, filters = {}, { force = false } = {}) {
  if (inactive) requireAccesosInactive(profile);
  else requireAccesosView(profile);
  const query = assignmentQuery(inactive, filters);
  const key = `assignments:${scopeKey(profile)}:${query}`;

  return getCachedAccesosData(
    key,
    async () => {
      const response = await apiRequest(`/api/integrante-access-assignments?${query}`);
      return response?.data || [];
    },
    { force, ttl: TTL.ASIGNACIONES, groups: [GROUPS.ASIGNACIONES] },
  );
}

export const getAsignacionesAplicaciones = (profile = null, filters = {}, options = {}) =>
  assignments(profile, false, filters, options);
export const getAsignacionesAplicacionesInactivos = (profile = null, filters = {}, options = {}) =>
  assignments(profile, true, filters, options);

export async function getIntegranteByHistorialId(historialId, profile = null) {
  const id = idOf(historialId, "El integrante seleccionado");
  const integrante = (await getIntegrantesActivos(profile)).find(
    (row) => Number(row.historial_id) === id,
  );
  if (!integrante) throw new Error("El integrante seleccionado no es válido.");
  return integrante;
}

export async function getIntegranteConAccesoDeArea(
  historialId,
  profile,
  _permissionCode,
  { includeInactive = false } = {},
) {
  const id = idOf(historialId, "El integrante seleccionado");
  const active = (await getIntegrantesActivos(profile)).find(
    (row) => Number(row.historial_id) === id,
  );
  if (active) return active;
  if (includeInactive) {
    const inactive = (await getIntegrantesInactivos(profile)).find(
      (row) => Number(row.historial_id) === id,
    );
    if (inactive) return inactive;
  }
  throw new Error("El integrante seleccionado no es válido.");
}
