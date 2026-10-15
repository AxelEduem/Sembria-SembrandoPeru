const cache = new Map();
const pending = new Map();
const listeners = new Set();

const MAX_CACHE_ENTRIES = 30;
export const EQUIPOS_CACHE_TTL = 60_000;

function normalizeScope(scope) {
  return String(scope || "default");
}

function cacheKey(resource, scope) {
  return `${resource}:${normalizeScope(scope)}`;
}

function readCache(key) {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
}

function writeCache(key, value) {
  cache.delete(key);
  cache.set(key, { value, expiresAt: Date.now() + EQUIPOS_CACHE_TTL });

  while (cache.size > MAX_CACHE_ENTRIES) {
    cache.delete(cache.keys().next().value);
  }
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

async function loadCached(key, loader, { force = false } = {}) {
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
        writeCache(key, value);
      }
      return value;
    })
    .finally(() => {
      if (pending.get(key)?.token === token) pending.delete(key);
      emitChange();
    });

  pending.set(key, { promise, token });
  return promise;
}

export function subscribeEquipos(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getEquiposCache(cacheScope = "default") {
  return readCache(cacheKey("teams", cacheScope)) ?? null;
}

export function getEquipoCandidatesCache(cacheScope = "default") {
  return readCache(cacheKey("candidates", cacheScope)) ?? null;
}

export function getEquipoMetricsCache(cacheScope = "default") {
  return readCache(cacheKey("metrics", cacheScope)) ?? null;
}

export function loadEquiposCached(loader, { force = false, cacheScope = "default" } = {}) {
  return loadCached(cacheKey("teams", cacheScope), loader, { force });
}

export function loadEquipoCandidatesCached(loader, { force = false, cacheScope = "default" } = {}) {
  return loadCached(cacheKey("candidates", cacheScope), loader, { force });
}

export function loadEquipoMetricsCached(loader, { force = false, cacheScope = "default" } = {}) {
  return loadCached(cacheKey("metrics", cacheScope), loader, { force });
}

export function clearEquiposCache({ notify = true, cacheScope = null } = {}) {
  const scope = cacheScope === null ? null : normalizeScope(cacheScope);

  [...cache.keys()].forEach((key) => {
    if (scope === null || key.endsWith(`:${scope}`)) cache.delete(key);
  });
  [...pending.keys()].forEach((key) => {
    if (scope === null || key.endsWith(`:${scope}`)) pending.delete(key);
  });

  if (notify) emitChange();
}
