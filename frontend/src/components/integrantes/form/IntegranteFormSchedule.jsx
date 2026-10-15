import { useEffect } from "react";
import { CalendarDays } from "lucide-react";

import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import HorarioGrid from "@/components/integrantes/form/horario/HorarioGrid";
import { useIntegranteFormContext } from "@/contexts/IntegranteFormContext";

const GERENTE_BLOQUES = [1, 2, 3, 4, 5, 6].map((dia) => ({
  dia_semana: dia,
  hora_inicio: "08:00",
  hora_fin: "18:00",
}));

export default function IntegranteFormSchedule({ value = null } = {}) {
  const context = useIntegranteFormContext(!value);
  const {
    horariosState,
    submitting,
    fechaInicio,
    fechaFin,
    mode,
    navigate,
    listPath,
    canManageCurrentType,
    isGerente,
  } = value || context;

  const busy = Boolean(submitting);

  useEffect(() => {
    if (!isGerente) return;
    if (mode === "edit") return;
    if (horariosState.horarios.length > 0) return;

    const bloques = GERENTE_BLOQUES.map((b, i) => ({
      ...b,
      id: null,
      _tempId: `gerente-${i}`,
    }));

    horariosState.setHorarioLocal(bloques);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGerente, mode]);

  return (
    <div className="space-y-5">
      {!isGerente && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-100 bg-cyan-50">
                <CalendarDays className="h-5 w-5 text-cyan-600" strokeWidth={1.8} />
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {value?.scheduleTitle || (isGerente ? "Disponibilidad" : "Horarios")}
                </h2>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  {value?.scheduleDescription ||
                    (isGerente
                      ? "El gerente tiene disponibilidad fija de 08:00 a 18:00, lunes a viernes. No requiere marcar asistencia."
                      : "Define los días y horarios en los que participará el integrante.")}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <HorarioGrid
              horarios={horariosState.horarios}
              onChange={horariosState.setHorarioLocal}
              disabled={busy || isGerente}
              canSelect={!isGerente && Boolean(fechaInicio && fechaFin)}
              error={horariosState.error}
              fechaInicio={fechaInicio}
              fechaFin={fechaFin}
              showPeriodHours={!isGerente && mode !== "request"}
            />
          </div>
        </section>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">
              {value?.actionTitle || "¿Todo listo?"}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {value?.actionDescription || "Verifica la información antes de guardar."}
            </p>
          </div>

          <div className="flex w-full flex-col-reverse gap-2.5 sm:w-auto sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={value?.onCancel || (() => navigate(listPath))}
              disabled={busy}
              className="h-11 w-full rounded-xl border-slate-200 px-5 text-sm font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
            >
              Cancelar
            </Button>

            <ActionButton
              action={mode === "edit" ? "save" : "create"}
              type={value ? "button" : "submit"}
              onClick={value?.onSubmit}
              loading={busy}
              loadingText="Guardando..."
              disabled={value ? false : !canManageCurrentType}
              className="h-11 w-full sm:w-auto"
            >
              {value?.submitLabel || (mode === "edit" ? "Guardar cambios" : "Crear integrante")}
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}
