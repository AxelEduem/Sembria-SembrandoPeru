const cache = new Map();
const pending = new Map();
const keysByGroup = new Map();
const MAX_CACHE_ENTRIES = 100;

export const SCHEDULE_CHANGE_CACHE_GROUPS = Object.freeze({
  PERSONAL: "schedule-change-personal",
  ELIGIBILITY: "schedule-change-eligibility",
  ADMIN: "schedule-change-admin",
});

export const SCHEDULE_CHANGE_CACHE_TTL = Object.freeze({
  LIST: 30_000,
  ELIGIBILITY: 60_000,
});

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

export function invalidateScheduleChangeRequestCache(...groups) {
  const normalizedGroups = groups.flat().filter(Boolean);

  if (!normalizedGroups.length) {
    cache.clear();
    pending.clear();
    keysByGroup.clear();
    return;
  }

  const keys = new Set();
  normalizedGroups.forEach((group) => {
    keysByGroup.get(group)?.forEach((key) => keys.add(key));
  });
  keys.forEach(removeKey);
}

export function clearScheduleChangeRequestCache() {
  invalidateScheduleChangeRequestCache();
}

export async function getCachedScheduleChangeData(
  key,
  loader,
  { force = false, ttl = SCHEDULE_CHANGE_CACHE_TTL.LIST, groups = [] } = {},
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
      if (pending.get(key)?.token === token) pending.delete(key);
    });

  indexKey(key, groups);
  pending.set(key, { promise: request, token });
  return request;
}
