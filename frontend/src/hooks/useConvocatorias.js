import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createFuente, getConvocatorias, getFuentes, saveConvocatoria } from "@/services/gestion-proyectos/convocatoriasService";
import { getMiEquipoContexto } from "@/services/gestion-proyectos/equiposService";
import {
  getConvocatoriasCache,
  getEquipoContextCache,
  getFuentesCache,
  subscribeConvocatorias,
} from "@/services/gestion-proyectos/cache";

export function useConvocatorias() {
  const { profile } = useAuth();
  const cacheScope = profile?.cuenta_acceso_id || profile?.id || "default";
  const [convocatorias, setConvocatorias] = useState(() => getConvocatoriasCache(cacheScope) || []),
    [fuentes, setFuentes] = useState(() => getFuentesCache(cacheScope) || []),
    [equipoContexto, setEquipoContexto] = useState(() => getEquipoContextCache(cacheScope)),
    [loading, setLoading] = useState(
      () =>
        getConvocatoriasCache(cacheScope) === null ||
        getFuentesCache(cacheScope) === null ||
        getEquipoContextCache(cacheScope) === null,
    ),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const refresh = useCallback(async ({ force = false } = {}) => {
    setLoading(true);
    setError("");
    try {
      const options = { force, cacheScope };
      const [items, sourceItems, teamContext] = await Promise.all([
        getConvocatorias(options),
        getFuentes(options),
        getMiEquipoContexto(options),
      ]);
      setConvocatorias(items);
      setFuentes(sourceItems);
      setEquipoContexto(teamContext);
    } catch (e) {
      setError(e.message || "No se pudieron cargar las convocatorias.");
    } finally {
      setLoading(false);
    }
  }, [cacheScope]);
  // La carga inicial sincroniza el estado con el API institucional.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);
  useEffect(
    () =>
      subscribeConvocatorias(() => {
        const cachedItems = getConvocatoriasCache(cacheScope);
        const cachedSources = getFuentesCache(cacheScope);
        const cachedContext = getEquipoContextCache(cacheScope);
        if (cachedItems !== null) setConvocatorias(cachedItems);
        if (cachedSources !== null) setFuentes(cachedSources);
        if (cachedContext !== null) setEquipoContexto(cachedContext);
      }),
    [cacheScope],
  );
  const save = useCallback(
    async (input, id) => {
      setSaving(true);
      try {
        const saved = await saveConvocatoria(input, id);
        await refresh({ force: true });
        return saved;
      } finally {
        setSaving(false);
      }
    },
    [refresh],
  );
  const addFuente = useCallback(async (input) => {
    const source = await createFuente(input);
    setFuentes((items) => [...items, source].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    return source;
  }, []);
  return useMemo(
    () => ({ convocatorias, fuentes, equipoContexto, loading, saving, error, refresh, save, addFuente }),
    [convocatorias, fuentes, equipoContexto, loading, saving, error, refresh, save, addFuente],
  );
}
