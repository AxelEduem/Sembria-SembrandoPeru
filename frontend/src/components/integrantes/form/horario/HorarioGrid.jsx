import { useCallback, useEffect, useMemo, useState } from "react";

import {
  calculatePeriodHours,
  calculateWeeklyHours,
  sortHorarioBlocks,
  validateHorarioBlocks,
} from "@/services/integrantes-horarios/integrantesHorariosService";

import HorarioHeader from "./HorarioHeader";
import HorarioTable from "./HorarioTable";
import { buildSelectionBlock, getSelectionRange } from "./horarioUtils";

export default function HorarioGrid({
  horarios = [],
  onChange,
  disabled = false,
  canSelect = true,
  error = "",
  fechaInicio = "",
  fechaFin = "",
  showPeriodHours = true,
}) {
  const [selection, setSelection] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState("");

  const sortedHorarios = useMemo(() => sortHorarioBlocks(horarios), [horarios]);

  const weeklyHours = useMemo(() => calculateWeeklyHours(sortedHorarios), [sortedHorarios]);

  const periodHours = useMemo(
    () => calculatePeriodHours(sortedHorarios, fechaInicio, fechaFin),
    [sortedHorarios, fechaInicio, fechaFin],
  );

  const selectionRange = useMemo(
    () => (selection ? getSelectionRange(selection.start, selection.end) : null),
    [selection],
  );

  const selectedPreview = useMemo(
    () => (selection ? buildSelectionBlock(selection.day, selection.start, selection.end) : null),
    [selection],
  );

  const clearSelection = useCallback(() => {
    setSelection(null);
    setDragging(false);
  }, []);

  const handlePointerDown = (event, day, slotIndex) => {
    if (disabled || !canSelect) return;
    if (event.button !== 0) return;

    setLocalError("");

    setSelection({
      day,
      start: slotIndex,
      end: slotIndex,
    });

    setDragging(true);
  };

  const handlePointerMove = (event) => {
    if (disabled || !canSelect || !dragging || !selection) {
      return;
    }

    const cell = event.target.closest("[data-horario-cell]");

    if (!cell) return;

    const day = Number(cell.dataset.day);
    const slot = Number(cell.dataset.slot);

    if (!Number.isInteger(day) || !Number.isInteger(slot)) {
      return;
    }

    if (day !== Number(selection.day)) return;

    setSelection((current) => {
      if (!current) return current;

      return {
        ...current,
        end: slot,
      };
    });
  };

  const finishSelection = useCallback(() => {
    if (disabled || !canSelect || !dragging || !selection) {
      setDragging(false);
      return;
    }

    setDragging(false);

    const newBlock = buildSelectionBlock(selection.day, selection.start, selection.end);

    if (!newBlock) {
      clearSelection();
      return;
    }

    const validationError = validateHorarioBlocks([...sortedHorarios, newBlock]);

    if (validationError) {
      setLocalError(validationError);
      clearSelection();
      return;
    }

    onChange?.(
      sortHorarioBlocks([
        ...sortedHorarios,
        {
          ...newBlock,
          id: null,
        },
      ]),
    );

    clearSelection();
  }, [canSelect, clearSelection, disabled, dragging, onChange, selection, sortedHorarios]);

  useEffect(() => {
    if (!dragging) return undefined;

    const handleWindowPointerUp = () => {
      finishSelection();
    };

    window.addEventListener("pointerup", handleWindowPointerUp);

    return () => window.removeEventListener("pointerup", handleWindowPointerUp);
  }, [dragging, finishSelection]);

  const handleRemoveBlock = (block, event) => {
    event?.preventDefault();
    event?.stopPropagation();

    if (disabled) return;

    setLocalError("");

    onChange?.(
      sortedHorarios.filter(
        (item) =>
          !(
            (item.id ?? "new") === (block.id ?? "new") &&
            item.dia_semana === block.dia_semana &&
            item.hora_inicio === block.hora_inicio &&
            item.hora_fin === block.hora_fin
          ),
      ),
    );
  };

  return (
    <div className="space-y-5 select-none">
      <HorarioHeader
        weeklyHours={weeklyHours}
        periodHours={periodHours}
        canSelect={canSelect}
        error={error || localError}
        showPeriodHours={showPeriodHours}
      />

      <HorarioTable
        horarios={sortedHorarios}
        selection={selection}
        selectionRange={selectionRange}
        selectedPreview={selectedPreview}
        disabled={disabled}
        canSelect={canSelect}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishSelection}
        onRemoveBlock={handleRemoveBlock}
      />
    </div>
  );
}
