import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getIntegranteCatalogs } from "@/services/integrantes/integrantesService";

export function useIntegranteCatalogs() {
  const { profile } = useAuth();
  const cacheScope = profile?.cuenta_acceso_id || profile?.id || "default";
  const [catalogs, setCatalogs] = useState({ areas: [], cargos: [] });

  useEffect(() => {
    let active = true;
    getIntegranteCatalogs({ cacheScope }).then((data) => { if (active) setCatalogs(data); }).catch(() => {
      if (active) setCatalogs({ areas: [], cargos: [] });
    });
    return () => { active = false; };
  }, [cacheScope]);

  return catalogs;
}
