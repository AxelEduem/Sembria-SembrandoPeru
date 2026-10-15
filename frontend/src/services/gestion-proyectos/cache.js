const cache = new Map();
const pending = new Map();
const keysByGroup = new Map();
const listeners = new Map();

const MAX_CACHE_ENTRIES = 100;

export const GESTION_PROYECTOS_CACHE_GROUPS = Object.freeze({
  CONVOCATORIAS: "convocatorias",
  CONVOCATORIA_DETAIL: "convocatoria-detail",
  FUENTES: "fuentes",
  EQUIPO_CONTEXT: "equipo-context",
});

export const GESTION_PROYECTOS_CACHE_TTL = Object.freeze({
  LIST: 60_000,
  DETAIL: 120_000,
  CATALOG: 300_000,
});

function normalizeScope(scope) {
  return String(scope || "default");
}

function key(resource, scope, id = null) {
  return [resource, normalizeScope(scope), id].filter((part) => part !== null).join(":");
}

function unregisterKey(cacheKey) {
  keysByGroup.forEach((keys, group) => {
    keys.delete(cacheKey);
    if (keys.size === 0) keysByGroup.delete(group);
  });
}

function removeKey(cacheKey) {
  cache.delete(cacheKey);
  pending.delete(cacheKey);
  unregisterKey(cacheKey);
}

function registerGroups(cacheKey, groups) {
  groups.forEach((group) => {
    if (!keysByGroup.has(group)) keysByGroup.set(group, new Set());
    keysByGroup.get(group).add(cacheKey);
  });
}

function readCache(cacheKey) {
  const entry = cache.get(cacheKey);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    removeKey(cacheKey);
    return undefined;
  }
  return entry.value;
}

function writeCache(cacheKey, value, ttl, groups) {
  removeKey(cacheKey);
  cache.set(cacheKey, { value, expiresAt: Date.now() + ttl });
  registerGroups(cacheKey, groups);
  while (cache.size > MAX_CACHE_ENTRIES) removeKey(cache.keys().next().value);
}

function emitChange(channel) {
  listeners.get(channel)?.forEach((listener) => listener());
}

function subscribe(channel, listener) {
  if (!listeners.has(channel)) listeners.set(channel, new Set());
  listeners.get(channel).add(listener);
  return () => listeners.get(channel)?.delete(listener);
}

export async function loadGestionProyectosCached(
  cacheKey,
  loader,
  { force = false, ttl = GESTION_PROYECTOS_CACHE_TTL.LIST, groups = [], channel } = {},
) {
  if (!force) {
    const cached = readCache(cacheKey);
    if (cached !== undefined) return cached;
    if (pending.has(cacheKey)) return pending.get(cacheKey).promise;
  }

  const token = Symbol(cacheKey);
  const promise = Promise.resolve()
    .then(loader)
    .then((value) => {
      if (pending.get(cacheKey)?.token === token) writeCache(cacheKey, value, ttl, groups);
      return value;
    })
    .finally(() => {
      if (pending.get(cacheKey)?.token === token) pending.delete(cacheKey);
      if (channel) emitChange(channel);
    });

  pending.set(cacheKey, { promise, token });
  registerGroups(cacheKey, groups);
  return promise;
}

export function convocatoriaListKey(cacheScope = "default") {
  return key("convocatorias", cacheScope);
}

export function convocatoriaDetailKey(id, cacheScope = "default") {
  return key("convocatoria", cacheScope, id);
}

export function fuentesKey(cacheScope = "default") {
  return key("fuentes", cacheScope);
}

export function equipoContextKey(cacheScope = "default") {
  return key("equipo-context", cacheScope);
}

export function getConvocatoriasCache(cacheScope = "default") {
  return readCache(convocatoriaListKey(cacheScope)) ?? null;
}

export function getFuentesCache(cacheScope = "default") {
  return readCache(fuentesKey(cacheScope)) ?? null;
}

export function getEquipoContextCache(cacheScope = "default") {
  return readCache(equipoContextKey(cacheScope)) ?? null;
}

export function subscribeConvocatorias(listener) {
  return subscribe("convocatorias", listener);
}

function invalidateGroups(groups) {
  groups.forEach((group) => [...(keysByGroup.get(group) || [])].forEach(removeKey));
}

export function invalidateConvocatorias({ includeFuentes = false, notify = true } = {}) {
  const groups = [
    GESTION_PROYECTOS_CACHE_GROUPS.CONVOCATORIAS,
    GESTION_PROYECTOS_CACHE_GROUPS.CONVOCATORIA_DETAIL,
  ];
  if (includeFuentes) groups.push(GESTION_PROYECTOS_CACHE_GROUPS.FUENTES);
  invalidateGroups(groups);
  if (notify) emitChange("convocatorias");
}

export function invalidateEquipoContext({ notify = true } = {}) {
  invalidateGroups([GESTION_PROYECTOS_CACHE_GROUPS.EQUIPO_CONTEXT]);
  if (notify) emitChange("convocatorias");
}

export function clearGestionProyectosCache() {
  cache.clear();
  pending.clear();
  keysByGroup.clear();
  emitChange("convocatorias");
}
