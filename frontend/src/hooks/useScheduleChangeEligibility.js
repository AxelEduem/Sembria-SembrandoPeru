import { useEffect, useState } from "react";

import { getMiCambioHorarioEligibility } from "@/services/solicitudes-cambio-horario/solicitudesCambioHorarioService";

const INITIAL_ELIGIBILITY = {
  canCreate: false,
  reason: null,
  availableFrom: null,
  message: null,
};

export function useScheduleChangeEligibility() {
  const [eligibility, setEligibility] = useState(INITIAL_ELIGIBILITY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getMiCambioHorarioEligibility()
      .then((result) => {
        if (active) setEligibility(result);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError?.message ||
              "No se pudo verificar si puedes solicitar un cambio de horario.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { eligibility, loading, error };
}
