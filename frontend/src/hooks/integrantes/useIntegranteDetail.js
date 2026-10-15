import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getIntegranteById } from "@/services/integrantes/integrantesService";
import { getHorariosIntegrante } from "@/services/integrantes-horarios/integrantesHorariosService";

export function useIntegranteDetail() {
  const { id } = useParams();
  const { profile } = useAuth();
  const cacheScope = profile?.cuenta_acceso_id || profile?.id || "default";

  const [row, setRow] = useState(null);
  const [history, setHistory] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Reinicia la vista cuando React Router reutiliza la página con otro integrante.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");

    getIntegranteById(id, { cacheScope })
      .then(async (integrante) => {
        // El historial ya viene dentro del integrante: no refetcheamos.
        const integranteHistory = integrante.historiales?.length ? integrante.historiales : [];

        const historialId = integrante.historial_id || integrante.historial_actual?.id || null;

        const integranteHorarios = historialId ? await getHorariosIntegrante(historialId) : [];

        if (!mounted) return;

        setRow(integrante);
        setHistory(integranteHistory);
        setHorarios(integranteHorarios || []);
      })
      .catch((loadError) => {
        if (mounted) {
          setError(loadError.message || "No se pudo cargar el detalle.");
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [cacheScope, id]);

  const currentHistory = row?.historial_actual || history[0] || null;
  const tipoIntegrante = currentHistory?.tipo_integrante || "voluntario";
  const isPracticante = tipoIntegrante === "practicante";

  return {
    loading,
    error,
    clearError: () => setError(""),
    row,
    history,
    horarios,
    isPracticante,
    tipoIntegrante,
    currentHistory,
    departamento: row?.departamento || "",
    ciudad: row?.ciudad || "",
    distrito: row?.distrito || "",
  };
}
