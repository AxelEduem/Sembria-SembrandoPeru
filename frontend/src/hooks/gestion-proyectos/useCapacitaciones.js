import { useCallback, useEffect, useState } from "react";
import {
  completeCapacitacionStage,
  getCapacitaciones,
} from "@/services/gestion-proyectos/capacitacionesService";

export default function useCapacitaciones() {
  const [items, setItems] = useState([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getCapacitaciones();
      setItems(result.items);
      setCanManage(result.canManage);
    } catch (requestError) {
      setError(requestError.message || "No se pudo cargar la capacitación.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;

    getCapacitaciones()
      .then((result) => {
        if (!alive) return;
        setItems(result.items);
        setCanManage(result.canManage);
      })
      .catch((requestError) => {
        if (!alive) return;
        setError(requestError.message || "No se pudo cargar la capacitación.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const completeStage = useCallback(async (integranteId, stage) => {
    setUpdatingId(integranteId);
    setError("");
    try {
      const updated = await completeCapacitacionStage(integranteId, stage);
      setItems((current) => current.map((item) => (
        item.integrante_id === updated.integrante_id ? updated : item
      )));
      return updated;
    } catch (requestError) {
      setError(requestError.message || "No se pudo actualizar la capacitación.");
      return null;
    } finally {
      setUpdatingId(null);
    }
  }, []);

  return { items, canManage, loading, updatingId, error, reload: load, completeStage };
}
