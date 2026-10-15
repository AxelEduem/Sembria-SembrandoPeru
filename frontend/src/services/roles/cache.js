const cache = new Map();
const pending = new Map();
const keysByGroup = new Map();
const listeners = new Set();
const MAX_CACHE_ENTRIES = 100;

export const ROLES_CACHE_GROUPS = Object.freeze({
  ROLES: "roles-list",
  PERMISOS: "permissions-catalog",
  ROL_PERMISOS: "role-permissions",
  ROL_CARGOS: "role-cargos",
});

export const ROLES_CACHE_TTL = Object.freeze({
  ROLES: 60_000,
  PERMISOS: 5 * 60_000,
  ROL_PERMISOS: 60_000,
  ROL_CARGOS: 60_000,
});

function rolesKey(scope) {
  return `roles:${scope || "default"}`;
}

function permisosKey(scope) {
  return `permissions:${scope || "default"}`;
}

function rolPermisosKey(scope, rolId) {
  return `role-permissions:${scope || "default"}:${String(rolId)}`;
}

function rolCargosKey(scope, rolId) {
  return `role-cargos:${scope || "default"}:${String(rolId)}`;
}

function removeKey(key) {
  cache.delete(key);
  pending.delete(key);

  keysByGroup.forEach((keys, group) => {
    keys.delete(key);
    if (!keys.size) keysByGroup.delete(group);
  });
}

function indexKey(key, groups) {
  groups.forEach((group) => {
    if (!keysByGroup.has(group)) keysByGroup.set(group, new Set());
    keysByGroup.get(group).add(key);
  });
}

function emitRolesChange() {
  listeners.forEach((listener) => listener());
}

function pruneExpired(now = Date.now()) {
  cache.forEach((entry, key) => {
    if (entry.expiresAt <= now) removeKey(key);
  });
}

function makeRoom() {
  while (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey === undefined) break;
    removeKey(oldestKey);
  }
}

function getValidEntry(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt > Date.now()) return entry;

  removeKey(key);
  return null;
}

function setCacheValue(key, rows, ttl, groups) {
  removeKey(key);
  pruneExpired();
  makeRoom();
  cache.set(key, {
    value: Array.isArray(rows) ? rows : [],
    expiresAt: Date.now() + ttl,
  });
  indexKey(key, groups);
  emitRolesChange();
  return cache.get(key).value;
}

export function subscribeRoles(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRolesListCache(scope) {
  return getValidEntry(rolesKey(scope))?.value ?? null;
}

export function getPermisosCatalogCache(scope) {
  return getValidEntry(permisosKey(scope))?.value ?? null;
}

export function getRolPermisosCache(scope, rolId) {
  return getValidEntry(rolPermisosKey(scope, rolId))?.value ?? null;
}

export function getRolCargosCache(scope, rolId) {
  return getValidEntry(rolCargosKey(scope, rolId))?.value ?? null;
}

export function isRolesDataLoading(scope, { includePermissions = true } = {}) {
  return (
    pending.has(rolesKey(scope)) ||
    (includePermissions && pending.has(permisosKey(scope)))
  );
}

export function setRolesListCache(scope, rows) {
  return setCacheValue(
    rolesKey(scope),
    rows,
    ROLES_CACHE_TTL.ROLES,
    [ROLES_CACHE_GROUPS.ROLES],
  );
}

export function setRolPermisosCache(scope, rolId, rows) {
  return setCacheValue(
    rolPermisosKey(scope, rolId),
    rows,
    ROLES_CACHE_TTL.ROL_PERMISOS,
    [ROLES_CACHE_GROUPS.ROL_PERMISOS],
  );
}

export function setRolCargosCache(scope, rolId, rows) {
  return setCacheValue(
    rolCargosKey(scope, rolId),
    rows,
    ROLES_CACHE_TTL.ROL_CARGOS,
    [ROLES_CACHE_GROUPS.ROL_CARGOS],
  );
}

export function invalidateRolesCache(...groups) {
  const normalizedGroups = groups.flat().filter(Boolean);

  if (!normalizedGroups.length) {
    cache.clear();
    pending.clear();
    keysByGroup.clear();
    emitRolesChange();
    return;
  }

  const keys = new Set();
  normalizedGroups.forEach((group) => {
    keysByGroup.get(group)?.forEach((key) => keys.add(key));
  });
  keys.forEach(removeKey);
  emitRolesChange();
}

export function clearRolesCache() {
  invalidateRolesCache();
}

export async function getCachedRolesData(
  key,
  loader,
  { force = false, ttl = ROLES_CACHE_TTL.ROLES, groups = [] } = {},
) {
  const now = Date.now();
  pruneExpired(now);
  const entry = cache.get(key);

  if (!force && entry && entry.expiresAt > now) return entry.value;
  if (entry) removeKey(key);

  const currentRequest = pending.get(key);
  if (currentRequest) return currentRequest.promise;

  const token = Symbol(key);
  const request = Promise.resolve()
    .then(loader)
    .then((value) => {
      if (pending.get(key)?.token === token) {
        pruneExpired();
        makeRoom();
        cache.set(key, { value, expiresAt: Date.now() + ttl });
        indexKey(key, groups);
      }
      return value;
    })
    .catch((error) => {
      if (pending.get(key)?.token === token) removeKey(key);
      throw error;
    })
    .finally(() => {
      if (pending.get(key)?.token === token) {
        pending.delete(key);
        emitRolesChange();
      }
    });

  indexKey(key, groups);
  pending.set(key, { promise: request, token });
  emitRolesChange();
  return request;
}
