import {
  ArrowLeft,
  CalendarDays,
  CalendarClock,
  Clock3,
  History,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import ExcelIcon from "@/components/ui/ExcelIcon";
import { Input } from "@/components/ui/input";
import TablePagination from "@/components/ui/TablePagination";
import { useAgendaHistory } from "@/hooks/useAgendaHistory";
import useUrlSyncedFilters from "@/hooks/useUrlSyncedFilters";
import { downloadExcel } from "@/utils/excelExport";

const PAGE_SIZE = 6;
const HISTORY_REFERENCE_TIME = Date.now();
const DAY_IN_MILLISECONDS = 86_400_000;
const HISTORY_FILTER_PARAM_MAP = {
  search: "q",
  status: "estado",
  participation: "participacion",
  modality: "modalidad",
  period: "periodo",
  page: "pagina",
};
const HISTORY_FILTER_DEFAULTS = {
  search: "",
  status: "todos",
  participation: "todas",
  modality: "todas",
  period: "todos",
  page: "1",
};
const selectClass = `
  h-10 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white
  pr-8 pl-9 text-sm text-slate-700 transition-none outline-none hover:border-slate-200
  hover:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10
`;
const STATUS_STYLES = {
  confirmada: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  pendiente: "bg-amber-50 text-amber-700 ring-amber-100",
  rechazada: "bg-red-50 text-red-700 ring-red-100",
  cancelada: "bg-slate-100 text-slate-600 ring-slate-200",
};

function formatDate(value) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function HistoryCard({ meeting }) {
  const participants = meeting.participantes || [];

  return (
    <article className="module-row-enter rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-slate-800">{meeting.titulo}</h2>
            <span
              className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase ring-1 ${STATUS_STYLES[meeting.estado] || STATUS_STYLES.cancelada}`}
            >
              {meeting.estado}
            </span>
          </div>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {meeting.soy_organizador ? "Organizaste esta reunión" : "Participaste como invitado"}
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-500 capitalize">
          {formatDate(meeting.fecha)}
        </span>
      </div>

      {meeting.descripcion && (
        <p className="mt-3 border-l-2 border-slate-200 pl-3 text-xs leading-5 text-slate-500">
          {meeting.descripcion}
        </p>
      )}

      <div className="mt-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
        <span className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
          <CalendarClock className="h-4 w-4 text-emerald-600" /> {formatDate(meeting.fecha)}
        </span>
        <span className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
          <Clock3 className="h-4 w-4 text-emerald-600" />
          {String(meeting.hora_inicio).slice(0, 5)} – {String(meeting.hora_fin).slice(0, 5)}
        </span>
        <span className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 capitalize">
          <MapPin className="h-4 w-4 text-emerald-600" /> {meeting.modalidad}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <Users className="h-4 w-4 text-slate-400" />
        <span>{participants.length} participantes:</span>
        <span className="truncate font-semibold text-slate-700">
          {participants.map((person) => person.nombre).join(", ")}
        </span>
      </div>
    </article>
  );
}

export default function AgendaHistoryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { meetings, loading, error } = useAgendaHistory();
  const { readInitialFilters, writeFiltersToUrl } = useUrlSyncedFilters({
    paramMap: HISTORY_FILTER_PARAM_MAP,
    defaults: HISTORY_FILTER_DEFAULTS,
  });
  const filters = readInitialFilters();
  const listSearchRef = useRef(location.state?.listSearch || "");
  const returnToAgenda = () => navigate(`/agenda/reuniones${listSearchRef.current}`);
  const hasFilters = Object.entries(HISTORY_FILTER_DEFAULTS).some(
    ([key, defaultValue]) => key !== "page" && filters[key] !== defaultValue,
  );

  function updateFilter(key, value, { replace = false } = {}) {
    writeFiltersToUrl({ ...filters, [key]: value, page: "1" }, { replace });
  }

  function clearFilters() {
    if (!hasFilters) return;
    writeFiltersToUrl(HISTORY_FILTER_DEFAULTS, { replace: false });
  }

  const modalities = useMemo(
    () =>
      [...new Set(meetings.map((meeting) => meeting.modalidad).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    [meetings],
  );

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLocaleLowerCase("es");
    const cutoff =
      filters.period === "todos"
        ? null
        : HISTORY_REFERENCE_TIME - Number(filters.period) * DAY_IN_MILLISECONDS;

    return meetings.filter((meeting) => {
      const matchesStatus = filters.status === "todos" || meeting.estado === filters.status;
      const matchesParticipation =
        filters.participation === "todas" ||
        (filters.participation === "organizadas"
          ? meeting.soy_organizador
          : !meeting.soy_organizador);
      const matchesModality =
        filters.modality === "todas" || meeting.modalidad === filters.modality;
      const matchesPeriod =
        cutoff === null || new Date(`${meeting.fecha}T23:59:59`).getTime() >= cutoff;
      const matchesSearch =
        !term ||
        meeting.titulo.toLocaleLowerCase("es").includes(term) ||
        (meeting.participantes || []).some((person) =>
          person.nombre.toLocaleLowerCase("es").includes(term),
        );
      return (
        matchesStatus &&
        matchesParticipation &&
        matchesModality &&
        matchesPeriod &&
        matchesSearch
      );
    });
  }, [filters, meetings]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const requestedPage = Number.parseInt(filters.page, 10);
  const currentPage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const visible = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  function handleDownloadExcel() {
    downloadExcel(
      {
        headers: [
          "Reunion",
          "Descripcion",
          "Fecha",
          "Hora de inicio",
          "Hora de fin",
          "Estado",
          "Participacion",
          "Modalidad",
          "Ubicacion",
          "Enlace",
          "Participantes",
        ],
        data: filtered.map((meeting) => [
          meeting.titulo,
          meeting.descripcion || "",
          formatDate(meeting.fecha),
          String(meeting.hora_inicio).slice(0, 5),
          String(meeting.hora_fin).slice(0, 5),
          meeting.estado,
          meeting.soy_organizador ? "Organizador" : "Invitado",
          meeting.modalidad,
          meeting.ubicacion || "",
          meeting.enlace || "",
          (meeting.participantes || []).map((person) => person.nombre).join(", "),
        ]),
      },
      "historial_reuniones.xlsx",
    );
  }

  return (
    <div className="module-page-enter space-y-5 pb-8">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={returnToAgenda}
          className="inline-flex items-center gap-2 self-start rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
          Volver a agenda
        </button>

        <Button
          type="button"
          variant="outline"
          onClick={handleDownloadExcel}
          disabled={loading || !filtered.length}
          className="h-10 w-full shrink-0 gap-2 rounded-xl px-4 sm:w-auto"
        >
          <ExcelIcon className="h-4 w-4" />
          Descargar Excel
        </Button>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(280px,1.7fr)_minmax(220px,1fr)_minmax(220px,1fr)] lg:items-center">
            <div className="relative w-full">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
                strokeWidth={1.8}
              />
              <Input
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value, { replace: true })}
                placeholder="Buscar por reunión o participante..."
                className="h-10 w-full rounded-xl border-slate-200 bg-slate-50/60 pl-9 text-sm shadow-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>

            <div className="relative w-full">
              <SlidersHorizontal
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
                strokeWidth={1.8}
              />
              <select
                aria-label="Filtrar por estado"
                value={filters.status}
                onChange={(event) => updateFilter("status", event.target.value)}
                className={selectClass}
              >
                <option value="todos">Selecciona un estado</option>
                <option value="confirmada">Confirmadas</option>
                <option value="cancelada">Canceladas</option>
                <option value="rechazada">Rechazadas</option>
                <option value="pendiente">Pendientes vencidas</option>
              </select>
            </div>

            <div className="relative w-full">
              <SlidersHorizontal
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
                strokeWidth={1.8}
              />
              <select
                aria-label="Filtrar por participación"
                value={filters.participation}
                onChange={(event) => updateFilter("participation", event.target.value)}
                className={selectClass}
              >
                <option value="todas">Selecciona una participación</option>
                <option value="organizadas">Organizadas por mí</option>
                <option value="invitado">Como invitado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_auto] lg:items-center">
            <div className="relative w-full">
              <SlidersHorizontal
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
                strokeWidth={1.8}
              />
              <select
                aria-label="Filtrar por modalidad"
                value={filters.modality}
                onChange={(event) => updateFilter("modality", event.target.value)}
                className={`${selectClass} capitalize`}
              >
                <option value="todas">Selecciona una modalidad</option>
                {modalities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full">
              <CalendarDays
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
                strokeWidth={1.8}
              />
              <select
                aria-label="Filtrar por periodo"
                value={filters.period}
                onChange={(event) => updateFilter("period", event.target.value)}
                className={selectClass}
              >
                <option value="todos">Selecciona un periodo</option>
                <option value="30">Últimos 30 días</option>
                <option value="90">Últimos 90 días</option>
                <option value="365">Último año</option>
              </select>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              disabled={!hasFilters}
              className={`h-10 w-full gap-2 rounded-xl px-4 text-sm font-medium shadow-none transition-none lg:w-auto ${
                hasFilters
                  ? "border-red-200 bg-white text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
              }`}
            >
              <X className="h-4 w-4" strokeWidth={1.8} />
              Limpiar filtros
            </Button>
          </div>
        </div>
      </section>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="grid min-h-72 place-items-center rounded-2xl border border-slate-200 bg-white">
          <RefreshCw className="h-7 w-7 animate-spin text-emerald-600" />
        </div>
      ) : visible.length ? (
        <section className="space-y-3">
          {visible.map((meeting) => (
            <HistoryCard key={meeting.id} meeting={meeting} />
          ))}
          <TablePagination
            appearance="agenda"
            currentPage={safePage}
            endRow={Math.min(startIndex + PAGE_SIZE, filtered.length)}
            itemLabel="reuniones"
            onNext={() =>
              writeFiltersToUrl(
                { ...filters, page: String(Math.min(totalPages, safePage + 1)) },
                { replace: false },
              )
            }
            onPrevious={() =>
              writeFiltersToUrl(
                { ...filters, page: String(Math.max(1, safePage - 1)) },
                { replace: false },
              )
            }
            startRow={filtered.length ? startIndex + 1 : 0}
            totalItems={filtered.length}
            totalPages={totalPages}
          />
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <History className="mx-auto h-9 w-9 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">
            No hay reuniones que coincidan con los filtros.
          </p>
        </section>
      )}
    </div>
  );
}
