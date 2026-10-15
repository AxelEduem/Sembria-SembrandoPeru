import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getEquipos,
  getEquipoHistorial,
  getIntegrantesDisponibles,
  saveEquipo,
  setEquipoActivo,
} from "@/services/gestion-proyectos/equiposService";
import {
  getEquipoCandidatesCache,
  getEquiposCache,
  subscribeEquipos,
} from "@/services/gestion-proyectos/equiposCache";

export default function useEquipos({ includeTeams = true, includeCandidates = true } = {}) {
  const { profile } = useAuth();
  const cacheScope = profile?.cuenta_acceso_id || profile?.id || "default";
  const [equipos, setEquipos] = useState(() => getEquiposCache(cacheScope) || []);
  const [integrantes, setIntegrantes] = useState(() => getEquipoCandidatesCache(cacheScope) || []);
  const [loadedScope, setLoadedScope] = useState(cacheScope);
  const [loading, setLoading] = useState(() => (
    (includeTeams && getEquiposCache(cacheScope) === null)
    || (includeCandidates && getEquipoCandidatesCache(cacheScope) === null)
  ));
  const [saving, setSaving] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async ({ force = false } = {}) => {
    setLoading(true);
    setError("");
    try {
      const [teamItems, memberItems] = await Promise.all([
        includeTeams ? getEquipos({ force, cacheScope }) : Promise.resolve([]),
        includeCandidates ? getIntegrantesDisponibles({ force, cacheScope }) : Promise.resolve([]),
      ]);
      setEquipos(teamItems);
      setIntegrantes(memberItems);
      setLoadedScope(cacheScope);
    } catch (requestError) {
      setError(requestError.message || "No se pudieron cargar los equipos.");
    } finally {
      setLoading(false);
    }
  }, [cacheScope, includeCandidates, includeTeams]);

  useEffect(() => {
    let alive = true;
    Promise.all([
      includeTeams ? getEquipos({ cacheScope }) : Promise.resolve([]),
      includeCandidates ? getIntegrantesDisponibles({ cacheScope }) : Promise.resolve([]),
    ])
      .then(([teamItems, memberItems]) => {
        if (!alive) return;
        setEquipos(teamItems);
        setIntegrantes(memberItems);
        setLoadedScope(cacheScope);
        setLoading(false);
      })
      .catch((requestError) => {
        if (!alive) return;
        setError(requestError.message || "No se pudieron cargar los equipos.");
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [cacheScope, includeCandidates, includeTeams]);

  useEffect(() => subscribeEquipos(() => {
    const teams = includeTeams ? getEquiposCache(cacheScope) : [];
    const candidates = includeCandidates ? getEquipoCandidatesCache(cacheScope) : [];
    if (teams !== null) setEquipos(teams);
    if (candidates !== null) setIntegrantes(candidates);
    if (teams !== null || candidates !== null) setLoadedScope(cacheScope);
  }), [cacheScope, includeCandidates, includeTeams]);

  const save = useCallback(async (values, id) => {
    setSaving(true);
    try {
      const saved = await saveEquipo(values, id);
      await refresh({ force: true });
      return saved;
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  const setActive = useCallback(async (id, active) => {
    setUpdatingStatusId(id);
    try {
      const saved = await setEquipoActivo(id, active);
      await refresh({ force: true });
      return saved;
    } finally {
      setUpdatingStatusId(null);
    }
  }, [refresh]);

  const loadHistory = useCallback((id) => getEquipoHistorial(id), []);

  return {
    equipos: loadedScope === cacheScope ? equipos : [],
    integrantes: loadedScope === cacheScope ? integrantes : [],
    loading: loadedScope !== cacheScope || loading,
    saving,
    updatingStatusId,
    error,
    save,
    setActive,
    loadHistory,
  };
}
