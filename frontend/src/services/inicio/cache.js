const cache = new Map();
const pending = new Map();
const listeners = new Set();

const MAX_CACHE_ENTRIES = 20;

export const INICIO_CACHE_TTL = Object.freeze({
  SUMMARY: 45_000,
});

function summaryKey(scope = "default") {
  return `summary:${String(scope || "default")}`;
}

function emitInicioChange() {
  listeners.forEach((listener) => listener());
}

function removeKey(key) {
  cache.delete(key);
  pending.delete(key);
}

function getValidEntry(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt > Date.now()) return entry;

  cache.delete(key);
  return null;
}

function makeRoom() {
  while (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey === undefined) break;
    removeKey(oldestKey);
  }
}

export function subscribeInicio(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getInicioSummaryCache(scope = "default") {
  return getValidEntry(summaryKey(scope))?.value ?? null;
}

export function isInicioSummaryLoading(scope = "default") {
  return pending.has(summaryKey(scope));
}

export function clearInicioCache({ notify = true } = {}) {
  cache.clear();
  pending.clear();
  if (notify) emitInicioChange();
}

export async function getCachedInicioSummary(
  scope,
  loader,
  { force = false, ttl = INICIO_CACHE_TTL.SUMMARY } = {},
) {
  const key = summaryKey(scope);
  const entry = getValidEntry(key);

  if (!force && entry) return entry.value;
  if (pending.has(key)) return pending.get(key).promise;

  const token = Symbol(key);
  const request = Promise.resolve()
    .then(loader)
    .then((value) => {
      if (pending.get(key)?.token === token) {
        cache.delete(key);
        makeRoom();
        cache.set(key, {
          value,
          expiresAt: Date.now() + ttl,
        });
      }
      return value;
    })
    .finally(() => {
      if (pending.get(key)?.token === token) {
        pending.delete(key);
        emitInicioChange();
      }
    });

  pending.set(key, { promise: request, token });
  emitInicioChange();
  return request;
}
