import {
  ArrowLeft,
  CalendarDays,
  History,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import FeedbackToast from "@/components/ui/FeedbackToast";
import ExcelIcon from "@/components/ui/ExcelIcon";
import TablePagination from "@/components/ui/TablePagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DAYS } from "@/constants/daysConstants";
import { useScheduleChangeHistory } from "@/hooks/useScheduleChangeHistory";
import useUrlSyncedFilters from "@/hooks/useUrlSyncedFilters";
import { downloadExcel } from "@/utils/excelExport";

const PAGE_SIZE = 6;
const FILTER_PARAM_MAP = {
  search: "q",
  status: "estado",
  period: "periodo",
  page: "pagina",
};
const FILTER_DEFAULTS = {
  search: "",
  status: "todos",
  period: "todos",
  page: "1",
};
const STATUS_STYLES = {
  PENDIENTE: "bg-amber-50 text-amber-700 ring-amber-100",
  APROBADA: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  RECHAZADA: "bg-red-50 text-red-700 ring-red-100",
  REQUIERE_CORRECCION: "bg-sky-50 text-sky-700 ring-sky-100",
  CANCELADA: "bg-slate-100 text-slate-600 ring-slate-200",
};
const STATUS_LABELS = {
  REQUIERE_CORRECCION: "Requiere correcciones",
};
const selectClass = `
  h-10 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white
  pr-8 pl-9 text-sm text-slate-700 transition-none outline-none hover:border-slate-200
  hover:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10
`;

function formatDate(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${String(value).slice(0, 10)}T00:00:00Z`));
}

function formatClock(value) {
  return String(value || "").slice(0, 5);
}

function RequestCard({ request }) {
  return (
    <article className="module-row-enter rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-slate-800">
              Cambio de horario #{request.id}
            </h2>
            <span
              className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase ring-1 ${STATUS_STYLES[request.estado] || STATUS_STYLES.CANCELADA}`}
            >
              {STATUS_LABELS[request.estado] || request.estado}
            </span>
          </div>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Solicitado el {formatDate(request.fecha_solicitud)}
          </p>
        </div>

        <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
          <CalendarDays className="h-4 w-4 text-emerald-600" />
          Vigente desde {formatDate(request.fecha_efectiva)}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(request.detalle || []).map((block, index) => (
          <span
            key={`${block.dia_semana}-${block.hora_inicio}-${index}`}
            className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600"
          >
            {DAYS[Number(block.dia_semana)] || "Día"} {formatClock(block.hora_inicio)}–
            {formatClock(block.hora_fin)}
          </span>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Motivo
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            {request.motivo || "Sin motivo registrado."}
          </p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Resolución
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            {request.observacion_resolucion ||
              (request.estado === "PENDIENTE" ? "Pendiente de revisión." : "Sin observación.")}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function SolicitarCambioHorario() {
  const navigate = useNavigate();
  const location = useLocation();
  const [feedback, setFeedback] = useState(() => location.state?.feedback || null);
  const { readInitialFilters, writeFiltersToUrl } = useUrlSyncedFilters({
    paramMap: FILTER_PARAM_MAP,
    defaults: FILTER_DEFAULTS,
  });
  const filters = readInitialFilters();
  const requestedPage = Number.parseInt(filters.page, 10);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const {
    items,
    pagination,
    creationEligibility,
    loading,
    error,
    exporting,
    loadAllForExport,
    clearError,
  } = useScheduleChangeHistory({
    search: filters.search,
    status: filters.status,
    period: filters.period,
    page,
    perPage: PAGE_SIZE,
  });
  const lastPage = Math.max(1, pagination?.last_page || 1);
  const currentPage = Math.min(page, lastPage);
  const hasFilters = Object.entries(FILTER_DEFAULTS).some(
    ([key, defaultValue]) => key !== "page" && filters[key] !== defaultValue,
  );

  useEffect(() => {
    if (!loading && pagination && page > lastPage) {
      writeFiltersToUrl({ ...filters, page: String(lastPage) }, { replace: true });
    }
  }, [filters, lastPage, loading, page, pagination, writeFiltersToUrl]);

  useEffect(() => {
    if (location.state?.feedback) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  function updateFilter(key, value, { replace = false } = {}) {
    writeFiltersToUrl({ ...filters, [key]: value, page: "1" }, { replace });
  }

  function clearFilters() {
    if (hasFilters) writeFiltersToUrl(FILTER_DEFAULTS, { replace: false });
  }

  function changePage(nextPage) {
    writeFiltersToUrl({ ...filters, page: String(nextPage) }, { replace: false });
  }

  async function handleDownloadExcel() {
    try {
      const requests = await loadAllForExport();

      await downloadExcel(
        {
          headers: [
            "Solicitud",
            "Fecha de solicitud",
            "Fecha efectiva",
            "Estado",
            "Motivo",
            "Horario propuesto",
            "Fecha de resolución",
            "Resolución",
          ],
          data: requests.map((request) => [
            request.id,
            formatDate(request.fecha_solicitud),
            formatDate(request.fecha_efectiva),
            request.estado,
            request.motivo || "",
            (request.detalle || [])
              .map(
                (block) =>
                  `${DAYS[Number(block.dia_semana)] || "Día"} ${formatClock(block.hora_inicio)}-${formatClock(block.hora_fin)}`,
              )
              .join(", "),
            formatDate(request.fecha_resolucion),
            request.observacion_resolucion || "",
          ]),
        },
        "historial_solicitudes_cambio_horario.xlsx",
      );
      setFeedback({
        type: "success",
        message: "Historial de solicitudes descargado correctamente.",
      });
    } catch (exportError) {
      setFeedback({
        type: "error",
        message: exportError?.message || "No se pudo descargar el historial.",
      });
    }
  }

  return (
    <div className="module-page-enter space-y-5 pb-8">
      <FeedbackToast
        feedback={error ? { type: "error", message: error } : feedback}
        onClose={() => {
          clearError();
          setFeedback(null);
        }}
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => navigate("/mi-horario")}
          className="inline-flex items-center gap-2 self-start rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
          Volver a mi horario
        </button>

        <Button
          type="button"
          variant="outline"
          onClick={handleDownloadExcel}
          disabled={loading || exporting || !pagination?.total}
          className="h-10 w-full shrink-0 gap-2 rounded-xl px-4 sm:w-auto"
        >
          <ExcelIcon className="h-4 w-4" />
          {exporting ? "Generando..." : "Descargar Excel"}
        </Button>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(280px,1.7fr)_minmax(220px,1fr)_minmax(220px,1fr)_auto] lg:items-center">
          <div className="relative w-full">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeWidth={1.8}
            />
            <Input
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value, { replace: true })}
              placeholder="Buscar por motivo o resolución..."
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
              <option value="PENDIENTE">Pendientes</option>
              <option value="APROBADA">Aprobadas</option>
              <option value="RECHAZADA">Rechazadas</option>
              <option value="REQUIERE_CORRECCION">Requieren correcciones</option>
              <option value="CANCELADA">Canceladas</option>
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
      </section>

      {!loading && !creationEligibility.canCreate && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <p className="font-semibold">
            {creationEligibility.reason === "pending"
              ? "Solicitud pendiente"
              : "Cambio de horario no disponible"}
          </p>
          <p className="mt-1 leading-5">
            {creationEligibility.message ||
              "No puedes enviar otra solicitud de cambio de horario por el momento."}
          </p>
        </section>
      )}

      {loading ? (
        <div className="grid min-h-72 place-items-center rounded-2xl border border-slate-200 bg-white">
          <RefreshCw className="h-7 w-7 animate-spin text-emerald-600" />
        </div>
      ) : items.length ? (
        <section className="space-y-3">
          {items.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
          <TablePagination
            appearance="agenda"
            currentPage={currentPage}
            endRow={pagination?.to || 0}
            itemLabel="solicitudes"
            onNext={() => changePage(Math.min(lastPage, currentPage + 1))}
            onPrevious={() => changePage(Math.max(1, currentPage - 1))}
            startRow={pagination?.from || 0}
            totalItems={pagination?.total || 0}
            totalPages={lastPage}
          />
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <History className="mx-auto h-9 w-9 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">
            No hay solicitudes que coincidan con los filtros.
          </p>
        </section>
      )}
    </div>
  );
}
