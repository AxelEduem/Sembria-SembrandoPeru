import {
  BellRing,
  BarChart3,
  ArrowLeft,
  CalendarCheck2,
  CalendarClock,
  CalendarX2,
  Clock3,
  Link as LinkIcon,
  MapPin,
  History,
  Palette,
  RefreshCw,
  Send,
  UserCheck,
  UsersRound,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import AgendaRequestCard from "@/components/agenda/AgendaRequestCard";
import AgendaParticipantAvatar from "@/components/agenda/AgendaParticipantAvatar";
import MeetingFormDialog from "@/components/agenda/MeetingFormDialog";
import DisponibilidadIntegrantes from "@/components/horario/DisponibilidadIntegrantes/DisponibilidadIntegrantes";
import { Button } from "@/components/ui/button";
import FeedbackToast from "@/components/ui/FeedbackToast";
import ManualButton from "@/components/ui/ManualButton";
import TablePagination from "@/components/ui/TablePagination";
import { useAuth } from "@/contexts/AuthContext";
import { useAgenda } from "@/hooks/useAgenda";
import useUrlSyncedFilters from "@/hooks/useUrlSyncedFilters";

const PAGE_SIZE = 4;
const AGENDA_VIEWS = new Set(["reuniones", "solicitudes", "enviadas", "disponibilidad"]);
const AGENDA_PARAM_MAP = { view: "vista", page: "pagina" };
const AGENDA_URL_DEFAULTS = { view: "reuniones", page: "1" };
const NEXT_MEETING_COLOR_KEY = "agenda:next-meeting-color";

const NEXT_MEETING_THEMES = {
  emerald: {
    label: "Verde",
    swatch: "bg-emerald-500",
    surface: "border-emerald-100 bg-emerald-50/20",
    decoration: "bg-emerald-100/70",
    bar: "bg-emerald-500",
    icon: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    eyebrow: "text-emerald-600",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    accent: "text-emerald-600",
    button: "bg-emerald-600 hover:bg-emerald-700",
  },
  sky: {
    label: "Azul",
    swatch: "bg-sky-500",
    surface: "border-sky-100 bg-sky-50/20",
    decoration: "bg-sky-100/70",
    bar: "bg-sky-500",
    icon: "bg-sky-50 text-sky-600 ring-sky-100",
    eyebrow: "text-sky-600",
    badge: "bg-sky-50 text-sky-700 ring-sky-100",
    accent: "text-sky-600",
    button: "bg-sky-600 hover:bg-sky-700",
  },
  violet: {
    label: "Violeta",
    swatch: "bg-violet-500",
    surface: "border-violet-100 bg-violet-50/20",
    decoration: "bg-violet-100/70",
    bar: "bg-violet-500",
    icon: "bg-violet-50 text-violet-600 ring-violet-100",
    eyebrow: "text-violet-600",
    badge: "bg-violet-50 text-violet-700 ring-violet-100",
    accent: "text-violet-600",
    button: "bg-violet-600 hover:bg-violet-700",
  },
  amber: {
    label: "Ámbar",
    swatch: "bg-amber-500",
    surface: "border-amber-100 bg-amber-50/20",
    decoration: "bg-amber-100/70",
    bar: "bg-amber-500",
    icon: "bg-amber-50 text-amber-600 ring-amber-100",
    eyebrow: "text-amber-600",
    badge: "bg-amber-50 text-amber-700 ring-amber-100",
    accent: "text-amber-600",
    button: "bg-amber-500 hover:bg-amber-600",
  },
  rose: {
    label: "Rosa",
    swatch: "bg-rose-500",
    surface: "border-rose-100 bg-rose-50/20",
    decoration: "bg-rose-100/70",
    bar: "bg-rose-500",
    icon: "bg-rose-50 text-rose-600 ring-rose-100",
    eyebrow: "text-rose-600",
    badge: "bg-rose-50 text-rose-700 ring-rose-100",
    accent: "text-rose-600",
    button: "bg-rose-600 hover:bg-rose-700",
  },
};

const STATUS_STYLES = {
  pendiente: "bg-amber-50 text-amber-700 ring-amber-100",
  confirmada: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  rechazada: "bg-red-50 text-red-700 ring-red-100",
  cancelada: "bg-slate-100 text-slate-500 ring-slate-200",
};

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-PE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function meetingDateTime(meeting, field = "hora_inicio") {
  if (!meeting?.fecha || !meeting?.[field]) return null;
  const value = new Date(`${meeting.fecha}T${String(meeting[field]).slice(0, 8)}`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function NextMeetingCard({ color, loading, meeting, onCancel, onColorChange, saving }) {
  if (loading) {
    return (
      <div className="module-section-enter min-h-36 w-full animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:ml-auto lg:w-1/2">
        <div className="h-3 w-44 rounded-full bg-emerald-200" />
        <div className="mt-4 h-6 w-64 max-w-full rounded-full bg-emerald-200" />
        <div className="mt-5 flex flex-wrap gap-2">
          <div className="h-9 w-40 rounded-full bg-white/70" />
          <div className="h-9 w-32 rounded-full bg-white/70" />
          <div className="h-9 w-36 rounded-full bg-white/70" />
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="module-section-enter flex w-full items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.04)] sm:p-6 lg:ml-auto lg:w-1/2">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <CalendarCheck2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[9px] font-extrabold tracking-[0.14em] text-slate-400 uppercase">
            Próxima reunión confirmada
          </p>
          <p className="mt-1 text-sm font-extrabold text-slate-700">
            No tienes reuniones confirmadas próximamente
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Cuando se confirme una reunión, podrás ver aquí sus datos principales.
          </p>
        </div>
      </div>
    );
  }

  const participants = meeting.participantes || [];
  const organizer = participants.find((person) => person.es_organizador);
  const theme = NEXT_MEETING_THEMES[color] || NEXT_MEETING_THEMES.emerald;

  return (
    <article
      className={`module-section-enter relative z-0 w-full rounded-3xl border p-5 shadow-[0_12px_36px_rgba(15,23,42,0.08)] sm:p-6 lg:ml-auto lg:w-1/2 ${theme.surface}`}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
        <div className={`absolute -top-20 -right-16 h-48 w-48 rounded-full ${theme.decoration}`} />
      </div>
      <div className={`absolute inset-y-8 left-0 w-1 rounded-r-full ${theme.bar}`} />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3.5">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${theme.icon}`}
            >
              <BellRing className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={`text-[9px] font-extrabold tracking-[0.16em] uppercase ${theme.eyebrow}`}
                >
                  Próxima reunión confirmada
                </p>
                <span
                  className={`rounded-full px-2.5 py-1 text-[8px] font-extrabold ring-1 ${theme.badge}`}
                >
                  CONFIRMADA
                </span>
                <div className="flex items-center gap-1.5 self-start sm:absolute sm:top-0 sm:right-0">
                  <span className="inline-flex items-center gap-1 text-[8px] font-extrabold tracking-wider text-slate-400 uppercase">
                    <Palette className="h-3 w-3" /> Color
                  </span>
                  <div className="flex items-center gap-1.5 rounded-full border border-white/80 bg-white/90 px-2.5 py-1.5 shadow-[0_4px_14px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 backdrop-blur-sm">
                    {Object.entries(NEXT_MEETING_THEMES).map(([themeId, option]) => (
                      <button
                        key={themeId}
                        type="button"
                        title={option.label}
                        aria-label={`Usar color ${option.label}`}
                        aria-pressed={color === themeId}
                        onClick={() => onColorChange(themeId)}
                        className={`h-3.5 w-3.5 rounded-full transition duration-200 hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 ${option.swatch} ${
                          color === themeId
                            ? "scale-110 ring-2 ring-slate-400 ring-offset-2 ring-offset-white"
                            : ""
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <h2 className="mt-1.5 text-xl leading-tight font-extrabold text-slate-800 sm:text-2xl">
                {meeting.titulo}
              </h2>
              {organizer && (
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Organizada por{" "}
                  <span className="font-bold text-slate-700">{organizer.nombre}</span>
                </p>
              )}
              {meeting.descripcion && (
                <p className="mt-4 max-w-2xl text-xs leading-5 text-slate-500">
                  {meeting.descripcion}
                </p>
              )}
            </div>
          </div>
        </div>

        {meeting.enlace && (
          <a
            href={meeting.enlace}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl px-4 py-3 text-[11px] font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 lg:self-center ${theme.button}`}
          >
            <LinkIcon className="h-4 w-4" /> Ingresar a la reunión
          </a>
        )}
      </div>

      <div className="relative mt-4 flex flex-wrap items-center gap-2 sm:flex-nowrap">
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-50 px-3.5 py-2 text-[11px] font-bold whitespace-nowrap text-slate-600 ring-1 ring-slate-100">
          <CalendarClock className={`h-3.5 w-3.5 ${theme.accent}`} />
          <span className="capitalize">{formatDate(meeting.fecha)}</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-50 px-3.5 py-2 text-[11px] font-bold whitespace-nowrap text-slate-600 ring-1 ring-slate-100">
          <Clock3 className={`h-3.5 w-3.5 ${theme.accent}`} />
          {String(meeting.hora_inicio).slice(0, 5)} – {String(meeting.hora_fin).slice(0, 5)}
        </span>
        <span className="inline-flex min-w-0 items-center gap-2 rounded-full bg-slate-50 px-3.5 py-2 text-[11px] font-bold text-slate-600 ring-1 ring-slate-100">
          <MapPin className={`h-3.5 w-3.5 shrink-0 ${theme.accent}`} />
          <span className="truncate capitalize">{meeting.ubicacion || meeting.modalidad}</span>
        </span>
        <div className="group relative shrink-0">
          <button
            type="button"
            aria-label="Ver participantes de la reunión"
            className="inline-flex cursor-help items-center gap-2 rounded-full bg-slate-50 px-3.5 py-2 text-[11px] font-bold whitespace-nowrap text-slate-600 ring-1 ring-slate-100 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          >
            <UsersRound className={`h-3.5 w-3.5 ${theme.accent}`} />
            {participants.length} participantes
          </button>

          <div
            role="tooltip"
            className="pointer-events-none invisible absolute right-0 bottom-full z-50 mb-2 w-64 translate-y-1 rounded-2xl border border-slate-200 bg-white p-3 opacity-0 shadow-[0_12px_32px_rgba(15,23,42,0.16)] transition-all group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:visible group-hover:translate-y-0 group-hover:opacity-100"
          >
            <p className="mb-2 text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
              Participantes de la reunión
            </p>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {participants.map((person) => (
                <div
                  key={person.cuenta_id}
                  className="flex items-center gap-2 rounded-xl bg-slate-50 px-2.5 py-2"
                >
                  <AgendaParticipantAvatar person={person} className="h-8 w-8 rounded-lg" />
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      person.estado === "aceptada"
                        ? "bg-emerald-500"
                        : person.estado === "rechazada"
                          ? "bg-red-500"
                          : "bg-amber-400"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-bold text-slate-700">{person.nombre}</p>
                    <p className="text-[8px] font-semibold text-slate-400 capitalize">
                      {person.es_organizador ? "Organizador" : person.estado}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {meeting.soy_organizador && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => onCancel(meeting.id)}
            className="group ml-auto h-8 shrink-0 rounded-full border-rose-200 bg-white/85 px-3.5 text-[10px] font-extrabold text-rose-600 shadow-sm backdrop-blur-sm transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 focus-visible:ring-rose-200"
          >
            {saving ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-200 border-t-rose-600" />
            ) : (
              <CalendarX2 className="h-3.5 w-3.5 transition-transform group-hover:-rotate-6" />
            )}
            {saving ? "Cancelando..." : "Cancelar"}
          </Button>
        )}
      </div>
    </article>
  );
}

function MeetingCard({ meeting, saving, onCancel }) {
  const participants = meeting.participantes || [];
  const organizer = participants.find((person) => person.es_organizador);
  const acceptedCount = participants.filter((person) => person.estado === "aceptada").length;
  const active = ["pendiente", "confirmada"].includes(meeting.estado);

  return (
    <article className="module-row-enter relative overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_12px_36px_rgba(15,23,42,0.1)]">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600">
              <CalendarCheck2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-extrabold tracking-[0.14em] text-emerald-600 uppercase">
                Reunión confirmada
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-800">{meeting.titulo}</h3>
                <span
                  className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase ring-1 ${STATUS_STYLES[meeting.estado] || STATUS_STYLES.cancelada}`}
                >
                  {meeting.estado}
                </span>
              </div>
              {organizer && (
                <p className="mt-1 text-[11px] text-slate-500">
                  Organizada por{" "}
                  <span className="font-bold text-slate-700">{organizer.nombre}</span>
                </p>
              )}
            </div>
          </div>
          {meeting.soy_organizador && active && (
            <Button
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => onCancel(meeting.id)}
              className="shrink-0 rounded-xl border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <X /> Cancelar reunión
            </Button>
          )}
        </div>

        {meeting.descripcion && (
          <p className="mt-4 border-l-2 border-emerald-200 pl-3 text-xs leading-5 text-slate-500">
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

        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
              Participantes
            </p>
            <span className="text-[10px] font-semibold text-slate-400">
              {acceptedCount} confirmados de {participants.length}
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
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${person.estado === "aceptada" ? "bg-emerald-500" : person.estado === "rechazada" ? "bg-red-500" : "bg-amber-400"}`}
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
      </div>
    </article>
  );
}

function AgendaLoading() {
  return (
    <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
      <div className="text-center">
        <RefreshCw className="mx-auto h-8 w-8 animate-spin text-emerald-500" />
        <p className="mt-3 text-xs font-semibold text-slate-500">Cargando agenda...</p>
      </div>
    </div>
  );
}

function Agenda() {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const agenda = useAgenda();
  const { readInitialFilters, writeFiltersToUrl } = useUrlSyncedFilters({
    paramMap: AGENDA_PARAM_MAP,
    defaults: AGENDA_URL_DEFAULTS,
  });
  const urlState = readInitialFilters();
  const view = AGENDA_VIEWS.has(urlState.view) ? urlState.view : AGENDA_URL_DEFAULTS.view;
  const [formOpen, setFormOpen] = useState(false);
  const [meetingSelection, setMeetingSelection] = useState(null);
  const [nextMeetingColor, setNextMeetingColor] = useState(() => {
    try {
      const savedColor = window.localStorage.getItem(NEXT_MEETING_COLOR_KEY);
      return NEXT_MEETING_THEMES[savedColor] ? savedColor : "emerald";
    } catch {
      return "emerald";
    }
  });

  const nextMeeting = useMemo(() => {
    const now = new Date();

    return (
      agenda.confirmedMeetings
        .filter((meeting) => {
          const end = meetingDateTime(meeting, "hora_fin");
          return end && end >= now;
        })
        .sort((first, second) => {
          const firstStart = meetingDateTime(first)?.getTime() ?? Number.MAX_SAFE_INTEGER;
          const secondStart = meetingDateTime(second)?.getTime() ?? Number.MAX_SAFE_INTEGER;
          return firstStart - secondStart;
        })[0] || null
    );
  }, [agenda.confirmedMeetings]);

  const listedMeetings = useMemo(
    () =>
      agenda.confirmedMeetings.filter(
        (meeting) => !nextMeeting || String(meeting.id) !== String(nextMeeting.id),
      ),
    [agenda.confirmedMeetings, nextMeeting],
  );

  const visibleMeetings =
    view === "solicitudes"
      ? agenda.pendingInvitations
      : view === "enviadas"
        ? agenda.sentMeetings
        : listedMeetings;

  const requestedPage = Number.parseInt(urlState.page, 10);
  const currentPage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const totalPages = Math.max(1, Math.ceil(visibleMeetings.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedMeetings = visibleMeetings.slice(startIndex, startIndex + PAGE_SIZE);
  const startRow = visibleMeetings.length ? startIndex + 1 : 0;
  const endRow = Math.min(startIndex + PAGE_SIZE, visibleMeetings.length);
  const paginationLabel = view === "reuniones" ? "reuniones" : "solicitudes";

  function changeView(nextView) {
    writeFiltersToUrl({ view: nextView, page: 1 }, { replace: false });
  }

  function changePage(nextPage) {
    writeFiltersToUrl({ view, page: nextPage }, { replace: false });
  }

  function changeNextMeetingColor(color) {
    if (!NEXT_MEETING_THEMES[color]) return;

    setNextMeetingColor(color);
    try {
      window.localStorage.setItem(NEXT_MEETING_COLOR_KEY, color);
    } catch {
      // La preferencia seguirá activa durante la sesión aunque el navegador bloquee el almacenamiento.
    }
  }

  const options = [
    {
      id: "reuniones",
      label: "Mis reuniones",
      icon: CalendarCheck2,
      count: listedMeetings.length,
    },
    {
      id: "solicitudes",
      label: "Solicitudes",
      icon: UserCheck,
      count: agenda.pendingInvitations.length,
    },
    {
      id: "enviadas",
      label: "Enviadas",
      icon: Send,
      count: agenda.sentMeetings.length,
    },
    { id: "disponibilidad", label: "Disponibilidad", icon: UsersRound },
  ];

  return (
    <div className="module-page-enter space-y-5 pb-6">
      <button
        type="button"
        onClick={() => navigate("/agenda")}
        className="inline-flex items-center gap-2 self-start rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        Volver a agenda
      </button>

      <div className="module-section-enter flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            navigate("/agenda/reuniones/historial", { state: { listSearch: location.search } })
          }
          className="h-10 gap-2 rounded-xl border-slate-300 bg-white px-4 text-slate-700 shadow-none hover:bg-slate-100 hover:text-slate-900"
        >
          <History className="h-4 w-4" strokeWidth={1.8} />
          Historial de reuniones
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            navigate("/agenda/reuniones/metricas", { state: { listSearch: location.search } })
          }
          className="h-10 gap-2 rounded-xl border-blue-200 bg-white px-4 text-blue-700 shadow-none hover:bg-blue-50 hover:text-blue-800"
        >
          <BarChart3 className="h-4 w-4" strokeWidth={1.8} />
          Métricas
        </Button>
        <ManualButton to="/agenda/reuniones/manual" state={{ listSearch: location.search }} />
      </div>

      <NextMeetingCard
        color={nextMeetingColor}
        meeting={nextMeeting}
        loading={agenda.loading}
        saving={agenda.saving}
        onCancel={agenda.cancelMeeting}
        onColorChange={changeNextMeetingColor}
      />

      <div className="module-section-enter module-enter-delay-1 flex overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1">
        {options.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            type="button"
            onClick={() => changeView(id)}
            className={`flex min-w-fit flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all ${view === id ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Icon className={`h-4 w-4 ${view === id ? "text-emerald-600" : "text-slate-400"}`} />
            {label}
            {count > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] ${id === "solicitudes" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {agenda.error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          {agenda.error}
        </div>
      )}
      <FeedbackToast feedback={agenda.feedback} onClose={agenda.clearFeedback} />

      {agenda.loading ? (
        <AgendaLoading />
      ) : view === "disponibilidad" ? (
        <div className="module-section-enter">
          <DisponibilidadIntegrantes
            rows={agenda.people}
            initialSelectedIds={[profile?.cuenta_acceso_id || profile?.id]}
            lockedIds={[profile?.cuenta_acceso_id || profile?.id]}
            loadingPeople={agenda.peopleLoading}
            onSearchPeople={agenda.searchPeople}
            onCreateMeeting={(selection) => {
              setMeetingSelection(selection);
              setFormOpen(true);
            }}
          />
        </div>
      ) : (
        <div className="module-section-enter space-y-3">
          {visibleMeetings.length ? (
            paginatedMeetings.map((meeting) =>
              view === "solicitudes" || view === "enviadas" ? (
                <AgendaRequestCard
                  key={meeting.id}
                  meeting={meeting}
                  variant={view}
                  saving={agenda.saving}
                  onRespond={agenda.respondInvitation}
                  onCancel={agenda.cancelMeeting}
                />
              ) : (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  saving={agenda.saving}
                  onCancel={agenda.cancelMeeting}
                />
              ),
            )
          ) : (
            <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <div>
                <CalendarCheck2 className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-4 text-sm font-extrabold text-slate-700">
                  {view === "solicitudes"
                    ? "No tienes solicitudes pendientes"
                    : view === "enviadas"
                      ? "No tienes solicitudes enviadas pendientes"
                      : nextMeeting
                        ? "No tienes más reuniones confirmadas"
                        : "Todavía no tienes reuniones"}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  {view === "solicitudes"
                    ? "Las nuevas invitaciones aparecerán aquí."
                    : view === "enviadas"
                      ? "Las reuniones que organices aparecerán aquí hasta confirmarse."
                      : nextMeeting
                        ? "Tu reunión más próxima está destacada en la parte superior."
                        : "Ve a Disponibilidad, selecciona personas y elige un horario común."}
                </p>
              </div>
            </div>
          )}

          {visibleMeetings.length > 0 && (
            <TablePagination
              appearance="agenda"
              currentPage={safeCurrentPage}
              endRow={endRow}
              itemLabel={paginationLabel}
              onNext={() => changePage(Math.min(totalPages, safeCurrentPage + 1))}
              onPrevious={() => changePage(Math.max(1, safeCurrentPage - 1))}
              startRow={startRow}
              totalItems={visibleMeetings.length}
              totalPages={totalPages}
            />
          )}
        </div>
      )}

      {formOpen && meetingSelection && (
        <MeetingFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          availability={meetingSelection.availability}
          people={meetingSelection.people}
          currentAccountId={profile?.cuenta_acceso_id || profile?.id}
          saving={agenda.saving}
          onSubmit={agenda.createMeeting}
        />
      )}
    </div>
  );
}

export default Agenda;
