import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import {
  createRol,
  getRolCargos,
  getPermisosCatalogCache,
  getPermisos,
  getRolPermisos,
  getRolesListCache,
  getRoles,
  isRolesDataLoading,
  replaceRolPermisos,
  replaceRolCargos,
  setRolCargosCache,
  setRolPermisosCache,
  setRolActive,
  setRolesListCache,
  subscribeRoles,
  updateRol,
} from "@/services/roles/rolesService";
import { getRoleId } from "@/utils/permissions";

function normalizeError(error, fallback) {
  if (error?.code === "23505") {
    return "Ya existe un rol con ese código o nombre.";
  }

  return error?.message || fallback;
}

function slugifyRoleName(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getRolesCacheScope(profile) {
  const accountId = profile?.cuenta_acceso_id || profile?.id || "anon";
  const roleId = getRoleId(profile) || "anon";
  return `${accountId}:${roleId}`;
}

function loadRolesShared(cacheScope, force = false) {
  return getRoles({ force, cacheScope });
}

function loadPermisosShared(cacheScope, force = false) {
  return getPermisos({ force, cacheScope });
}

function loadRolPermisosShared(cacheScope, rolId, force = false) {
  return getRolPermisos(rolId, { force, cacheScope });
}

function loadRolCargosShared(cacheScope, rolId, force = false) {
  return getRolCargos(rolId, { force, cacheScope });
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

function setRolesCache(cacheScope, updater, fallback = []) {
  const current = getRolesListCache(cacheScope) || fallback;
  const next = sortRoles(typeof updater === "function" ? updater(current) : updater || []);
  return setRolesListCache(cacheScope, next);
}

/*
|--------------------------------------------------------------------------
| ESTADOS
|--------------------------------------------------------------------------
*/

export const ROLE_STATUS_FILTERS = {
  TODAS: "todas",
  ACTIVO: "activo",
  INACTIVO: "inactivo",
};

export const ROLE_STATUS_OPTIONS = [
  {
    value: ROLE_STATUS_FILTERS.TODAS,
    label: "Selecciona un estado",
  },
  {
    value: ROLE_STATUS_FILTERS.ACTIVO,
    label: "Activo",
  },
  {
    value: ROLE_STATUS_FILTERS.INACTIVO,
    label: "Inactivo",
  },
];

/*
|--------------------------------------------------------------------------
| HOOK
|--------------------------------------------------------------------------
*/

export function useRoles({ includePermissions = true } = {}) {
  const { profile } = useAuth();
  const cacheScope = getRolesCacheScope(profile);
  const [roles, setRoles] = useState(() => getRolesListCache(cacheScope) || []);
  const [permisos, setPermisos] = useState(() =>
    includePermissions ? getPermisosCatalogCache(cacheScope) || [] : [],
  );
  const [loading, setLoading] = useState(
    () =>
      getRolesListCache(cacheScope) === null ||
      (includePermissions && getPermisosCatalogCache(cacheScope) === null),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const handleRolesChange = () => {
      const cachedRoles = getRolesListCache(cacheScope);
      const cachedPermissions = getPermisosCatalogCache(cacheScope);
      setRoles(cachedRoles || []);
      setPermisos(includePermissions ? cachedPermissions || [] : []);
      setLoading(
        isRolesDataLoading(cacheScope, { includePermissions }) ||
          cachedRoles === null ||
          (includePermissions && cachedPermissions === null),
      );
    };

    return subscribeRoles(handleRolesChange);
  }, [cacheScope, includePermissions]);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      const cachedRoles = getRolesListCache(cacheScope);
      const cachedPermissions = getPermisosCatalogCache(cacheScope);

      if (cachedRoles !== null && (!includePermissions || cachedPermissions !== null)) {
        if (mounted) {
          setRoles(cachedRoles);
          setPermisos(includePermissions ? cachedPermissions : []);
          setLoading(false);
        }

        return;
      }

      if (mounted) {
        setLoading(true);
        setError("");
      }

      try {
        const [rolesData, permisosData] = await Promise.all([
          loadRolesShared(cacheScope, false),
          includePermissions ? loadPermisosShared(cacheScope, false) : Promise.resolve([]),
        ]);

        if (!mounted) {
          return;
        }

        setRoles(rolesData);
        setPermisos(permisosData);
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        setError(normalizeError(loadError, "No se pudieron cargar los roles y permisos."));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, [cacheScope, includePermissions]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [rolesData, permisosData] = await Promise.all([
        loadRolesShared(cacheScope, true),
        includePermissions ? loadPermisosShared(cacheScope, true) : Promise.resolve([]),
      ]);

      setRoles(rolesData);
      setPermisos(permisosData);

      return {
        success: true,
      };
    } catch (loadError) {
      const message = normalizeError(loadError, "No se pudieron cargar los roles y permisos.");

      setError(message);

      return {
        success: false,
        message,
      };
    } finally {
      setLoading(false);
    }
  }, [cacheScope, includePermissions]);

  const permisosPorModulo = useMemo(() => {
    return permisos.reduce((accumulator, permiso) => {
      if (!accumulator[permiso.modulo]) {
        accumulator[permiso.modulo] = [];
      }

      accumulator[permiso.modulo].push(permiso);

      return accumulator;
    }, {});
  }, [permisos]);

  const create = useCallback(async (input) => {
    setSaving(true);
    setError("");
    setFeedback(null);

    try {
      const nombre = String(input.nombre || "")
        .trim()
        .toUpperCase();
      const codigo = input.codigo?.trim() || slugifyRoleName(nombre);

      const role = await createRol({
        ...input,
        nombre,
        codigo,
      });

      if (role) {
        const next = setRolesCache(cacheScope, (current) => [...current, role], roles);

        setRoles(next);
      } else {
        const refreshed = await loadRolesShared(cacheScope, true);

        setRoles(refreshed);
      }

      setFeedback({
        type: "success",
        message: "Rol creado correctamente.",
      });

      return {
        success: true,
        data: role,
      };
    } catch (createError) {
      const message = normalizeError(createError, "No se pudo crear el rol.");

      setError(message);

      setFeedback({
        type: "error",
        message,
      });

      return {
        success: false,
        message,
      };
    } finally {
      setSaving(false);
    }
  }, [cacheScope, roles]);

  const update = useCallback(async (rolId, input) => {
    setSaving(true);
    setError("");
    setFeedback(null);

    try {
      const nombre = String(input.nombre || "")
        .trim()
        .toUpperCase();
      const codigo = input.codigo?.trim() || slugifyRoleName(nombre);

      const role = await updateRol(rolId, {
        ...input,
        nombre,
        codigo,
      });

      if (role) {
        const next = setRolesCache(
          cacheScope,
          (current) =>
            current.map((item) => (String(item.id) === String(rolId) ? role : item)),
          roles,
        );

        setRoles(next);
      } else {
        const refreshed = await loadRolesShared(cacheScope, true);

        setRoles(refreshed);
      }

      setFeedback({
        type: "success",
        message: "Rol actualizado correctamente.",
      });

      return {
        success: true,
        data: role,
      };
    } catch (updateError) {
      const message = normalizeError(updateError, "No se pudo actualizar el rol.");

      setError(message);

      setFeedback({
        type: "error",
        message,
      });

      return {
        success: false,
        message,
      };
    } finally {
      setSaving(false);
    }
  }, [cacheScope, roles]);

  const setActive = useCallback(async (rolId, activo) => {
    setSaving(true);
    setError("");
    setFeedback(null);

    try {
      const updatedRole = await setRolActive(rolId, activo);

      const next = setRolesCache(
        cacheScope,
        (current) =>
          current.map((item) => (String(item.id) === String(rolId) ? updatedRole : item)),
        roles,
      );

      setRoles(next);

      setFeedback({
        type: "success",
        message: activo ? "Rol activado correctamente." : "Rol desactivado correctamente.",
      });

      return {
        success: true,
        data: updatedRole,
      };
    } catch (activeError) {
      const message = normalizeError(
        activeError,
        activo ? "No se pudo activar el rol." : "No se pudo desactivar el rol.",
      );

      setError(message);

      setFeedback({
        type: "error",
        message,
      });

      return {
        success: false,
        message,
      };
    } finally {
      setSaving(false);
    }
  }, [cacheScope, roles]);

  const getPermissionsForRole = useCallback(async (rolId) => {
    try {
      return await loadRolPermisosShared(cacheScope, rolId, false);
    } catch (permissionError) {
      const message = normalizeError(
        permissionError,
        "No se pudieron cargar los permisos del rol.",
      );

      throw new Error(message, { cause: permissionError });
    }
  }, [cacheScope]);

  const savePermissions = useCallback(async (rolId, permisoIds, options = {}) => {
    setSaving(true);
    setError("");
    setFeedback(null);

    try {
      await replaceRolPermisos(rolId, permisoIds, options);

      setRolPermisosCache(
        cacheScope,
        rolId,
        Array.from(permisoIds || [])
          .map((item) => ({
            permiso_id: Number(item?.permiso_id ?? item?.id ?? item),
            alcance: item?.alcance === "global" ? "global" : "area",
          }))
          .filter((item) => Number.isFinite(item.permiso_id) && item.permiso_id > 0),
      );

      if (typeof options.acceso_total === "boolean") {
        const next = setRolesCache(
          cacheScope,
          (current) =>
            current.map((role) =>
              String(role.id) === String(rolId)
                ? { ...role, acceso_total: options.acceso_total }
                : role,
            ),
          roles,
        );

        setRoles(next);
      }

      setFeedback({
        type: "success",
        message: "Permisos del rol actualizados correctamente.",
      });

      return {
        success: true,
      };
    } catch (permissionError) {
      const message = normalizeError(permissionError, "No se pudieron actualizar los permisos.");

      setError(message);

      setFeedback({
        type: "error",
        message,
      });

      return {
        success: false,
        message,
      };
    } finally {
      setSaving(false);
    }
  }, [cacheScope, roles]);

  const getCargosForRole = useCallback(async (rolId) => {
    try {
      return await loadRolCargosShared(cacheScope, rolId, false);
    } catch (cargoError) {
      throw new Error(
        normalizeError(cargoError, "No se pudieron cargar los cargos del rol."),
        { cause: cargoError },
      );
    }
  }, [cacheScope]);

  const saveCargos = useCallback(async (rolId, cargoIds) => {
    setSaving(true);
    setError("");
    setFeedback(null);

    try {
      const rows = await replaceRolCargos(rolId, cargoIds);
      setRolCargosCache(cacheScope, rolId, rows);

      setFeedback({
        type: "success",
        message: "Cargos del rol actualizados correctamente.",
      });

      return { success: true, data: rows };
    } catch (cargoError) {
      const message = normalizeError(cargoError, "No se pudieron actualizar los cargos del rol.");

      setError(message);
      setFeedback({ type: "error", message });

      return { success: false, message };
    } finally {
      setSaving(false);
    }
  }, [cacheScope]);

  return {
    roles,
    permisos,
    permisosPorModulo,
    loading,
    saving,
    error,
    feedback,
    setError,
    setFeedback,
    reload,
    create,
    update,
    setActive,
    getPermissionsForRole,
    savePermissions,
    getCargosForRole,
    saveCargos,
    statusOptions: ROLE_STATUS_OPTIONS,
    statusFilters: ROLE_STATUS_FILTERS,
  };
}
