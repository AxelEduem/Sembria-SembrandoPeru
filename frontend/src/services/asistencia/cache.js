const cache = new Map();
const pending = new Map();
const keysByGroup = new Map();
const MAX_CACHE_ENTRIES = 100;

export const ATTENDANCE_CACHE_GROUPS = Object.freeze({
  PERSONAL_TODAY: "personal-today",
  PERSONAL_HISTORY: "personal-history",
  PERSONAL_WORKFLOWS: "personal-workflows",
  PERSONAL_ACCESS: "personal-access",
  LEAVE_CALCULATIONS: "leave-calculations",
  CALENDAR: "attendance-calendar",
  ADMIN_TRACKING: "admin-tracking",
  ADMIN_METRICS: "admin-metrics",
  ADMIN_WORKFLOWS: "admin-workflows",
  ADMIN_WARNINGS: "admin-warnings",
  MEMBER_HOURS: "member-hours",
});

export const ATTENDANCE_CACHE_TTL = Object.freeze({
  VOLATILE: 15_000,
  WORKFLOWS: 30_000,
  HISTORY: 60_000,
  ACCESS: 60_000,
  CALCULATION: 5 * 60_000,
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

function pruneCache(now = Date.now()) {
  cache.forEach((entry, key) => {
    if (entry.expiresAt <= now) removeKey(key);
  });

  while (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey === undefined) break;
    removeKey(oldestKey);
  }
}

export function invalidateAttendanceCache(...groups) {
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

export function clearAttendanceCache() {
  invalidateAttendanceCache();
}

export function invalidateAttendanceScheduleCache() {
  invalidateAttendanceCache(
    ATTENDANCE_CACHE_GROUPS.PERSONAL_TODAY,
    ATTENDANCE_CACHE_GROUPS.LEAVE_CALCULATIONS,
    ATTENDANCE_CACHE_GROUPS.CALENDAR,
    ATTENDANCE_CACHE_GROUPS.ADMIN_TRACKING,
  );
}

export function invalidateAttendanceMembershipCache() {
  invalidateAttendanceCache(
    ATTENDANCE_CACHE_GROUPS.PERSONAL_TODAY,
    ATTENDANCE_CACHE_GROUPS.PERSONAL_HISTORY,
    ATTENDANCE_CACHE_GROUPS.PERSONAL_WORKFLOWS,
    ATTENDANCE_CACHE_GROUPS.PERSONAL_ACCESS,
    ATTENDANCE_CACHE_GROUPS.LEAVE_CALCULATIONS,
    ATTENDANCE_CACHE_GROUPS.CALENDAR,
    ATTENDANCE_CACHE_GROUPS.ADMIN_TRACKING,
    ATTENDANCE_CACHE_GROUPS.ADMIN_METRICS,
    ATTENDANCE_CACHE_GROUPS.ADMIN_WORKFLOWS,
    ATTENDANCE_CACHE_GROUPS.ADMIN_WARNINGS,
    ATTENDANCE_CACHE_GROUPS.MEMBER_HOURS,
  );
}

export async function getCachedAttendanceData(
  key,
  loader,
  { force = false, ttl = ATTENDANCE_CACHE_TTL.WORKFLOWS, groups = [] } = {},
) {
  const now = Date.now();
  pruneCache(now);
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
        pruneCache();
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
