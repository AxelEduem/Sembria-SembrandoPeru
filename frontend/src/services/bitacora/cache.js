import { subscribeApiMutation } from "@/services/api";

const cache = new Map();
const pending = new Map();
const keysByGroup = new Map();
const listeners = new Set();

const MAX_CACHE_ENTRIES = 100;

export const BITACORA_CACHE_GROUPS = Object.freeze({
  LIST: "list",
  METRICS: "metrics",
});

export const BITACORA_CACHE_TTL = Object.freeze({
  LIST: 60_000,
  METRICS: 60_000,
});

function normalizeScope(scope) {
  return String(scope || "default");
}

function normalizeFilters(filters = {}) {
  return (
    Object.entries(filters)
      .filter(
        ([, value]) => value !== "" && value !== null && value !== undefined && value !== "todos",
      )
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join("&") || "all"
  );
}

function listKey(filters, scope) {
  return `list:${normalizeScope(scope)}:${normalizeFilters(filters)}`;
}

function metricsKey(scope) {
  return `metrics:${normalizeScope(scope)}`;
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

  while (cache.size > MAX_CACHE_ENTRIES) {
    removeKey(cache.keys().next().value);
  }
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

async function loadCached(key, loader, { force, ttl, groups }) {
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
      if (pending.get(key)?.token === token) pending.delete(key);
      emitChange();
    });

  pending.set(key, { promise, token });
  registerGroups(key, groups);
  return promise;
}

export function subscribeBitacora(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getBitacoraCache(filters = {}, cacheScope = "default") {
  return readCache(listKey(filters, cacheScope)) ?? null;
}

export function getBitacoraMetricsCache(cacheScope = "default") {
  return readCache(metricsKey(cacheScope)) ?? null;
}

export function loadBitacoraCached(
  filters,
  loader,
  { force = false, cacheScope = "default" } = {},
) {
  return loadCached(listKey(filters, cacheScope), loader, {
    force,
    ttl: BITACORA_CACHE_TTL.LIST,
    groups: [BITACORA_CACHE_GROUPS.LIST],
  });
}

export function loadBitacoraMetricsCached(loader, { force = false, cacheScope = "default" } = {}) {
  return loadCached(metricsKey(cacheScope), loader, {
    force,
    ttl: BITACORA_CACHE_TTL.METRICS,
    groups: [BITACORA_CACHE_GROUPS.METRICS],
  });
}

export function invalidateBitacoraCache(...groups) {
  groups.forEach((group) => {
    [...(keysByGroup.get(group) || [])].forEach(removeKey);
  });
  emitChange();
}

export function clearBitacoraCache() {
  cache.clear();
  pending.clear();
  keysByGroup.clear();
  emitChange();
}

subscribeApiMutation(() => clearBitacoraCache());
