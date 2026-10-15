import {
  BriefcaseBusiness,
  Building2,
  Mail,
} from "lucide-react";

import EnlargeablePhoto from "@/components/ui/enlargeable-photo";
import { getAvatarUrl } from "@/utils/avatar";

function initials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U"
  );
}

function time(value) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value).slice(0, 5)
    : new Intl.DateTimeFormat("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "America/Lima",
      }).format(date);
}

const colors = {
  Falta: "border-rose-100 bg-rose-50 text-rose-700",
  Justificada: "border-violet-100 bg-violet-50 text-violet-700",
  Completada: "border-blue-100 bg-blue-50 text-blue-700",
  "En jornada": "border-emerald-100 bg-emerald-50 text-emerald-700",
  Permiso: "border-cyan-100 bg-cyan-50 text-cyan-700",
  "Anulada por feriado": "border-slate-200 bg-slate-50 text-slate-600",
  "Salida anticipada": "border-amber-100 bg-amber-50 text-amber-700",
  Tardanza: "border-orange-100 bg-orange-50 text-orange-700",
};

export default function SeguimientoRow({
  row,
  index = 0,
  onOpenDetail,
}) {
  const schedule = row.horario_id
    ? `${String(row.hora_inicio_programada).slice(0, 5)} – ${String(
        row.hora_fin_programada,
      ).slice(0, 5)}`
    : "Sin jornada";
  const entry = time(row.hora_entrada);
  const exit = time(row.hora_salida);
  const avatarUrl = getAvatarUrl(row.avatar_url) || getAvatarUrl(row.avatar_path);

  return (
    <tr
      onClick={() => onOpenDetail?.(row)}
      onKeyDown={(event) => {
        if (event.currentTarget === event.target && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onOpenDetail?.(row);
        }
      }}
      tabIndex={0}
      aria-label={`Ver detalle de asistencia de ${row.integrante}`}
      style={{ animationDelay: `${260 + index * 55}ms` }}
      className="module-row-enter group cursor-pointer border-t border-slate-100 text-sm transition-colors duration-150 hover:bg-slate-50/60 focus:bg-emerald-50/50 focus:outline-none"
    >
      <td className="px-5 py-4 align-middle">
        <div className="flex min-w-0 items-center gap-3">
          {avatarUrl ? (
            <EnlargeablePhoto
              src={avatarUrl}
              fallbackSrc={getAvatarUrl(row.avatar_path)}
              fallback={initials(row.integrante)}
              alt={`Foto de ${row.integrante || "integrante"}`}
              className="h-9 w-9 rounded-lg border border-emerald-100 bg-emerald-50 text-xs font-bold text-emerald-700 transition-transform hover:scale-110"
            />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-xs font-bold text-emerald-700 transition-colors group-hover:bg-emerald-100">
              {initials(row.integrante)}
            </span>
          )}
          <div className="min-w-0">
            <p className="line-clamp-2 leading-5 font-semibold wrap-break-word text-slate-800">
              {row.integrante}
            </p>
            <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
              <Mail className="h-3 w-3 shrink-0" strokeWidth={1.8} />
              <span className="max-w-50 truncate" title={row.correo || undefined}>
                {row.correo || "Sin correo"}
              </span>
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4 align-middle">
        <div className="flex items-start gap-2">
          <BriefcaseBusiness
            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
            strokeWidth={1.8}
          />
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm leading-5 font-medium wrap-break-word text-slate-600">
              {row.cargo || "Sin cargo"}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
              <Building2 className="h-3 w-3 shrink-0" strokeWidth={1.8} />
              <span className="truncate">{row.area || "Sin área"}</span>
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4 align-middle">
        <p className="text-sm leading-5 font-medium whitespace-nowrap text-slate-600">
          {schedule}
        </p>
      </td>
      <td className="px-5 py-4 align-middle">
        <p className="text-sm font-medium whitespace-nowrap text-slate-600">
          {entry ? `${entry}${exit ? ` – ${exit}` : ""}` : "Sin registro"}
        </p>
        {entry && !exit ? (
          <p className="mt-0.5 text-xs text-emerald-600">Jornada abierta</p>
        ) : null}
      </td>
      <td className="px-5 py-4 align-middle">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
            colors[row.seguimiento] || "border-slate-200 bg-slate-100 text-slate-600"
          }`}
        >
          {row.seguimiento}
        </span>
        {Number(row.minutos_tardanza || 0) > 0 && row.seguimiento !== "Tardanza" ? (
          <p className="mt-1 text-[10px] font-semibold text-orange-600">
            {row.minutos_tardanza} min tarde
          </p>
        ) : null}
      </td>
    </tr>
  );
}
