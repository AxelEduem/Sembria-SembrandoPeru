import {
  CalendarDays,
  Clock3,
} from "lucide-react";

import AsistenciaBlockCard from "@/components/asistencia/AsistenciaBlockCard";

function AsistenciaToday({
  blocks,
  loading,
  busy,
  onStart,
  onFinish,
  onEarlyFinish,
}) {
  return (
    <section className="asistencia-section-enter">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-lg
              bg-emerald-50
              text-emerald-700
            "
          >
            <CalendarDays className="h-4 w-4" />
          </span>

          <div className="min-w-0">
            <p
              className="
                text-[10px]
                font-bold
                uppercase
                tracking-[0.08em]
                text-slate-400
              "
            >
              Jornada de hoy
            </p>

            <h2 className="text-base font-bold text-slate-900">
              Tus bloques programados
            </h2>
          </div>
        </div>

        {blocks.length > 0 ? (
          <div
            className="
              hidden
              text-[10px]
              font-semibold
              text-slate-400
              sm:block
            "
          >
            {blocks.length}{" "}
            {blocks.length === 1
              ? "bloque programado"
              : "bloques programados"}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1].map((item) => (
            <div
              key={item}
              className="
                asistencia-skeleton
                h-64
                rounded-[24px]
              "
            />
          ))}
        </div>
      ) : blocks.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {blocks.map((block, index) => (
            <AsistenciaBlockCard
              key={block.tipo_bloque === "recuperacion"
                ? `recuperacion-${block.recuperacion_id}`
                : `normal-${block.horario_id || block.id}`}
              block={block}
              index={index}
              busy={busy}
              onStart={() => onStart(block)}
              onFinish={() => onFinish(block)}
              onEarlyFinish={() =>
                onEarlyFinish(block)
              }
            />
          ))}
        </div>
      ) : (
        <div
          className="
            rounded-[24px]
            border
            border-dashed
            border-slate-300
            bg-white
            px-5
            py-14
            text-center
          "
        >
          <div
            className="
              mx-auto
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-2xl
              bg-slate-50
              text-slate-400
            "
          >
            <Clock3 className="h-5 w-5" />
          </div>

          <p className="mt-3 text-sm font-semibold text-slate-700">
            No tienes bloques programados hoy.
          </p>

          <p
            className="
              mx-auto
              mt-1
              max-w-md
              text-xs
              leading-5
              text-slate-400
            "
          >
            Cuando tengas un horario asignado para este
            día, tus bloques aparecerán automáticamente
            aquí.
          </p>
        </div>
      )}
    </section>
  );
}

export default AsistenciaToday;
