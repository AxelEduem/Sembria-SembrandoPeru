import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { invalidateCurrentScheduleCache } from "@/services/integrantes-horarios/integrantesHorariosService";
import { getMiHorario } from "@/services/integrantes/integrantesService";

function scopeKey(profile) {
  return profile?.id || profile?.persona_id ? String(profile.id || profile.persona_id) : "anon";
}

function normalizeData(data) {
  return {
    integrante: data?.integrante || null,
    horarios: Array.isArray(data?.horarios) ? data.horarios : [],
  };
}

async function loadMiHorarioShared(profile, force = false) {
  if (!profile) {
    return normalizeData(null);
  }

  const data = await getMiHorario({
    force,
    cacheScope: scopeKey(profile),
  });
  return normalizeData(data);
}

export function invalidateMiHorarioCache(profile = null) {
  invalidateCurrentScheduleCache(profile ? scopeKey(profile) : null);
}

export function useMiHorario() {
  const { profile } = useAuth();
  const [data, setData] = useState(() => normalizeData(null));
  const [loading, setLoading] = useState(() => Boolean(profile));
  const [error, setError] = useState("");

  const refresh = useCallback(
    async (force = true) => {
      if (!profile) {
        setData(normalizeData(null));
        setLoading(false);
        return {
          success: true,
          data: normalizeData(null),
        };
      }

      setLoading(true);
      setError("");

      try {
        const next = await loadMiHorarioShared(profile, force);

        setData(next);

        return {
          success: true,
          data: next,
        };
      } catch (loadError) {
        const message = loadError?.message || "No se pudo cargar tu horario.";

        setError(message);

        return {
          success: false,
          message,
        };
      } finally {
        setLoading(false);
      }
    },
    [profile],
  );

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      if (!profile) {
        if (mounted) {
          setData(normalizeData(null));
          setLoading(false);
        }

        return;
      }

      if (mounted) {
        setLoading(true);
        setError("");
      }

      try {
        const next = await loadMiHorarioShared(profile, false);

        if (mounted) {
          setData(next);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError?.message || "No se pudo cargar tu horario.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, [profile]);

  return {
    integrante: data.integrante,
    horarios: data.horarios,
    loading,
    error,
    setError,
    refresh,
  };
}
