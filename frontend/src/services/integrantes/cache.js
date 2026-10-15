const cache = new Map();
const pending = new Map();
const keysByGroup = new Map();
const integrantesListeners = new Set();

const MAX_CACHE_ENTRIES = 100;

export const INTEGRANTES_CACHE_GROUPS = Object.freeze({
  LIST: "list",
  DETAIL: "detail",
  HISTORY: "history",
  ACCESSES: "accesses",
  CATALOGS: "catalogs",
});

export const INTEGRANTES_CACHE_TTL = Object.freeze({
  LIST: 60_000,
  DETAIL: 120_000,
  HISTORY: 120_000,
  ACCESSES: 60_000,
  CATALOGS: 300_000,
});

function normalizeScope(scope) {
  return String(scope || "default");
}

function listKey(scope, queryKey = "all") {
  return `list:${normalizeScope(scope)}:${queryKey}`;
}

function resourceKey(resource, scope, id) {
  return `${resource}:${normalizeScope(scope)}:${String(id)}`;
}

function unregisterKey(key) {
  keysByGroup.forEach((keys, group) => {
    keys.delete(key);
    if (keys.size === 0) keysByGroup.delete(group);
  });
}

function removeKey(key) {
  cache.delete(key);
  pending.delete(key);
  unregisterKey(key);
}

function registerGroups(key, groups) {
  groups.forEach((group) => {
    if (!keysByGroup.has(group)) keysByGroup.set(group, new Set());
    keysByGroup.get(group).add(key);
  });
}

function enforceCacheLimit() {
  while (cache.size > MAX_CACHE_ENTRIES) {
    removeKey(cache.keys().next().value);
  }
}

function readCache(key) {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    removeKey(key);
    return undefined;
  }
  return entry.value;
}

function writeCache(key, value, ttl, groups) {
  removeKey(key);
  cache.set(key, { value, expiresAt: Date.now() + ttl });
  registerGroups(key, groups);
  enforceCacheLimit();
}

export function subscribeIntegrantes(listener) {
  integrantesListeners.add(listener);
  return () => integrantesListeners.delete(listener);
}

export function emitIntegrantesChange() {
  integrantesListeners.forEach((listener) => listener());
}

export async function getCachedIntegranteData(key, loader, {
  force = false,
  ttl = INTEGRANTES_CACHE_TTL.LIST,
  groups = [],
  notify = false,
} = {}) {
  if (!force) {
    const cached = readCache(key);
    if (cached !== undefined) return cached;
    if (pending.has(key)) return pending.get(key).promise;
  }

  const token = Symbol(key);
  const promise = Promise.resolve()
    .then(loader)
    .then((value) => {
      if (pending.get(key)?.token === token) {
        writeCache(key, value, ttl, groups);
      }
      return value;
    })
    .finally(() => {
      if (pending.get(key)?.token === token) {
        pending.delete(key);
        if (!cache.has(key)) unregisterKey(key);
      }
      if (notify) emitIntegrantesChange();
    });

  pending.set(key, { promise, token });
  registerGroups(key, groups);
  if (notify) emitIntegrantesChange();
  return promise;
}

export function getIntegrantesCache(cacheScope = "default") {
  return readCache(listKey(cacheScope)) ?? null;
}

export function hasIntegrantesCache(cacheScope = "default") {
  return getIntegrantesCache(cacheScope) !== null;
}

export function isIntegrantesListLoading(cacheScope = "default") {
  return pending.has(listKey(cacheScope));
}

export function setIntegrantesCache(rows, cacheScope = "default") {
  writeCache(
    listKey(cacheScope),
    rows,
    INTEGRANTES_CACHE_TTL.LIST,
    [INTEGRANTES_CACHE_GROUPS.LIST],
  );
}

export function clearIntegrantesListCache({ notify = true, cacheScope = null } = {}) {
  if (cacheScope === null) {
    invalidateIntegrantesCache(INTEGRANTES_CACHE_GROUPS.LIST);
  } else {
    removeKey(listKey(cacheScope));
  }
  if (notify) emitIntegrantesChange();
}

export function patchIntegranteInList(id, updater) {
  const normalizedId = String(id);
  const listKeys = [...(keysByGroup.get(INTEGRANTES_CACHE_GROUPS.LIST) || [])];

  listKeys.forEach((key) => {
    const rows = readCache(key);
    if (!Array.isArray(rows)) return;
    writeCache(
      key,
      rows.map((row) => (String(row.id) === normalizedId ? updater(row) : row)),
      INTEGRANTES_CACHE_TTL.LIST,
      [INTEGRANTES_CACHE_GROUPS.LIST],
    );
  });

  emitIntegrantesChange();
}

export function getDetailCache(id, cacheScope = "default") {
  return readCache(resourceKey("detail", cacheScope, id));
}

export function setDetailCache(id, value, cacheScope = "default") {
  writeCache(
    resourceKey("detail", cacheScope, id),
    value,
    INTEGRANTES_CACHE_TTL.DETAIL,
    [INTEGRANTES_CACHE_GROUPS.DETAIL],
  );
}

export function getHistoryCache(id, cacheScope = "default") {
  return readCache(resourceKey("history", cacheScope, id));
}

export function setHistoryCache(id, value, cacheScope = "default") {
  writeCache(
    resourceKey("history", cacheScope, id),
    value,
    INTEGRANTES_CACHE_TTL.HISTORY,
    [INTEGRANTES_CACHE_GROUPS.HISTORY],
  );
}

export function invalidateIntegrantesCache(...groups) {
  groups.forEach((group) => {
    [...(keysByGroup.get(group) || [])].forEach(removeKey);
  });
}

export function clearDetailCaches(id) {
  if (id === undefined || id === null) {
    invalidateIntegrantesCache(
      INTEGRANTES_CACHE_GROUPS.DETAIL,
      INTEGRANTES_CACHE_GROUPS.HISTORY,
      INTEGRANTES_CACHE_GROUPS.ACCESSES,
    );
    return;
  }

  const suffix = `:${String(id)}`;
  [
    INTEGRANTES_CACHE_GROUPS.DETAIL,
    INTEGRANTES_CACHE_GROUPS.HISTORY,
    INTEGRANTES_CACHE_GROUPS.ACCESSES,
  ].forEach((group) => {
    [...(keysByGroup.get(group) || [])]
      .filter((key) => key.endsWith(suffix))
      .forEach(removeKey);
  });
}

export function invalidateIntegranteDetailCache(id) {
  clearDetailCaches(id);
}

export function clearIntegranteDetailCaches() {
  clearDetailCaches();
}

export function clearIntegrantesCache() {
  cache.clear();
  pending.clear();
  keysByGroup.clear();
  emitIntegrantesChange();
}
