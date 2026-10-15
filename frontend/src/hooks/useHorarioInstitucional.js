import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { getAgendaPeople } from "@/services/agenda/agendaService";

function accountKey(profile) {
  const id = profile?.cuenta_acceso_id || profile?.id;
  return id ? String(id) : null;
}

function calculateBlockHours(block) {
  const [startHour, startMinute] = String(block?.hora_inicio || "00:00")
    .split(":")
    .map(Number);
  const [endHour, endMinute] = String(block?.hora_fin || "00:00")
    .split(":")
    .map(Number);
  const start = (startHour || 0) * 60 + (startMinute || 0);
  const end = (endHour || 0) * 60 + (endMinute || 0);

  return Math.max(0, end - start) / 60;
}

function normalizeRows(people = []) {
  return people.map((person) => ({
    ...person,
    activo: true,
    total_horas: (person.horarios || []).reduce(
      (total, block) => total + calculateBlockHours(block),
      0,
    ),
  }));
}

export function useHorarioInstitucional() {
  const { profile } = useAuth();
  const key = accountKey(profile);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(Boolean(key));
  const [error, setError] = useState("");

  const load = useCallback(async (force = false) => {
    if (!key) {
      setRows([]);
      setLoading(false);
      return [];
    }

    setLoading(true);
    setError("");

    try {
      const people = await getAgendaPeople({ force, cacheScope: key });
      const normalized = normalizeRows(people);
      setRows(normalized);
      return normalized;
    } catch (loadError) {
      setRows([]);
      setError(loadError?.message || "No se pudieron cargar los horarios.");
      return [];
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    let active = true;

    if (!key) {
      Promise.resolve().then(() => {
        if (!active) return;
        setRows([]);
        setLoading(false);
        setError("");
      });

      return () => {
        active = false;
      };
    }

    Promise.resolve()
      .then(() => {
        if (!active) return [];
        setLoading(true);
        setError("");
        return getAgendaPeople({ cacheScope: key });
      })
      .then((people) => {
        if (active) setRows(normalizeRows(people));
      })
      .catch((loadError) => {
        if (!active) return;
        setRows([]);
        setError(loadError?.message || "No se pudieron cargar los horarios.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [key]);

  return {
    rows,
    allRows: rows,
    loading,
    error,
    refresh: () => load(true),
  };
}
