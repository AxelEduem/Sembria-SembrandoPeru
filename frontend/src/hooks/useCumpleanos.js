import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import {
  CUMPLEANOS_CACHE_GROUPS,
  CUMPLEANOS_CACHE_TTL,
  getCachedCumpleanosData,
  getCumpleanosCache,
  isCumpleanosLoading,
  subscribeCumpleanos,
} from "@/services/cumpleanos/cache";
import { getCumpleanosIntegrantes } from "@/services/cumpleanos/queries";
import { PERMISSIONS, getPermissionScopeKey } from "@/utils/permissions";

function scopeKey(profile) {
  if (!profile) return "anon";

  return `${profile.id || "anon"}:${getPermissionScopeKey(
    profile,
    PERMISSIONS.CUMPLEANOS_VER,
  )}`;
}

function normalizeDate(value) {
  if (typeof value === "string") {
    const dateOnlyMatch = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      const year = Number(dateOnlyMatch[1]);
      const month = Number(dateOnlyMatch[2]) - 1;
      const day = Number(dateOnlyMatch[3]);
      const date = new Date(year, month, day);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function nextBirthday(dateOfBirth, today = new Date()) {
  if (!dateOfBirth) return null;
  const birth = normalizeDate(dateOfBirth);
  if (!birth) return null;

  const currentDay = new Date(today);
  currentDay.setHours(0, 0, 0, 0);

  const year = currentDay.getFullYear();
  let next = new Date(year, birth.getMonth(), birth.getDate());

  if (next < currentDay) {
    next = new Date(year + 1, birth.getMonth(), birth.getDate());
  }
  next.setHours(0, 0, 0, 0);
  return next;
}

function daysUntil(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

async function loadShared(profile, force = false) {
  if (!profile) {
    return { data: [], updatedAt: null, source: "no-profile" };
  }

  const key = scopeKey(profile);

  return getCachedCumpleanosData(
    key,
    async () => {
      const rows = await getCumpleanosIntegrantes();
      const data = rows
        .map((row) => {
          const birthday = nextBirthday(row.fecha_nacimiento);
          if (!birthday) return null;
          return {
            ...row,
            cumpleanos: birthday,
            dias_restantes: daysUntil(birthday),
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.dias_restantes - b.dias_restantes);

      return {
        data,
        updatedAt: Date.now(),
        source: "computed",
      };
    },
    {
      force,
      ttl: CUMPLEANOS_CACHE_TTL.LIST,
      groups: [CUMPLEANOS_CACHE_GROUPS.LIST],
    },
  );
}

export function useCumpleanos({ initialFilters } = {}) {
  const { profile } = useAuth();

  const [rows, setRows] = useState([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState(() => {
    const initial = initialFilters?.range;
    if (initial === undefined || initial === null || initial === "") return 365;
    const parsed = Number(initial);
    return Number.isFinite(parsed) ? parsed : 365;
  });
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const loading = internalLoading;

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!profile) {
        setRows([]);
        setLastUpdatedAt(null);
        setInternalLoading(false);
        return;
      }

      setInternalLoading(true);
      setError("");

      try {
        const result = await loadShared(profile, false);
        if (!mounted) return;
        setRows(result?.data || []);
        if (result?.updatedAt) setLastUpdatedAt(result.updatedAt);
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError?.message || "No se pudieron cargar los cumpleaños.");
      } finally {
        if (mounted) setInternalLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [profile]);

  useEffect(() => {
    const sync = () => {
      if (!profile) {
        setRows([]);
        setInternalLoading(false);
        setLastUpdatedAt(null);
        return;
      }

      const key = scopeKey(profile);
      const cached = getCumpleanosCache(key);
      if (cached) {
        setRows(cached.data || []);
        setLastUpdatedAt(cached.updatedAt || null);
      }
      setInternalLoading(isCumpleanosLoading(key));
    };

    return subscribeCumpleanos(sync);
  }, [profile]);

  const refresh = useCallback(async () => {
    if (!profile) {
      setRows([]);
      setLastUpdatedAt(null);
      return { success: false, message: "No se encontró el perfil autenticado." };
    }

    setInternalLoading(true);
    setError("");

    try {
      const result = await loadShared(profile, true);
      setRows(result?.data || []);
      setLastUpdatedAt(result?.updatedAt || Date.now());
      return { success: true, data: result?.data || [] };
    } catch (loadError) {
      const message = loadError?.message || "No se pudieron cargar los cumpleaños.";
      setError(message);
      return { success: false, message };
    } finally {
      setInternalLoading(false);
    }
  }, [profile]);

  const upcomingRows = useMemo(
    () => rows.filter((row) => row.dias_restantes >= 0 && row.dias_restantes <= range),
    [range, rows],
  );

  return {
    rows,
    upcomingRows,
    loading,
    error,
    range,
    setRange,
    refresh,
    lastUpdatedAt,
  };
}
