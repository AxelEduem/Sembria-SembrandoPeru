import { Check, Circle, Clock3, LockKeyhole } from "lucide-react";
import {
  CONVOCATORIA_PROCESS_STAGES,
  getConvocatoriaProcessStage,
} from "@/constants/convocatoriaProcess";

// Cierre es una bandeja de archivo, no una etapa operativa del proceso.
const stages = CONVOCATORIA_PROCESS_STAGES.filter((stage) => stage.key !== "cierre");

export default function ConvocatoriaProcessTimeline({
  etapa,
  primerCompleto,
  segundoCompleto,
  aprobacion,
  postulacion,
  seguimiento,
  convocatoria,
}) {
  const completed = new Set(["registro"]);
  if (primerCompleto) completed.add("primer_filtro");
  if (segundoCompleto) completed.add("segundo_filtro");
  if (aprobacion) completed.add("aprobacion");
  if (postulacion) completed.add("postulacion");
  if (postulacion?.estado === "enviada") completed.add("envio");
  if (seguimiento?.estado === "cerrado") completed.add("seguimiento");
const current = convocatoria
  ? getConvocatoriaProcessStage({
      ...convocatoria,
      postulaciones: postulacion
        ? [
            {
              ...postulacion,
              seguimientos: seguimiento
                ? [seguimiento]
                : [],
            },
          ]
        : [],
    })
  : postulacion?.estado === "enviada"
    ? "seguimiento"
    : seguimiento?.estado && seguimiento.estado !== "cerrado"
      ? "seguimiento"
      : etapa === "deteccion"
        ? (
            primerCompleto
              ? (
                  segundoCompleto
                    ? "aprobacion"
                    : "segundo_filtro"
                )
              : "primer_filtro"
          )
        : etapa;
  return (
    <section className="module-section-enter module-enter-delay-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="font-semibold text-slate-900">Proceso de convocatoria</h2>
        <p className="mt-1 text-sm text-slate-500">Avance del proyecto y próximas etapas.</p>
      </div>
      <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stages.map((stage) => {
          const done = completed.has(stage.key);
          const active = stage.key === current && !done;
          const Icon = done
            ? Check
            : stage.future && !active
              ? LockKeyhole
              : active
                ? Clock3
                : Circle;
          return (
            <li
              key={stage.key}
              className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${done ? "border-emerald-100 bg-emerald-50/60" : active ? "border-[#2D5A3D]/25 bg-emerald-50" : "border-slate-100 bg-slate-50/70"}`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${done || active ? "bg-[#2D5A3D] text-white" : "bg-slate-200 text-slate-500"}`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span>
                <span
                  className={`block text-sm font-semibold ${done || active ? "text-slate-800" : "text-slate-500"}`}
                >
                  {stage.label}
                </span>
                <span className="text-xs text-slate-500">
                  {done
                    ? "Completado"
                    : active
                      ? "Etapa actual"
                      : stage.future
                        ? "Proximamente"
                        : "Pendiente"}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
