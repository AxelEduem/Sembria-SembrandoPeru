import { AlertTriangle, CalendarClock, Clock3, ExternalLink, ShieldAlert } from "lucide-react";

import { getAvatarUrl } from "@/utils/avatar";
import EnlargeablePhoto from "@/components/ui/enlargeable-photo";

function localTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(11, 16);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Lima",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function duration(value) {
  const total = Math.max(0, Number(value) || 0);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return hours ? `${hours} h ${minutes ? `${minutes} min` : ""}`.trim() : `${minutes} min`;
}

function initials(name = "") {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";
}

function formattedDate(value) {
  if (!value) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function DetailItem({ icon: Icon, label, value, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-50 text-slate-600",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };
  return <div className="rounded-xl border border-slate-200 p-3"><div className="flex items-center gap-2"><span className={`rounded-lg p-1.5 ${tones[tone]}`}><Icon className="h-3.5 w-3.5" /></span><span className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">{label}</span></div><p className="mt-2 text-sm font-semibold text-slate-800">{value}</p></div>;
}

export default function AttendanceDetailView({ row }) {
  const avatarUrl = getAvatarUrl(row.avatar_url) || getAvatarUrl(row.avatar_path);
  return <div className="space-y-4">
    <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        {avatarUrl ? <EnlargeablePhoto src={avatarUrl} fallbackSrc={getAvatarUrl(row.avatar_path)} alt={`Foto de ${row.integrante}`} className="h-16 w-16 rounded-2xl border border-emerald-100 shadow-sm" /> : <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-base font-bold text-emerald-700">{initials(row.integrante)}</span>}
        <div className="min-w-0"><p className="text-[10px] font-bold tracking-[0.12em] text-emerald-700 uppercase">Detalle de asistencia</p><h1 className="mt-1 truncate text-xl font-extrabold text-slate-900">{row.integrante}</h1><p className="mt-1 text-xs text-slate-500">{row.cargo || "Sin cargo"} · {row.area || "Sin área"} · {formattedDate(row.fecha)}</p></div>
      </div>
    </header>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <DetailItem icon={CalendarClock} label="Horario" value={row.horario_id ? `${String(row.hora_inicio_programada).slice(0, 5)} – ${String(row.hora_fin_programada).slice(0, 5)}` : "Sin jornada"} />
      <DetailItem icon={Clock3} label="Tiempo realizado" value={duration(row.minutos_realizados)} tone="emerald" />
      <DetailItem icon={AlertTriangle} label="Tardanza" value={duration(row.minutos_tardanza)} tone={row.minutos_tardanza ? "amber" : "slate"} />
      <DetailItem icon={ShieldAlert} label="Salida anticipada" value={duration(row.minutos_salida_anticipada)} tone={row.minutos_salida_anticipada ? "rose" : "slate"} />
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-bold text-slate-800">Información de la jornada</h2><dl className="mt-4 space-y-3 text-xs"><div className="flex justify-between gap-4"><dt className="text-slate-400">Estado</dt><dd className="font-semibold text-slate-700">{row.seguimiento}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-400">Marcación</dt><dd className="font-semibold text-slate-700">{row.hora_entrada ? `${localTime(row.hora_entrada)}${row.hora_salida ? ` – ${localTime(row.hora_salida)}` : ""}` : "Sin registro"}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-400">Incumplimiento</dt><dd className="font-semibold text-slate-700">{duration(row.minutos_incumplidos)}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-400">Amonestaciones</dt><dd className="font-semibold text-slate-700">{row.amonestaciones || 0}</dd></div></dl><div className="mt-4 rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold text-slate-400 uppercase">Trabajo realizado</p><p className="mt-1 text-xs leading-5 text-slate-600">{row.descripcion_jornada || "No se registró una descripción."}</p></div>{row.evidencia_url ? <a href={row.evidencia_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700"><ExternalLink className="h-3.5 w-3.5" />Ver evidencia adjunta</a> : null}</section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-bold text-slate-800">Incidencias y justificación</h2><div className="mt-3 space-y-2">{(row.incidencias || []).length ? row.incidencias.map((item) => <div key={item.id} className="rounded-xl border border-amber-100 bg-amber-50/60 p-3"><p className="text-xs font-bold text-amber-800">{String(item.tipo || "Incidencia").replaceAll("_", " ")}</p><p className="mt-1 text-[11px] text-amber-700">{item.descripcion || `${item.minutos || 0} minutos`}</p></div>) : <p className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-400">Sin incidencias registradas.</p>}</div>{row.justificacion_id ? <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/60 p-3"><p className="text-xs font-bold text-violet-800">Justificación · {row.justificacion_estado}</p><p className="mt-1 text-[11px] leading-5 text-violet-700">{row.justificacion_motivo || "Sin motivo registrado."}</p>{row.justificacion_observacion ? <p className="mt-1 text-[11px] text-violet-600">Observación: {row.justificacion_observacion}</p> : null}</div> : null}</section>
    </div>
  </div>;
}
