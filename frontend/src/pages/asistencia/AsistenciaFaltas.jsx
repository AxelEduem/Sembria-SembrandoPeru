/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock3, ShieldAlert } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import FeedbackToast from "@/components/ui/FeedbackToast";
import { getMiHistorial } from "@/services/asistencia/asistenciaService";

function formatDate(value) {
  if (!value) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export default function AsistenciaFaltas() {
  const location = useLocation();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(() => location.state?.feedback || "");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setHistory(await getMiHistorial());
    } catch (cause) {
      setError(cause?.message || "No se pudieron cargar tus faltas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visibleAbsences = useMemo(
    () => history.filter(
      (item) => item.estado === "falta" && !(item.asistencia_justificaciones || []).length,
    ),
    [history],
  );

  return (
    <div className="module-page-enter space-y-5 pb-10">
      <Button asChild variant="ghost" className="w-fit gap-2 rounded-xl px-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
        <Link to="/asistencia"><ArrowLeft className="h-4 w-4" />Volver a mi asistencia</Link>
      </Button>

      <FeedbackToast
        feedback={error ? { type: "error", message: error } : feedback ? { type: "success", message: feedback } : null}
        onClose={() => { setError(""); setFeedback(""); }}
      />

      <section className="overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-[#7F1D1D] via-[#991B1B] to-[#BE123C] p-5 text-white sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15"><ShieldAlert className="h-5 w-5" /></span>
            <div>
              <p className="text-[10px] font-bold tracking-[0.12em] text-rose-100 uppercase">Gestión personal</p>
              <h1 className="mt-1 text-xl font-extrabold">Registro de faltas</h1>
              <p className="mt-1 max-w-2xl text-sm text-rose-50/80">Consulta las faltas que todavía debes justificar y programa su recuperación.</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6">
          {loading ? <div className="py-12 text-center text-sm text-slate-500">Cargando faltas...</div> : null}
          <div aria-live="polite" className="grid gap-4 lg:grid-cols-2">
            {!loading && !visibleAbsences.length ? (
              <div className="mx-auto my-8 w-full max-w-lg rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center lg:col-span-2">
                <ShieldAlert className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-3 font-bold text-slate-800">No tienes faltas sin justificar</p>
                <p className="mt-1 text-sm text-slate-500">Todas tus faltas registradas ya cuentan con una justificación enviada.</p>
              </div>
            ) : null}
            {visibleAbsences.map((item) => {
              return (
                <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold capitalize text-slate-900">{formatDate(item.fecha)}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><Clock3 className="h-3.5 w-3.5" />{String(item.hora_inicio_programada).slice(0, 5)} a {String(item.hora_fin_programada).slice(0, 5)}</p>
                      </div>
                      <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-rose-700">Falta</span>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs leading-5 text-slate-500">Explica el motivo de la inasistencia, programa la recuperación y adjunta un sustento si lo necesitas.</p>
                      <Button asChild variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50">
                        <Link to={`/asistencia/faltas/${item.id}/justificar`} state={{ absence: item }}>
                          Justificar falta
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
