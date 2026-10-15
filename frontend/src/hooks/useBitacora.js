import { useCallback, useEffect, useRef, useState } from "react";

import { getBitacora } from "@/services/bitacora/bitacoraService";
import { getBitacoraCache, subscribeBitacora } from "@/services/bitacora/cache";

const EMPTY_SUMMARY = { total: 0, exitosos: 0, errores: 0, usuarios: 0 };
const EMPTY_META = { current_page: 1, last_page: 1, per_page: 20, total: 0, from: 0, to: 0 };

export default function useBitacora(filters, { cacheScope = "default" } = {}) {
  const initialResponse = getBitacoraCache(filters, cacheScope);
  const [records, setRecords] = useState(() => initialResponse?.data || []);
  const [summary, setSummary] = useState(() => initialResponse?.summary || EMPTY_SUMMARY);
  const [catalogs, setCatalogs] = useState(
    () => initialResponse?.catalogs || { modulos: [], acciones: [] },
  );
  const [meta, setMeta] = useState(() => initialResponse?.meta || EMPTY_META);
  const [loading, setLoading] = useState(() => initialResponse === null);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  const applyResponse = useCallback((response) => {
    setRecords(response?.data || []);
    setSummary(response?.summary || EMPTY_SUMMARY);
    setCatalogs(response?.catalogs || { modulos: [], acciones: [] });
    setMeta(response?.meta || EMPTY_META);
  }, []);

  const load = useCallback(
    async ({ force = false } = {}) => {
      const currentRequest = ++requestId.current;
      setLoading(true);
      setError("");

      try {
        const response = await getBitacora(filters, { force, cacheScope });
        if (currentRequest !== requestId.current) return;
        applyResponse(response);
      } catch (loadError) {
        if (currentRequest !== requestId.current) return;
        setError(loadError?.message || "No se pudo cargar la bitácora.");
        setRecords([]);
      } finally {
        if (currentRequest === requestId.current) setLoading(false);
      }
    },
    [applyResponse, cacheScope, filters],
  );

  useEffect(() => {
    const cached = getBitacoraCache(filters, cacheScope);
    const timer = window.setTimeout(
      () => {
        if (cached !== null) {
          applyResponse(cached);
          setError("");
          setLoading(false);
          return;
        }

        load();
      },
      cached !== null ? 0 : filters.q ? 300 : 0,
    );
    return () => window.clearTimeout(timer);
  }, [applyResponse, cacheScope, filters, load]);

  useEffect(
    () =>
      subscribeBitacora(() => {
        const cached = getBitacoraCache(filters, cacheScope);
        if (cached !== null) applyResponse(cached);
      }),
    [applyResponse, cacheScope, filters],
  );

  const refresh = useCallback(() => load({ force: true }), [load]);

  return { records, summary, catalogs, meta, loading, error, refresh };
}
