import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  Clock3,
  History,
  LoaderCircle,
  MessageSquareWarning,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useLocation } from "react-router-dom";

import TablePagination from "@/components/ui/TablePagination";
import { Table } from "@/components/ui/table";
import ExcelIcon from "@/components/ui/ExcelIcon";
import FeedbackToast from "@/components/ui/FeedbackToast";
import ManualButton from "@/components/ui/ManualButton";
import { ActionButton } from "@/components/ui/action-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import EnlargeablePhoto from "@/components/ui/enlargeable-photo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { DAYS } from "@/constants/daysConstants";
import { useAuth } from "@/contexts/AuthContext";
import useUrlSyncedFilters from "@/hooks/useUrlSyncedFilters";
import {
  getSolicitudesCambioHorario,
  resolverSolicitudCambioHorario,
} from "@/services/solicitudes-cambio-horario/solicitudesCambioHorarioService";
import { getAvatarUrl } from "@/utils/avatar";
import { downloadExcel, formatExcelDate } from "@/utils/excelExport";
import { getInitials } from "@/utils/formatters";
import { hasAnyPermission, hasPermission, PERMISSIONS } from "@/utils/permissions";

const PAGE_SIZE = 8;
const FILTER_PARAM_MAP = {
  search: "q",
  status: "estado",
  period: "periodo",
  area: "area",
  cargo: "cargo",
  page: "pagina",
};
const FILTER_DEFAULTS = {
  search: "",
  status: "todos",
  period: "todos",
  area: "todas",
  cargo: "todos",
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
  disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400
  disabled:hover:border-slate-200
`;

function formatDate(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${String(value).slice(0, 10)}T00:00:00Z`));
}

function formatClock(value) {
  return String(value || "").slice(0, 5);
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-extrabold tracking-wide uppercase ring-1 ${STATUS_STYLES[status] || STATUS_STYLES.CANCELADA}`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function MemberIdentity({ item }) {
  const member = item.integrante;
  const name = member?.nombre || "Integrante";
  const avatarUrl = getAvatarUrl(member?.avatar_url) || getAvatarUrl(member?.avatar_path);

  return (
    <div className="flex min-w-0 items-center gap-3">
      {avatarUrl ? (
        <EnlargeablePhoto
          src={avatarUrl}
          fallbackSrc={getAvatarUrl(member?.avatar_path)}
          alt={`Foto de ${name}`}
          className="h-10 w-10 rounded-xl ring-1 ring-emerald-100"
        />
      ) : (
        <Avatar className="h-10 w-10 shrink-0 rounded-xl ring-1 ring-emerald-100">
          <AvatarFallback className="rounded-xl bg-emerald-50 text-xs font-bold text-emerald-700">
            {getInitials(name) || "?"}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-800">{name}</p>
        <p className="mt-1 truncate text-xs text-slate-500">
          {item.historial_anterior?.area || "Sin área"}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-slate-400">
          {item.historial_anterior?.cargo || "Sin cargo"}
        </p>
      </div>
    </div>
  );
}

function ScheduleBlocks({ blocks = [] }) {
  if (!blocks.length) {
    return <span className="text-xs text-slate-400">Sin bloques registrados</span>;
  }

  return (
    <div className="flex max-w-md flex-wrap gap-1.5">
      {blocks.map((block, index) => (
        <span
          key={`${block.dia_semana}-${block.hora_inicio}-${index}`}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-600"
        >
          <Clock3 className="h-3 w-3 text-emerald-600" strokeWidth={1.8} />
          {DAYS[Number(block.dia_semana)] || "Día"} {formatClock(block.hora_inicio)}–
          {formatClock(block.hora_fin)}
        </span>
      ))}
    </div>
  );
}

function RequestActions({ busy, item, onApprove, onCorrections, onReject }) {
  if (item.estado !== "PENDIENTE") return null;

  const processing = busy === item.id;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={Boolean(busy)}
          aria-label={`Acciones para ${item.integrante?.nombre || "integrante"}`}
          className="h-8 w-8 rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" strokeWidth={2} />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-45 rounded-xl border-slate-200 bg-white p-1.5 shadow-[0_12px_35px_rgba(15,23,42,0.16)]">
        <DropdownMenuItem onSelect={() => onApprove(item)} className="h-9 cursor-pointer rounded-lg px-3 text-xs font-medium text-slate-600 focus:bg-emerald-50 focus:text-emerald-700">
          <Check className="h-3.5 w-3.5" strokeWidth={1.8} />
          Aprobar
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onReject(item)} className="h-9 cursor-pointer rounded-lg px-3 text-xs font-medium text-slate-500 focus:bg-red-50 focus:text-red-700">
          <X className="h-3.5 w-3.5" strokeWidth={1.8} />
          Rechazar
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onCorrections(item)} className="h-9 cursor-pointer rounded-lg px-3 text-xs font-medium text-slate-500 focus:bg-sky-50 focus:text-sky-700">
          <MessageSquareWarning className="h-3.5 w-3.5" strokeWidth={1.8} />
          Solicitar correcciones
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ApproveDialog({ busy, item, onCancel, onConfirm }) {
  const processing = busy === item?.id;

  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && !processing && onCancel()}>
      <DialogContent showCloseButton={!processing} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar aprobación</DialogTitle>
          <DialogDescription className="leading-6">
            ¿Está seguro de aprobar el cambio de horario de <span className="font-semibold text-slate-700">{item?.integrante?.nombre || "este integrante"}</span>?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={processing} onClick={onCancel}>Cancelar</Button>
          <ActionButton action="confirm" type="button" loading={processing} loadingText="Aprobando..." onClick={onConfirm}>
            Sí, aprobar
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({ busy, item, reason, onCancel, onChange, onConfirm }) {
  const processing = busy === item?.id;

  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && !processing && onCancel()}>
      <DialogContent disableAutoFocus={false} showCloseButton={!processing} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rechazar solicitud</DialogTitle>
          <DialogDescription>
            Indica el motivo por el que se rechaza el cambio de horario de <span className="font-semibold text-slate-700">{item?.integrante?.nombre || "este integrante"}</span>.
          </DialogDescription>
        </DialogHeader>
        <div>
          <label htmlFor="reject-reason" className="text-sm font-semibold text-slate-700">Motivo del rechazo</label>
          <textarea
            id="reject-reason"
            value={reason}
            onChange={(event) => onChange(event.target.value)}
            autoFocus
            disabled={processing}
            className="mt-2 min-h-28 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-red-300 focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            placeholder="Escribe el motivo del rechazo (obligatorio)"
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={processing} onClick={onCancel}>Cancelar</Button>
          <ActionButton action="confirm" tone="danger" type="button" loading={processing} loadingText="Rechazando..." disabled={!reason.trim()} onClick={onConfirm}>
            Confirmar rechazo
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CorrectionsDialog({ busy, item, reason, onCancel, onChange, onConfirm }) {
  const processing = busy === item?.id;

  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && !processing && onCancel()}>
      <DialogContent disableAutoFocus={false} showCloseButton={!processing} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitar correcciones</DialogTitle>
          <DialogDescription>
            Indica qué debe corregir {item?.integrante?.nombre || "el integrante"} antes de enviar una nueva solicitud.
          </DialogDescription>
        </DialogHeader>
        <div>
          <label htmlFor="corrections-reason" className="text-sm font-semibold text-slate-700">Observación</label>
          <textarea
            id="corrections-reason"
            value={reason}
            onChange={(event) => onChange(event.target.value)}
            autoFocus
            disabled={processing}
            className="mt-2 min-h-28 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            placeholder="Describe las correcciones necesarias (obligatorio)"
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={processing} onClick={onCancel}>Cancelar</Button>
          <ActionButton action="send" type="button" loading={processing} loadingText="Enviando..." disabled={!reason.trim()} onClick={onConfirm}>
            Solicitar correcciones
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SolicitudesCambioHorario() {
  const { profile } = useAuth();
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(null);
  const [approveItem, setApproveItem] = useState(null);
  const [rejectItem, setRejectItem] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [correctionsItem, setCorrectionsItem] = useState(null);
  const [correctionsReason, setCorrectionsReason] = useState("");
  const canManage = hasAnyPermission(profile, [
    PERMISSIONS.SOLICITUDES_HORARIO_VER,
    PERMISSIONS.VOLUNTARIOS_GESTIONAR_HORARIO,
  ]);
  const canDownloadExcel = hasPermission(
    profile,
    PERMISSIONS.SOLICITUDES_HORARIO_DESCARGAR_EXCEL,
  );
  const { readInitialFilters, writeFiltersToUrl } = useUrlSyncedFilters({
    paramMap: FILTER_PARAM_MAP,
    defaults: FILTER_DEFAULTS,
  });
  const filters = readInitialFilters();
  const requestedPage = Number.parseInt(filters.page, 10);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      setItems(await getSolicitudesCambioHorario());
    } catch (loadError) {
      setError(loadError?.message || "No se pudieron cargar las solicitudes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    getSolicitudesCambioHorario()
      .then((data) => {
        if (active) setItems(data);
      })
      .catch((loadError) => {
        if (active) setError(loadError?.message || "No se pudieron cargar las solicitudes.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const areaOptions = useMemo(
    () => Array.from(new Map(items
      .filter((item) => item.historial_anterior?.area_id)
      .map((item) => [String(item.historial_anterior.area_id), {
        id: item.historial_anterior.area_id,
        nombre: item.historial_anterior.area,
      }])).values()).sort(
        (first, second) =>
          String(first.nombre || "").localeCompare(String(second.nombre || ""), "es"),
      ),
    [items],
  );

  const cargoOptions = useMemo(() => {
    if (filters.area === "todas") return [];

    return Array.from(new Map(items
      .filter((item) => String(item.historial_anterior?.area_id) === filters.area)
      .map((item) => [String(item.historial_anterior?.cargo_id), {
        id: item.historial_anterior?.cargo_id,
        nombre: item.historial_anterior?.cargo,
      }])).values())
      .sort((first, second) =>
        String(first.nombre || "").localeCompare(String(second.nombre || ""), "es"),
      );
  }, [filters.area, items]);

  const filteredItems = useMemo(() => {
    const term = filters.search.trim().toLocaleLowerCase("es-PE");
    const periodDays = filters.period === "todos" ? null : Number(filters.period);
    const periodStart = periodDays ? new Date() : null;
    if (periodStart) {
      periodStart.setDate(periodStart.getDate() - periodDays);
      periodStart.setHours(0, 0, 0, 0);
    }

    return items.filter((item) => {
      const matchesStatus = filters.status === "todos" || item.estado === filters.status;
      const matchesArea =
        filters.area === "todas" || String(item.historial_anterior?.area_id) === filters.area;
      const matchesCargo =
        filters.cargo === "todos" || String(item.historial_anterior?.cargo_id) === filters.cargo;
      const matchesSearch =
        !term ||
        String(item.integrante?.nombre || "")
          .toLocaleLowerCase("es-PE")
          .includes(term);
      const requestDate = item.fecha_solicitud ? new Date(item.fecha_solicitud) : null;
      const matchesPeriod = !periodStart || (requestDate && requestDate >= periodStart);

      return matchesStatus && matchesArea && matchesCargo && matchesSearch && matchesPeriod;
    });
  }, [filters.area, filters.cargo, filters.period, filters.search, filters.status, items]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleItems = filteredItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const startRow = filteredItems.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const endRow = Math.min(currentPage * PAGE_SIZE, filteredItems.length);
  const hasFilters = Object.entries(FILTER_DEFAULTS).some(
    ([key, defaultValue]) => key !== "page" && filters[key] !== defaultValue,
  );

  useEffect(() => {
    if (!loading && page > totalPages) {
      writeFiltersToUrl({ ...filters, page: String(totalPages) }, { replace: true });
    }
  }, [filters, loading, page, totalPages, writeFiltersToUrl]);

  function updateFilter(key, value, { replace = false } = {}) {
    writeFiltersToUrl({ ...filters, [key]: value, page: "1" }, { replace });
  }

  function updateAreaFilter(area) {
    writeFiltersToUrl(
      {
        ...filters,
        area,
        cargo: "todos",
        page: "1",
      },
      { replace: false },
    );
  }

  function clearFilters() {
    if (hasFilters) writeFiltersToUrl(FILTER_DEFAULTS, { replace: false });
  }

  function changePage(nextPage) {
    writeFiltersToUrl({ ...filters, page: String(nextPage) }, { replace: false });
  }

  async function handleDownloadExcel() {
    setError("");
    setFeedback(null);
    try {
      await downloadExcel(
        {
          headers: [
            "Solicitud",
            "Integrante",
            "Área",
            "Cargo",
            "Fecha de solicitud",
            "Fecha efectiva",
            "Estado",
            "Motivo",
            "Horario propuesto",
            "Fecha de resolución",
            "Resolución",
          ],
          data: filteredItems.map((item) => [
            item.id,
            item.integrante?.nombre || "",
            item.historial_anterior?.area || "",
            item.historial_anterior?.cargo || "",
            formatExcelDate(item.fecha_solicitud),
            formatExcelDate(item.fecha_efectiva),
            item.estado,
            item.motivo || "",
            (item.detalle || [])
              .map(
                (block) =>
                  `${DAYS[Number(block.dia_semana)] || "Día"} ${formatClock(block.hora_inicio)}-${formatClock(block.hora_fin)}`,
              )
              .join(", "),
            formatExcelDate(item.fecha_resolucion),
            item.observacion_resolucion || "",
          ]),
        },
        "solicitudes_cambio_horario.xlsx",
      );
      setFeedback({
        type: "success",
        message: "Solicitudes de horario descargadas correctamente.",
      });
    } catch {
      setError("No se pudo generar el archivo Excel.");
    }
  }

  function openReject(item) {
    setRejectItem(item);
    setRejectReason("");
  }

  function openApprove(item) {
    setApproveItem(item);
  }

  function openCorrections(item) {
    setCorrectionsItem(item);
    setCorrectionsReason("");
  }

  function closeApprove() {
    if (busy) return;
    setApproveItem(null);
  }

  function closeReject() {
    if (busy) return;
    setRejectItem(null);
    setRejectReason("");
  }

  function closeCorrections() {
    if (busy) return;
    setCorrectionsItem(null);
    setCorrectionsReason("");
  }

  async function approve() {
    if (!approveItem) return;
    setBusy(approveItem.id);
    setError("");
    setFeedback(null);

    try {
      await resolverSolicitudCambioHorario(approveItem.id, "APROBADA", "");
      setApproveItem(null);
      setFeedback({ type: "success", message: "Solicitud de horario aprobada correctamente." });
      await load();
    } catch (cause) {
      setError(cause?.message || "No se pudo aprobar la solicitud.");
    } finally {
      setBusy(null);
    }
  }

  async function reject() {
    if (!rejectItem || !rejectReason.trim()) return;
    setBusy(rejectItem.id);
    setError("");
    setFeedback(null);

    try {
      await resolverSolicitudCambioHorario(rejectItem.id, "RECHAZADA", rejectReason.trim());
      setRejectItem(null);
      setRejectReason("");
      setFeedback({ type: "success", message: "Solicitud de horario rechazada correctamente." });
      await load();
    } catch (cause) {
      setError(cause?.message || "No se pudo rechazar la solicitud.");
    } finally {
      setBusy(null);
    }
  }

  async function requestCorrections() {
    if (!correctionsItem || !correctionsReason.trim()) return;
    setBusy(correctionsItem.id);
    setError("");
    setFeedback(null);

    try {
      await resolverSolicitudCambioHorario(
        correctionsItem.id,
        "REQUIERE_CORRECCION",
        correctionsReason.trim(),
      );
      setCorrectionsItem(null);
      setCorrectionsReason("");
      setFeedback({ type: "success", message: "Se solicitaron correcciones al integrante." });
      await load();
    } catch (cause) {
      setError(cause?.message || "No se pudieron solicitar las correcciones.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="module-page-enter space-y-5 pb-8">
      <FeedbackToast
        feedback={error ? { type: "error", message: error } : feedback}
        onClose={() => {
          setError("");
          setFeedback(null);
        }}
      />
      <div className="flex flex-col justify-end gap-2 sm:flex-row">
        {canDownloadExcel && (
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadExcel}
            disabled={loading || !filteredItems.length}
            className="h-10 w-full gap-2 rounded-xl border-slate-200 bg-white px-4 text-slate-700 shadow-none hover:bg-slate-50 sm:w-auto"
          >
            <ExcelIcon className="h-4 w-4" />
            Descargar Excel
          </Button>
        )}
        <ManualButton
          to="/solicitudes-cambio-horario/manual"
          state={{ listSearch: location.search }}
          className="w-full sm:w-auto"
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 lg:items-center">
          <div className="relative w-full lg:col-span-2">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeWidth={1.8}
            />
            <Input
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value, { replace: true })}
              placeholder="Buscar por integrante..."
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

          <div className="relative w-full">
            <Building2
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeWidth={1.8}
            />
            <select
              aria-label="Filtrar por área"
              value={filters.area}
              onChange={(event) => updateAreaFilter(event.target.value)}
              className={selectClass}
            >
              <option value="todas">Selecciona un área</option>
              {areaOptions.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full">
            <BriefcaseBusiness
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeWidth={1.8}
            />
            <select
              aria-label="Filtrar por cargo"
              value={filters.cargo}
              onChange={(event) => updateFilter("cargo", event.target.value)}
              disabled={filters.area === "todas"}
              className={selectClass}
            >
              <option value="todos">
                {filters.area === "todas"
                  ? "Selecciona un área primero"
                  : "Selecciona un cargo"}
              </option>
              {cargoOptions.map((cargo) => (
                <option key={cargo.id} value={cargo.id}>
                  {cargo.nombre}
                </option>
              ))}
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

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        {loading ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
            <p className="text-sm font-medium text-slate-700">Cargando solicitudes...</p>
          </div>
        ) : visibleItems.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <Table className="w-full min-w-[980px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-5 py-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Integrante</th>
                    <th className="px-4 py-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Solicitud</th>
                    <th className="px-4 py-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Horario propuesto</th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold tracking-wider text-slate-500 uppercase">Estado</th>
                    <th className="px-5 py-3 text-center text-[10px] font-bold tracking-wider text-slate-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleItems.map((item) => (
                    <RequestTableRows
                      key={item.id}
                      busy={busy}
                      item={item}
                      onApprove={openApprove}
                      onCorrections={openCorrections}
                      onOpenReject={openReject}
                      canManage={canManage}
                    />
                  ))}
                </tbody>
              </Table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {visibleItems.map((item) => (
                <RequestCard
                  key={item.id}
                  busy={busy}
                  item={item}
                  onApprove={openApprove}
                  onCorrections={openCorrections}
                  onOpenReject={openReject}
                  canManage={canManage}
                />
              ))}
            </div>

            <TablePagination
              currentPage={currentPage}
              endRow={endRow}
              itemLabel="solicitudes"
              onNext={() => changePage(Math.min(totalPages, currentPage + 1))}
              onPrevious={() => changePage(Math.max(1, currentPage - 1))}
              startRow={startRow}
              totalItems={filteredItems.length}
              totalPages={totalPages}
            />
          </>
        ) : (
          <div className="px-5 py-14 text-center">
            <History className="mx-auto h-9 w-9 text-slate-300" strokeWidth={1.6} />
            <p className="mt-3 text-sm font-semibold text-slate-700">No hay solicitudes que coincidan con los filtros.</p>
            <p className="mt-1 text-xs text-slate-400">Ajusta los criterios de búsqueda o limpia los filtros para ver más resultados.</p>
          </div>
        )}
      </section>

      <ApproveDialog busy={busy} item={approveItem} onCancel={closeApprove} onConfirm={approve} />
      <RejectDialog busy={busy} item={rejectItem} reason={rejectReason} onCancel={closeReject} onChange={setRejectReason} onConfirm={reject} />
      <CorrectionsDialog busy={busy} item={correctionsItem} reason={correctionsReason} onCancel={closeCorrections} onChange={setCorrectionsReason} onConfirm={requestCorrections} />
    </div>
  );
}

function RequestTableRows({ busy, canManage, item, onApprove, onCorrections, onOpenReject }) {
  return (
    <tr className="align-top transition-colors hover:bg-slate-50/60">
        <td className="px-5 py-4">
          <MemberIdentity item={item} />
        </td>
        <td className="px-4 py-4">
          <p className="text-xs font-semibold text-slate-700">Solicitud #{item.id}</p>
          <p className="mt-1 text-[11px] text-slate-500">Enviada: {formatDate(item.fecha_solicitud)}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">Efectiva: {formatDate(item.fecha_efectiva)}</p>
          <p className="mx-auto mt-2 max-w-xs text-center text-xs leading-5 text-slate-500">{item.motivo || "Sin motivo registrado."}</p>
        </td>
        <td className="px-4 py-4"><ScheduleBlocks blocks={item.detalle} /></td>
        <td className="px-4 py-4 text-center">
          <StatusBadge status={item.estado} />
          {item.observacion_resolucion && (
            <p className="mx-auto mt-2 max-w-48 text-center text-[11px] leading-4 text-slate-500">{item.observacion_resolucion}</p>
          )}
        </td>
        <td className="px-5 py-4 text-center">
          {canManage && <RequestActions busy={busy} item={item} onApprove={onApprove} onCorrections={onCorrections} onReject={onOpenReject} />}
        </td>
      </tr>
  );
}

function RequestCard({ busy, canManage, item, onApprove, onCorrections, onOpenReject }) {
  return (
    <article className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <MemberIdentity item={item} />
        <StatusBadge status={item.estado} />
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs">
        <div>
          <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">Solicitud</p>
          <p className="mt-1 font-semibold text-slate-700">#{item.id} · {formatDate(item.fecha_solicitud)}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">Fecha efectiva</p>
          <p className="mt-1 font-semibold text-slate-700">{formatDate(item.fecha_efectiva)}</p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-[9px] font-bold tracking-wider text-slate-400 uppercase">Horario propuesto</p>
        <ScheduleBlocks blocks={item.detalle} />
      </div>

      <div className="text-xs leading-5 text-slate-500">
        <span className="font-semibold text-slate-700">Motivo: </span>
        {item.motivo || "Sin motivo registrado."}
      </div>

      {item.observacion_resolucion && (
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs leading-5 text-slate-500">
          <span className="font-semibold text-slate-700">Resolución: </span>
          {item.observacion_resolucion}
        </div>
      )}

      {canManage && <div className="flex justify-end"><RequestActions busy={busy} item={item} onApprove={onApprove} onCorrections={onCorrections} onReject={onOpenReject} /></div>}
    </article>
  );
}
