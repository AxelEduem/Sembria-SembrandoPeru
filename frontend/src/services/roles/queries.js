import { apiRequest } from "@/services/api";
import {
  ROLES_CACHE_GROUPS as GROUPS,
  ROLES_CACHE_TTL as TTL,
  getCachedRolesData,
} from "./cache";

function dataList(response) {
  return Array.isArray(response?.data) ? response.data : [];
}

function sortRoles(rows = []) {
  return [...rows].sort((a, b) => {
    const aDate = new Date(a.created_at || 0).getTime();
    const bDate = new Date(b.created_at || 0).getTime();

    if (!Number.isNaN(aDate) && !Number.isNaN(bDate) && aDate !== bDate) {
      return bDate - aDate;
    }

    return String(a.nombre || "").localeCompare(String(b.nombre || ""));
  });
}

function sortPermisos(rows = []) {
  return [...rows].sort((a, b) => {
    const moduleComparison = String(a.modulo || "").localeCompare(String(b.modulo || ""));
    if (moduleComparison) return moduleComparison;

    const aIsModuleView = a.accion === "ver" || String(a.codigo || "").endsWith(".ver");
    const bIsModuleView = b.accion === "ver" || String(b.codigo || "").endsWith(".ver");
    if (aIsModuleView !== bIsModuleView) return aIsModuleView ? -1 : 1;

    return String(a.nombre || "").localeCompare(String(b.nombre || ""));
  });
}

function normalizeRolPermisos(rows = []) {
  return rows
    .map((row) => ({
      permiso_id: Number(row.permiso_id),
      alcance: row.alcance === "global" ? "global" : "area",
    }))
    .filter((row) => Number.isFinite(row.permiso_id) && row.permiso_id > 0);
}

export async function getRoles({ force = false, cacheScope = "default" } = {}) {
  return getCachedRolesData(
    `roles:${cacheScope}`,
    async () => sortRoles(dataList(await apiRequest("/api/roles"))),
    { force, ttl: TTL.ROLES, groups: [GROUPS.ROLES] },
  );
}

export async function getPermisos({ force = false, cacheScope = "default" } = {}) {
  return getCachedRolesData(
    `permissions:${cacheScope}`,
    async () => sortPermisos(dataList(await apiRequest("/api/roles/permissions/catalog"))),
    { force, ttl: TTL.PERMISOS, groups: [GROUPS.PERMISOS] },
  );
}

export async function getRolPermisos(
  rolId,
  { force = false, cacheScope = "default" } = {},
) {
  if (!rolId) return [];

  return getCachedRolesData(
    `role-permissions:${cacheScope}:${String(rolId)}`,
    async () => normalizeRolPermisos(
      dataList(await apiRequest(`/api/roles/${rolId}/permissions`)),
    ),
    { force, ttl: TTL.ROL_PERMISOS, groups: [GROUPS.ROL_PERMISOS] },
  );
}

export async function getRolCargos(
  rolId,
  { force = false, cacheScope = "default" } = {},
) {
  if (!rolId) return [];

  return getCachedRolesData(
    `role-cargos:${cacheScope}:${String(rolId)}`,
    async () => dataList(await apiRequest(`/api/roles/${rolId}/cargos`)),
    { force, ttl: TTL.ROL_CARGOS, groups: [GROUPS.ROL_CARGOS] },
  );
}
