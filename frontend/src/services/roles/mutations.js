import { apiRequest } from "@/services/api";
import { clearCargosCache } from "@/services/cargos/cache";
import { ROLES_CACHE_GROUPS, invalidateRolesCache } from "./cache";

function normalize(input) {
  return {
    codigo: String(input.codigo || "")
      .trim()
      .toLowerCase(),
    nombre: String(input.nombre || "")
      .trim()
      .toUpperCase(),
    descripcion: input.descripcion?.trim() || null,
    acceso_total: Boolean(input.acceso_total),
  };
}

export async function createRol(input) {
  const response = await apiRequest("/api/roles", {
    method: "POST",
    csrf: true,
    body: normalize(input),
  });

  clearCargosCache();
  invalidateRolesCache(
    ROLES_CACHE_GROUPS.ROLES,
    ROLES_CACHE_GROUPS.ROL_CARGOS,
  );
  return response?.data || null;
}

export async function updateRol(id, input) {
  const response = await apiRequest(`/api/roles/${id}`, {
    method: "PUT",
    csrf: true,
    body: normalize(input),
  });

  clearCargosCache();
  invalidateRolesCache(
    ROLES_CACHE_GROUPS.ROLES,
    ROLES_CACHE_GROUPS.ROL_CARGOS,
  );
  return response?.data || null;
}

export async function setRolActive(id, activo) {
  const response = await apiRequest(`/api/roles/${id}/status`, {
    method: "PATCH",
    csrf: true,
    body: { activo: Boolean(activo) },
  });

  clearCargosCache();
  invalidateRolesCache(
    ROLES_CACHE_GROUPS.ROLES,
    ROLES_CACHE_GROUPS.ROL_CARGOS,
  );
  return response?.data || null;
}

export async function replaceRolPermisos(rolId, permisos = [], options = {}) {
  if (!rolId) throw new Error("El rol es obligatorio.");

  const rows = Array.isArray(permisos)
    ? permisos
        .map((item) => ({
          permiso_id: Number(item?.permiso_id ?? item?.id ?? item),
          alcance: item?.alcance === "global" ? "global" : "area",
        }))
        .filter((item) => Number.isFinite(item.permiso_id) && item.permiso_id > 0)
    : [];

  const response = await apiRequest(`/api/roles/${rolId}/permissions`, {
    method: "PUT",
    csrf: true,
    body: {
      permisos: rows,
      ...(typeof options.acceso_total === "boolean"
        ? { acceso_total: options.acceso_total }
        : {}),
    },
  });

  if (typeof options.acceso_total === "boolean") {
    invalidateRolesCache(ROLES_CACHE_GROUPS.ROL_PERMISOS, ROLES_CACHE_GROUPS.ROLES);
  } else {
    invalidateRolesCache(ROLES_CACHE_GROUPS.ROL_PERMISOS);
  }

  return Array.isArray(response?.data) ? response.data : [];
}

export async function replaceRolCargos(rolId, cargoIds = []) {
  if (!rolId) throw new Error("El rol es obligatorio.");

  const ids = Array.from(cargoIds || [])
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id) && id > 0);

  const response = await apiRequest(`/api/roles/${rolId}/cargos`, {
    method: "PUT",
    csrf: true,
    body: { cargo_ids: ids },
  });

  clearCargosCache();
  invalidateRolesCache(ROLES_CACHE_GROUPS.ROL_CARGOS);
  return Array.isArray(response?.data) ? response.data : [];
}
