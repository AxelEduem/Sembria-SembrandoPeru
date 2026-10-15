import {
  CalendarClock,
  Check,
  Clock3,
  Link as LinkIcon,
  MapPin,
  Send,
  UserCheck,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import AgendaParticipantAvatar from "./AgendaParticipantAvatar";

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function responseColor(status) {
  if (status === "aceptada") return "bg-emerald-500";
  if (status === "rechazada") return "bg-red-500";
  return "bg-amber-400";
}

function AgendaRequestCard({ meeting, variant, saving, onRespond, onCancel }) {
  const isSent = variant === "enviadas";
  const hasAccepted = !isSent && meeting.mi_estado === "aceptada";
  const canRespond = !isSent && meeting.mi_estado === "pendiente";
  const participants = meeting.participantes || [];
  const guests = participants.filter((person) => !person.es_organizador);
  const organizer = participants.find((person) => person.es_organizador);
  const acceptedCount = guests.filter((person) => person.estado === "aceptada").length;
  const pendingCount = guests.filter((person) => person.estado === "pendiente").length;
  const progress = guests.length ? Math.round((acceptedCount / guests.length) * 100) : 0;
  const TypeIcon = isSent ? Send : UserCheck;

  return (
    <article
      className={`module-row-enter relative overflow-hidden border bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_12px_36px_rgba(15,23,42,0.1)] ${
        isSent ? "border-sky-200" : "border-amber-200"
      } rounded-3xl`}
    >
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3.5">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center border ${
                isSent
                  ? "border-sky-200 bg-sky-50 text-sky-600"
                  : "border-amber-200 bg-amber-50 text-amber-600"
              } rounded-2xl`}
            >
              <TypeIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p
                className={`text-[9px] font-extrabold tracking-[0.14em] uppercase ${
                  isSent ? "text-sky-600" : "text-amber-600"
                }`}
              >
                {isSent ? "Solicitud enviada" : "Solicitud recibida"}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-800">{meeting.titulo}</h3>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-extrabold text-amber-700 uppercase ring-1 ring-amber-100">
                  Pendiente
                </span>
              </div>
              {!isSent && organizer && (
                <p className="mt-1 text-[11px] text-slate-500">
                  Enviada por <span className="font-bold text-slate-700">{organizer.nombre}</span>
                </p>
              )}
            </div>
          </div>

          {isSent && (
            <Button
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => onCancel(meeting.id)}
              className="shrink-0 rounded-xl border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <X /> Cancelar solicitud
            </Button>
          )}
        </div>

        {meeting.descripcion && (
          <p className="mt-4 border-l-2 border-slate-200 pl-3 text-xs leading-5 text-slate-500">
            {meeting.descripcion}
          </p>
        )}

        <div className="mt-5 grid gap-2 text-[11px] font-semibold text-slate-600 sm:grid-cols-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
            <CalendarClock className="h-4 w-4 shrink-0 text-emerald-600" />
            <div>
              <p className="text-[8px] font-bold tracking-wider text-slate-400 uppercase">Fecha</p>
              <p className="mt-0.5 capitalize">{formatDate(meeting.fecha)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
            <Clock3 className="h-4 w-4 shrink-0 text-emerald-600" />
            <div>
              <p className="text-[8px] font-bold tracking-wider text-slate-400 uppercase">
                Horario
              </p>
              <p className="mt-0.5">
                {String(meeting.hora_inicio).slice(0, 5)} – {String(meeting.hora_fin).slice(0, 5)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
            <MapPin className="h-4 w-4 shrink-0 text-emerald-600" />
            <div className="min-w-0">
              <p className="text-[8px] font-bold tracking-wider text-slate-400 uppercase">
                Modalidad
              </p>
              <p className="mt-0.5 truncate capitalize">{meeting.modalidad}</p>
            </div>
          </div>
        </div>

        {(meeting.ubicacion || meeting.enlace) && (
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold">
            {meeting.ubicacion && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-2 text-slate-600">
                <MapPin className="h-3.5 w-3.5" /> {meeting.ubicacion}
              </span>
            )}
            {meeting.enlace && (
              <a
                href={meeting.enlace}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-emerald-700 hover:bg-emerald-100"
              >
                <LinkIcon className="h-3.5 w-3.5" /> Abrir enlace
              </a>
            )}
          </div>
        )}

        {(isSent || hasAccepted) && (
          <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-extrabold tracking-wider text-sky-700 uppercase">
                  Respuestas recibidas
                </p>
                <p className="mt-1 text-xs font-bold text-slate-700">
                  {acceptedCount} de {guests.length} participantes aceptaron
                </p>
              </div>
              <span className="text-sm font-extrabold text-sky-700">{progress}%</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sky-100">
              <div
                className="h-full rounded-full bg-sky-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-[10px] text-sky-700">
              {pendingCount} {pendingCount === 1 ? "respuesta pendiente" : "respuestas pendientes"}
            </p>
          </div>
        )}

        {hasAccepted && (
          <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
            <p className="text-xs font-bold text-emerald-700">Ya confirmaste tu asistencia.</p>
            <p className="mt-1 text-[10px] text-emerald-600">
              La solicitud permanecerá aquí hasta que respondan todos los participantes.
            </p>
          </div>
        )}

        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
              Participantes
            </p>
            <span className="text-[10px] font-semibold text-slate-400">
              {participants.length} en total
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {participants.map((person) => (
              <div
                key={person.cuenta_id}
                className="flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm"
              >
                <AgendaParticipantAvatar person={person} />
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${responseColor(person.estado)}`}
                />
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold text-slate-700">{person.nombre}</p>
                  <p className="mt-0.5 text-[9px] font-semibold text-slate-400 capitalize">
                    {person.es_organizador ? "Organizador" : person.estado}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {canRespond && (
          <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button
              size="sm"
              variant="outline"
              disabled={saving}
              onClick={() => onRespond(meeting.id, "rechazada")}
              className="rounded-xl border-red-200 bg-white text-red-600 hover:bg-red-50"
            >
              <X /> Rechazar
            </Button>
            <Button
              size="sm"
              disabled={saving}
              onClick={() => onRespond(meeting.id, "aceptada")}
              className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Check /> Aceptar solicitud
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}

export default AgendaRequestCard;
