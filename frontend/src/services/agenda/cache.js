const cache = new Map();
const pending = new Map();
const keysByGroup = new Map();
const MAX_CACHE_ENTRIES = 100;

export const AGENDA_CACHE_GROUPS = Object.freeze({
  MEETINGS: "agenda-meetings",
  PEOPLE: "agenda-people",
  CURRENT_PERSON: "agenda-current-person",
  HISTORY: "agenda-history",
  METRICS: "agenda-metrics",
  TASKS: "agenda-tasks",
  TASK_PEOPLE: "agenda-task-people",
  NOTES: "agenda-notes",
});

export const AGENDA_CACHE_TTL = Object.freeze({
  MEETINGS: 30_000,
  PEOPLE: 5 * 60_000,
  CURRENT_PERSON: 5 * 60_000,
  HISTORY: 60_000,
  METRICS: 60_000,
  TASKS: 60_000,
  TASK_PEOPLE: 5 * 60_000,
  NOTES: 60_000,
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

export function invalidateAgendaCache(...groups) {
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

export function clearAgendaCache() {
  invalidateAgendaCache();
}

export function invalidateAgendaDirectoryCache() {
  invalidateAgendaCache(
    AGENDA_CACHE_GROUPS.PEOPLE,
    AGENDA_CACHE_GROUPS.CURRENT_PERSON,
  );
}

export async function getCachedAgendaData(
  key,
  loader,
  { force = false, ttl = AGENDA_CACHE_TTL.MEETINGS, groups = [] } = {},
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
