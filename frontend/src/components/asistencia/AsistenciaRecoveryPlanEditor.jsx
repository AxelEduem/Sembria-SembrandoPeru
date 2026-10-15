import { Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { proponerRecuperacionIncidencia } from "@/services/asistencia/asistenciaService";
import { getTodayLimaISO } from "@/utils/asistenciaDateUtils";
import { recoveryMinutes } from "@/utils/asistenciaRecoveryUtils";

const emptyRecovery = () => ({ fecha: "", hora_inicio: "", hora_fin: "" });

function formatMinutes(value) {
  const minutes = Number(value) || 0;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

function dayAfter(value) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export default function AsistenciaRecoveryPlanEditor({
  requiredMinutes,
  incidentDate,
  recoveries,
  setRecoveries,
  busy = false,
  onError,
}) {
  const [days, setDays] = useState("1");
  const [generating, setGenerating] = useState(false);
  const planned = recoveryMinutes(recoveries);
  const matches = planned === requiredMinutes;
  const today = getTodayLimaISO();
  const recoveryBoundary = incidentDate > today ? incidentDate : today;
  const minimumRecoveryDate = dayAfter(recoveryBoundary);

  async function generate() {
    setGenerating(true);
    onError?.("");
    try {
      const result = await proponerRecuperacionIncidencia(requiredMinutes, recoveryBoundary, Number(days));
      setRecoveries(result.recuperaciones || []);
    } catch (cause) {
      onError?.(cause?.message || "No se pudo generar un plan compatible con tus horarios.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mt-5 border-t border-slate-100 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-slate-800">Plan de recuperación</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Debes programar {formatMinutes(requiredMinutes)}. Puedes generarlo o ingresarlo manualmente.
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${matches ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
          {formatMinutes(planned)} programados
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-2 rounded-xl border border-violet-100 bg-violet-50/60 p-3 sm:flex-row">
        <Input type="number" min="1" max="30" value={days} onChange={(event) => setDays(event.target.value)} className="h-10 bg-white sm:max-w-36" aria-label="Cantidad de días para recuperar" />
        <Button
          type="button"
          disabled={busy || generating || Number(days) < 1}
          onClick={() => void generate()}
          className="h-10 gap-2 bg-violet-700 text-white shadow-sm hover:bg-violet-800 hover:text-white focus-visible:ring-violet-500/30 disabled:bg-violet-400 disabled:text-white"
        >
          <Sparkles className="h-4 w-4" />{generating ? "Generando..." : "Generar automático"}
        </Button>
      </div>

      <div className="mt-3 space-y-2">
        {recoveries.map((row, index) => (
          <div key={index} className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
            {[
              ["fecha", "date", "Fecha"],
              ["hora_inicio", "time", "Inicio"],
              ["hora_fin", "time", "Fin"],
            ].map(([key, type, label]) => (
              <label key={key} className="text-[10px] font-bold text-slate-500">
                {label}
                <Input type={type} min={type === "date" ? minimumRecoveryDate : undefined} value={row[key]} disabled={busy} onChange={(event) => setRecoveries((items) => items.map((item, rowIndex) => rowIndex === index ? { ...item, [key]: event.target.value } : item))} className="mt-1 h-9 bg-white text-xs" />
              </label>
            ))}
            <button type="button" onClick={() => setRecoveries((items) => items.filter((_, rowIndex) => rowIndex !== index))} disabled={busy} className="self-end p-2 text-rose-500" aria-label="Eliminar recuperación"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setRecoveries((items) => [...items, emptyRecovery()])} disabled={busy} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700"><Plus className="h-4 w-4" />Agregar horario manual</button>
    </div>
  );
}
