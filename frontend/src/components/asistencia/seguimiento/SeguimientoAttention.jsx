import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  ShieldAlert,
} from "lucide-react";

function SeguimientoAttention({ rows, onSelectState }) {
  const attentionRows = rows
    .filter((row) =>
      [
        "No inició",
        "Falta",
        "Inicio pendiente",
        "Salida anticipada",
      ].includes(row.seguimiento),
    )
    .slice(0, 4);

  if (!attentionRows.length) {
    return (
      <section
        className="
          seguimiento-section-enter
          rounded-[22px]
          border
          border-emerald-100
          bg-emerald-50/45
          px-5
          py-4
        "
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
            <ShieldAlert className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800">
              Todo en orden
            </p>

            <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
              No hay jornadas que requieran atención inmediata.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="
        seguimiento-section-enter
        overflow-hidden
        rounded-[22px]
        border
        border-amber-100
        bg-white
        shadow-[0_4px_18px_rgba(15,23,42,0.03)]
      "
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <AlertTriangle className="h-4 w-4" />
          </div>

          <div>
            <p className="text-xs font-bold text-slate-800">
              Requieren atención
            </p>

            <p className="mt-0.5 text-[10px] text-slate-400">
              Situaciones que conviene revisar.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSelectState("")}
          className="
            hidden
            items-center
            gap-1
            text-[10px]
            font-semibold
            text-amber-700
            transition
            hover:text-amber-800
            sm:inline-flex
          "
        >
          Ver jornadas
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {attentionRows.map((row, index) => (
          <article
            key={`${row.integrante_id}-${row.horario_id || "none"}-${row.asistencia_id || "none"}`}
            className="seguimiento-card-enter flex items-center justify-between gap-4 px-5 py-3.5"
            style={{ animationDelay: `${index * 45}ms` }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[10px] font-bold text-slate-600">
                {String(row.integrante || "U")
                  .split(" ")
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-800">
                  {row.integrante || "Integrante"}
                </p>

                <p className="mt-0.5 truncate text-[10px] text-slate-400">
                  {row.area || "Sin área"} ·{" "}
                  {row.horario_id
                    ? `${String(row.hora_inicio_programada).slice(0, 5)} – ${String(row.hora_fin_programada).slice(0, 5)}`
                    : "Sin jornada"}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span
                className="
                  hidden
                  items-center
                  gap-1.5
                  rounded-full
                  border
                  border-amber-100
                  bg-amber-50
                  px-2.5
                  py-1.5
                  text-[10px]
                  font-semibold
                  text-amber-700
                  sm:inline-flex
                "
              >
                <Clock3 className="h-3 w-3" />
                {row.seguimiento}
              </span>

              <button
                type="button"
                onClick={() => onSelectState(row.seguimiento)}
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-slate-200
                  text-slate-400
                  transition
                  hover:border-slate-300
                  hover:bg-slate-50
                  hover:text-slate-700
                "
                aria-label={`Filtrar por ${row.seguimiento}`}
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default SeguimientoAttention;
