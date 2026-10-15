import { CalendarClock } from "lucide-react";
import { useLocation } from "react-router-dom";

import HorarioAreaView from "@/components/horario/HorarioArea/HorarioAreaView";
import HorarioFilters from "@/components/horario/HorarioFilters";
import HorarioTable from "@/components/horario/HorarioTable";
import HorarioLoadingSkeleton from "@/components/horario/HorarioLoadingSkeleton";
import HorarioViewSelector from "@/components/horario/HorarioViewSelector";
import ExcelIcon from "@/components/ui/ExcelIcon";
import ManualButton from "@/components/ui/ManualButton";
import { Button } from "@/components/ui/button";

import { useHorarioPage } from "@/hooks/useHorarioPage";
import { DIAS_SEMANA } from "@/services/integrantes-horarios/integrantesHorariosService";
import { downloadExcel } from "@/utils/excelExport";

function getTypeLabel(type) {
  if (type === "practicante") return "Practicante";
  if (type === "gerente") return "Gerente";
  return "Voluntario";
}

function getDaySchedule(row, dayValue) {
  return (row.horarios || [])
    .filter((block) => Number(block.dia_semana) === Number(dayValue))
    .sort((first, second) =>
      String(first.hora_inicio || "").localeCompare(String(second.hora_inicio || "")),
    )
    .map(
      (block) =>
        `${String(block.hora_inicio || "").slice(0, 5)} - ${String(block.hora_fin || "").slice(0, 5)}`,
    )
    .join(" | ");
}

function Horario() {
  const location = useLocation();
  const {
    loading,
    initialized,
    error,
    viewMode,
    setViewMode,
    areaOptions,
    areaViewFilter,
    setAreaViewFilter,
    areaViewRows,
    areaEmptyMessage,
    allRows,
    filteredRows,
    emptyMessage,
    filters,
  } = useHorarioPage();

  const showSkeleton = !initialized || loading;

  function handleDownloadExcel() {
    downloadExcel(
      {
        headers: [
          "Integrante",
          "Correo",
          "Tipo de integrante",
          "Área",
          "Cargo",
          "Horas semanales",
          ...DIAS_SEMANA.map((day) => day.label),
          "Estado del horario",
        ],
        data: allRows.map((row) => [
          row.nombre || "",
          row.correo || "",
          getTypeLabel(row.tipo_integrante),
          row.area || "",
          row.cargo || "",
          Number(row.total_horas || 0),
          ...DIAS_SEMANA.map((day) => getDaySchedule(row, day.value)),
          (row.horarios || []).length ? "Con horario" : "Sin horario",
        ]),
      },
      "horarios_integrantes.xlsx",
    );
  }

  return (
    <div className="module-page-enter pb-6">
      <div className="module-section-enter module-enter-delay-1 mb-4 flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleDownloadExcel}
          disabled={showSkeleton || Boolean(error) || !allRows.length}
          className="h-10 gap-2 rounded-xl border-emerald-200 bg-white px-4 text-emerald-700 shadow-none hover:bg-emerald-50 hover:text-emerald-800"
        >
          <ExcelIcon className="h-4 w-4" />
          Descargar Excel
        </Button>

        <ManualButton to="/horario/manual" state={{ listSearch: location.search }} />

        <HorarioViewSelector viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      {viewMode === "listado" && (
        <div className="module-section-enter module-enter-delay-2 space-y-5">
          <HorarioFilters {...filters} />

          {/* Indicador estático "Agenda semanal" */}
          <div className="flex justify-end">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-medium text-slate-400 shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
              <CalendarClock className="h-3.5 w-3.5 text-emerald-600" strokeWidth={1.8} />
              <span>Agenda semanal</span>
            </div>
          </div>

          {error ? (
            <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-100 font-semibold">
                !
              </div>
              <span>{error}</span>
            </div>
          ) : showSkeleton ? (
            <HorarioLoadingSkeleton />
          ) : (
            <HorarioTable emptyMessage={emptyMessage} horarios={filteredRows} />
          )}
        </div>
      )}

      {viewMode === "area" && (
        <div className="module-section-enter module-enter-delay-2">
          <HorarioAreaView
            areaFilter={areaViewFilter}
            areaOptions={areaOptions}
            emptyMessage={areaEmptyMessage}
            onAreaFilterChange={setAreaViewFilter}
            rows={areaViewRows}
          />
        </div>
      )}

    </div>
  );
}

export default Horario;
