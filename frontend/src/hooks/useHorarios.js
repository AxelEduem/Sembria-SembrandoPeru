import { useCallback, useMemo, useRef, useState } from "react";

import {
  areHorarioBlocksEqual,
  buildHorarioBlock,
  calculateDailyHours,
  calculateWeeklyHours,
  calculateWeeklyMinutes,
  createHorarioBlock,
  deleteHorarioBlock,
  deleteHorariosIntegrante,
  formatHours,
  getDailyHoursSummary,
  getHorariosIntegrante,
  getHorarioSummary,
  HORA_MAXIMA,
  HORA_MINIMA,
  HORAS_MINIMAS_SEMANALES,
  sortHorarioBlocks,
  updateHorarioBlock,
  validateHorarioBlocks,
  validateMinimumWeeklyHours,
  saveHorariosIntegrante,
} from "@/services/integrantes-horarios/integrantesHorariosService";
import { invalidateMiHorarioCache } from "@/hooks/useMiHorario";

export default function useHorarios() {
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [integranteId, setIntegranteId] = useState(null);
  const originalHorariosRef = useRef([]);

  const clearFeedback = useCallback(() => {
    setError("");
    setSuccess("");
  }, []);

  const loadHorarios = useCallback(async (id) => {
    setLoading(true);
    setError("");
    setSuccess("");
    setIntegranteId(id);
    originalHorariosRef.current = [];

    try {
      const data = await getHorariosIntegrante(id);

      const sortedBlocks = sortHorarioBlocks(data);

      originalHorariosRef.current = sortedBlocks.map((block) => ({ ...block }));
      setHorarios(sortedBlocks);

      return sortedBlocks;
    } catch (err) {
      const message = err?.message || "No se pudo cargar el horario del integrante.";

      setError(message);
      originalHorariosRef.current = [];
      setHorarios([]);

      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const setHorarioLocal = useCallback((blocks) => {
    const sortedBlocks = sortHorarioBlocks(Array.isArray(blocks) ? blocks : []);

    setHorarios(sortedBlocks);
    setError("");
    setSuccess("");
  }, []);

  const addBlock = useCallback(async (block) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const createdBlock = await createHorarioBlock(block);

      setHorarios((current) => sortHorarioBlocks([...current, createdBlock]));
      invalidateMiHorarioCache();

      setSuccess("Bloque de horario agregado correctamente.");

      return createdBlock;
    } catch (err) {
      const message = err?.message || "No se pudo agregar el bloque de horario.";

      setError(message);

      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const updateBlock = useCallback(async (id, block) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updatedBlock = await updateHorarioBlock(id, block);

      setHorarios((current) =>
        sortHorarioBlocks(
          current.map((item) => (Number(item.id) === Number(id) ? updatedBlock : item)),
        ),
      );
      invalidateMiHorarioCache();

      setSuccess("Bloque de horario actualizado correctamente.");

      return updatedBlock;
    } catch (err) {
      const message = err?.message || "No se pudo actualizar el bloque de horario.";

      setError(message);

      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const removeBlock = useCallback(async (id) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await deleteHorarioBlock(id);

      setHorarios((current) => current.filter((item) => Number(item.id) !== Number(id)));
      invalidateMiHorarioCache();

      setSuccess("Bloque de horario eliminado correctamente.");

      return true;
    } catch (err) {
      const message = err?.message || "No se pudo eliminar el bloque de horario.";

      setError(message);

      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const removeAllHorarios = useCallback(
    async (id) => {
      const targetId = id ?? integranteId;

      setSaving(true);
      setError("");
      setSuccess("");

      try {
        await deleteHorariosIntegrante(targetId);

        setHorarios([]);
        invalidateMiHorarioCache();

        setSuccess("El horario del integrante fue eliminado correctamente.");

        return true;
      } catch (err) {
        const message = err?.message || "No se pudo eliminar el horario del integrante.";

        setError(message);

        throw err;
      } finally {
        setSaving(false);
      }
    },
    [integranteId],
  );

  const saveAll = useCallback(
    async (id, blocks = horarios, options = {}) => {
      setSaving(true);
      setError("");
      setSuccess("");

      try {
        const savedBlocks = await saveHorariosIntegrante(id, blocks, options);

        const sortedBlocks = sortHorarioBlocks(savedBlocks);

        setIntegranteId(id);
        originalHorariosRef.current = sortedBlocks.map((block) => ({ ...block }));
        setHorarios(sortedBlocks);
        invalidateMiHorarioCache();

        setSuccess("Horario guardado correctamente.");

        return sortedBlocks;
      } catch (err) {
        const message = err?.message || "No se pudo guardar el horario.";

        setError(message);

        throw err;
      } finally {
        setSaving(false);
      }
    },
    [horarios],
  );

  const buildBlock = useCallback(
    ({ diaSemana, horaInicio, horaFin, id = null, integranteId: blockIntegranteId }) => {
      const targetIntegranteId = blockIntegranteId ?? integranteId;

      const block = buildHorarioBlock({
        integranteId: targetIntegranteId,
        diaSemana,
        horaInicio,
        horaFin,
      });

      if (id !== null && id !== undefined) {
        return {
          ...block,
          id,
        };
      }

      return block;
    },
    [integranteId],
  );

  const validateBlocks = useCallback(
    (blocks = horarios) => {
      return validateHorarioBlocks(Array.isArray(blocks) ? blocks : []);
    },
    [horarios],
  );

  const hasHorarioChanges = useCallback(
    (blocks = horarios) => !areHorarioBlocksEqual(originalHorariosRef.current, blocks),
    [horarios],
  );

  const validateMinimumHours = useCallback(
    (blocks = horarios) => {
      return validateMinimumWeeklyHours(Array.isArray(blocks) ? blocks : []);
    },
    [horarios],
  );

  const weeklyMinutes = useMemo(() => calculateWeeklyMinutes(horarios), [horarios]);

  const weeklyHours = useMemo(() => calculateWeeklyHours(horarios), [horarios]);

  const weeklyLabel = useMemo(() => formatHours(weeklyHours), [weeklyHours]);

  const minimumHoursReached = useMemo(() => weeklyHours >= HORAS_MINIMAS_SEMANALES, [weeklyHours]);

  const dailySummary = useMemo(() => getDailyHoursSummary(horarios), [horarios]);

  const summary = useMemo(() => getHorarioSummary(horarios), [horarios]);

  const getHoursForDay = useCallback(
    (diaSemana) => {
      return calculateDailyHours(horarios, diaSemana);
    },
    [horarios],
  );

  const getHoursLabelForDay = useCallback(
    (diaSemana) => {
      return formatHours(calculateDailyHours(horarios, diaSemana));
    },
    [horarios],
  );

  const getBlocksForDay = useCallback(
    (diaSemana) => {
      return horarios.filter((block) => Number(block.dia_semana) === Number(diaSemana));
    },
    [horarios],
  );

  const hasBlocksForDay = useCallback(
    (diaSemana) => {
      return horarios.some((block) => Number(block.dia_semana) === Number(diaSemana));
    },
    [horarios],
  );

  const clearHorario = useCallback(() => {
    setHorarios([]);
    setError("");
    setSuccess("");
  }, []);

  const reset = useCallback(() => {
    originalHorariosRef.current = [];
    setHorarios([]);
    setLoading(false);
    setSaving(false);
    setError("");
    setSuccess("");
    setIntegranteId(null);
  }, []);

  return {
    horarios,
    loading,
    saving,
    error,
    success,
    integranteId,

    horaMinima: HORA_MINIMA,
    horaMaxima: HORA_MAXIMA,
    horasMinimasSemanales: HORAS_MINIMAS_SEMANALES,

    weeklyMinutes,
    weeklyHours,
    weeklyLabel,
    minimumHoursReached,

    dailySummary,
    summary,

    loadHorarios,
    setHorarioLocal,

    addBlock,
    updateBlock,
    removeBlock,
    removeAllHorarios,

    saveAll,

    buildBlock,

    validateBlocks,
    validateMinimumHours,
    hasHorarioChanges,

    getHoursForDay,
    getHoursLabelForDay,
    getBlocksForDay,
    hasBlocksForDay,

    clearHorario,
    clearFeedback,
    reset,
  };
}
