import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { getAgendaHistory } from "@/services/agenda/agendaService";

function accountKey(profile) {
  return String(profile?.cuenta_acceso_id || profile?.id || "default");
}

export function useAgendaHistory() {
  const { profile } = useAuth();
  const cacheScope = accountKey(profile);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    setLoading(true);
    setError("");

    return getAgendaHistory({ force: true, cacheScope })
      .then(setMeetings)
      .catch((requestError) => {
        setError(requestError.message || "No se pudo cargar el historial de reuniones.");
      })
      .finally(() => setLoading(false));
  }, [cacheScope]);

  useEffect(() => {
    let active = true;

    Promise.resolve().then(() => {
      if (!active) return;
      setLoading(true);
      setError("");
    });
    getAgendaHistory({ cacheScope })
      .then((data) => {
        if (active) setMeetings(data);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || "No se pudo cargar el historial de reuniones.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [cacheScope]);

  return { meetings, loading, error, refresh };
}
