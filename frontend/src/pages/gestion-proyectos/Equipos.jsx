import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  CheckCircle2,
  Clock3,
  Crown,
  History,
  Pencil,
  Power,
  Plus,
  RotateCcw,
  UserMinus,
  UserPlus,
  UserRound,
  UsersRound,
} from "lucide-react";
import FeedbackToast from "@/components/ui/FeedbackToast";
import ManualButton from "@/components/ui/ManualButton";
import ExcelIcon from "@/components/ui/ExcelIcon";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import EnlargeablePhoto from "@/components/ui/enlargeable-photo";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import useEquipos from "@/hooks/gestion-proyectos/useEquipos";
import { useAuth } from "@/contexts/AuthContext";
import { prefetchEquipoMetrics } from "@/services/gestion-proyectos/equiposMetricsData";
import { getAvatarUrl } from "@/utils/avatar";
import { downloadExcel } from "@/utils/excelExport";
import { hasPermission, PERMISSIONS } from "@/utils/permissions";

const DAYS = { 1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb" };

function minutesOfDay(time = "00:00") {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours * 60) + minutes;
}

function sharedMinutes(first = [], second = []) {
  return first.reduce((total, firstBlock) => total + second.reduce((subtotal, secondBlock) => {
    if (firstBlock.dia_semana !== secondBlock.dia_semana) return subtotal;
    const start = Math.max(minutesOfDay(firstBlock.hora_inicio), minutesOfDay(secondBlock.hora_inicio));
    const end = Math.min(minutesOfDay(firstBlock.hora_fin), minutesOfDay(secondBlock.hora_fin));
    return subtotal + Math.max(0, end - start);
  }, 0), 0);
}

function scheduleSummary(schedule = []) {
  if (!schedule.length) return "Sin horario registrado";
  const days = [...new Set(schedule.map((block) => DAYS[block.dia_semana]))].join(", ");
  return `${days} · ${schedule.length} ${schedule.length === 1 ? "bloque" : "bloques"}`;
}

function isTeamCompatible(team) {
  return team.integrantes.every((member) => sharedMinutes(team.lider?.horarios, member.horarios) > 0);
}

function getExcelRows(teams) {
  return {
    headers: [
      "ID",
      "Equipo",
      "Área",
      "Líder",
      "Correo del líder",
      "Cargo del líder",
      "Integrantes adicionales",
      "Total de personas",
      "Integrantes",
      "Correos de integrantes",
      "Compatibilidad horaria",
      "Estado",
    ],
    data: teams.map((team) => [
      team.id,
      team.nombre,
      team.area?.nombre || "",
      team.lider?.nombre || "",
      team.lider?.correo || "",
      team.lider?.cargo || "",
      team.integrantes.length,
      team.integrantes_total,
      team.integrantes.map((member) => member.nombre).join(", "),
      team.integrantes.map((member) => member.correo).filter(Boolean).join(", "),
      isTeamCompatible(team) ? "Compatible" : "Revisar horarios",
      team.activo ? "Activo" : "Inactivo",
    ]),
  };
}

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";
}

function MemberAvatar({ member, className, fallbackClassName, expandable = true }) {
  const avatarUrl = getAvatarUrl(member?.avatar_url) || getAvatarUrl(member?.avatar_path);

  if (avatarUrl) {
    return (
      <EnlargeablePhoto
        src={avatarUrl}
        fallbackSrc={getAvatarUrl(member?.avatar_path)}
        alt={`Foto de ${member?.nombre || "integrante"}`}
        className={className}
        interactive={expandable}
      />
    );
  }

  return (
    <Avatar className={className}>
      <AvatarFallback className={fallbackClassName}>{initials(member?.nombre)}</AvatarFallback>
    </Avatar>
  );
}

function historyDescription(event) {
  const roles = { lider: "líder", integrante: "integrante" };
  if (event.accion === "cambio_rol") {
    return `Cambió de ${roles[event.rol_anterior] || event.rol_anterior} a ${roles[event.rol_nuevo] || event.rol_nuevo}.`;
  }
  if (event.accion === "retirado") {
    return `Fue retirado como ${roles[event.rol_anterior] || event.rol_anterior}.`;
  }
  return `Fue asignado como ${roles[event.rol_nuevo] || event.rol_nuevo}.`;
}

function historyDate(value) {
  if (!value) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function Equipos() {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const canCreate = hasPermission(profile, PERMISSIONS.GP_EQUIPOS_CREAR);
  const canEdit = hasPermission(profile, PERMISSIONS.GP_EQUIPOS_EDITAR);
  const canViewMetrics = hasPermission(profile, PERMISSIONS.GP_EQUIPOS_VER_METRICAS);
  const canDownloadExcel = hasPermission(profile, PERMISSIONS.GP_EQUIPOS_DESCARGAR_EXCEL);
  const {
    equipos,
    loading,
    error,
    updatingStatusId,
    setActive,
    loadHistory,
  } = useEquipos({ includeCandidates: false });
  const [feedback, setFeedback] = useState(location.state?.feedback || null);
  const [exporting, setExporting] = useState(false);
  const [statusTeam, setStatusTeam] = useState(null);
  const [historyTeam, setHistoryTeam] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    if (!canViewMetrics) return;
    const cacheScope = profile?.cuenta_acceso_id || profile?.id || "default";
    void prefetchEquipoMetrics(cacheScope).catch(() => {
      // La pantalla de equipos permanece operativa si la precarga de métricas falla.
    });
  }, [canViewMetrics, profile?.cuenta_acceso_id, profile?.id]);

  async function exportTeams() {
    if (exporting || loading || equipos.length === 0) return;

    setExporting(true);
    try {
      await downloadExcel(getExcelRows(equipos), "equipos.xlsx");
    } finally {
      setExporting(false);
    }
  }

  async function confirmStatusChange() {
    if (!statusTeam) return;
    const nextActive = !statusTeam.activo;
    try {
      await setActive(statusTeam.id, nextActive);
      setFeedback({
        type: "success",
        message: `Equipo ${nextActive ? "activado" : "desactivado"} correctamente.`,
      });
      setStatusTeam(null);
    } catch (requestError) {
      setFeedback({
        type: "error",
        message: requestError.message || "No se pudo cambiar el estado del equipo.",
      });
    }
  }

  async function openHistory(team) {
    setHistoryTeam(team);
    setHistory([]);
    setHistoryError("");
    setHistoryLoading(true);
    try {
      setHistory(await loadHistory(team.id));
    } catch (requestError) {
      setHistoryError(requestError.message || "No se pudo cargar el historial.");
    } finally {
      setHistoryLoading(false);
    }
  }

  return (
    <div className="module-page-enter mx-auto max-w-7xl space-y-6 pb-10">
      <FeedbackToast feedback={feedback} onClose={() => setFeedback(null)} />

      <div className="flex flex-wrap justify-end gap-2">
        <ManualButton
          to="/gestion-proyectos/detecta/equipos/manual"
          state={{ listSearch: location.search }}
        />
        {canViewMetrics && (
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/gestion-proyectos/detecta/equipos/metricas")}
            className="h-10 gap-2 rounded-xl border-blue-200 bg-white px-4 text-blue-700 shadow-none hover:bg-blue-50 hover:text-blue-800"
          >
            <BarChart3 className="h-4 w-4" strokeWidth={1.8} /> Métricas
          </Button>
        )}
        {canDownloadExcel && (
          <Button
            type="button"
            variant="outline"
            onClick={exportTeams}
            disabled={exporting || loading || equipos.length === 0}
            className="h-10 gap-2 rounded-xl"
          >
            <ExcelIcon className="h-4 w-4" />
            {exporting ? "Exportando..." : "Descargar Excel"}
          </Button>
        )}
        {canCreate && (
        <Button
          onClick={() => navigate("/gestion-proyectos/detecta/equipos/nuevo")}
          className="h-10 gap-2 bg-[#2D5A3D] px-4 text-white! hover:bg-[#244b33] hover:text-white! [&_svg]:text-white!"
          style={{ color: "#ffffff" }}
        >
          <Plus className="h-4 w-4" color="#ffffff" stroke="#ffffff" /> Nuevo equipo
        </Button>
        )}
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {loading ? (
        <section className="module-section-enter module-enter-delay-3 rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
          <p className="text-sm font-medium text-slate-700">Cargando equipos</p>
        </section>
      ) : equipos.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50"><UsersRound className="h-7 w-7 text-emerald-700" /></div>
          <h2 className="mt-4 font-semibold text-slate-800">Aún no hay equipos</h2>
          <p className="mt-1 text-sm text-slate-500">Crea el primero y deja que Sembria recomiende integrantes compatibles.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {equipos.map((team) => (
            <article key={team.id} className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:shadow-md ${team.activo ? "border-slate-200 hover:border-emerald-200" : "border-slate-300 opacity-85"}`}>
              <div className={`h-1 ${team.activo ? "bg-[#2D5A3D]" : "bg-slate-400"}`} />

              <div className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700"><UsersRound className="h-4.5 w-4.5" /></div>
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <h2 className="truncate text-base font-bold text-slate-900">{team.nombre}</h2>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${team.activo ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{team.activo ? "Activo" : "Inactivo"}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{team.area?.nombre || "Sin área"} · {team.integrantes_total} {team.integrantes_total === 1 ? "persona" : "personas"}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openHistory(team)} className="gap-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-700"><History className="h-3.5 w-3.5" /> Historial</Button>
                  {canEdit && team.activo && <Button variant="ghost" size="sm" onClick={() => navigate(`/gestion-proyectos/detecta/equipos/${team.id}/editar`)} className="gap-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"><Pencil className="h-3.5 w-3.5" /> Editar</Button>}
                  {canEdit && <Button variant="ghost" size="sm" onClick={() => setStatusTeam(team)} disabled={updatingStatusId === team.id} className={`gap-1.5 ${team.activo ? "text-red-600 hover:bg-red-50 hover:text-red-700" : "text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"}`}>{team.activo ? <Power className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />} {team.activo ? "Desactivar" : "Activar"}</Button>}
                </div>
              </div>

              <div className="border-y border-emerald-100 bg-emerald-50/70 px-5 py-3.5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative shrink-0">
                      <MemberAvatar
                        member={team.lider}
                        className="h-10 w-10 border border-emerald-200 bg-white"
                        fallbackClassName="bg-white text-xs font-bold text-emerald-800"
                      />
                      <span className="absolute -right-1 -bottom-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-100 text-amber-700 ring-2 ring-emerald-50"><Crown className="h-2.5 w-2.5" /></span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold tracking-wide text-emerald-700 uppercase">Líder del equipo</p>
                      <p className="truncate text-sm font-semibold text-slate-800">{team.lider?.nombre || "Sin líder"}</p>
                      <p className="truncate text-xs text-slate-500">{team.lider?.cargo || "Sin cargo registrado"}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[10px] font-medium text-emerald-700"><Clock3 className="h-3 w-3" />{scheduleSummary(team.lider?.horarios)}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${isTeamCompatible(team) ? "border-emerald-200 bg-white text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}><CheckCircle2 className="h-3 w-3" />{isTeamCompatible(team) ? "Compatible" : "Revisar horarios"}</span>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-[10px] font-bold tracking-[0.12em] text-slate-500 uppercase">Integrantes</p>
                  <span className="text-xs text-slate-400">{team.integrantes.length} adicionales</span>
                </div>

                {team.integrantes.length ? (
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50">
                    {team.integrantes.slice(0, 4).map((member) => (
                      <div key={member.id} className="flex min-w-0 items-center gap-3 border-b border-slate-100 px-3 py-2.5 last:border-b-0">
                        <MemberAvatar
                          member={member}
                          className="h-8 w-8 border border-slate-200 bg-white"
                          fallbackClassName="bg-white text-[10px] font-bold text-slate-600"
                        />
                        <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-slate-700">{member.nombre}</span><span className="block truncate text-[10px] text-slate-400">{member.cargo || "Integrante"}</span></span>
                      </div>
                    ))}
                    {team.integrantes.length > 4 && <div className="border-t border-slate-100 bg-white px-3 py-2 text-center text-xs font-semibold text-emerald-700">+{team.integrantes.length - 4} integrantes más</div>}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-3 py-3 text-xs text-slate-400"><UserRound className="h-4 w-4" />Aún no se han agregado integrantes.</div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(statusTeam)}
        onOpenChange={(open) => !open && !updatingStatusId && setStatusTeam(null)}
      >
        <DialogContent
          className="max-h-[calc(100vh-48px)] gap-0 overflow-y-auto rounded-2xl p-0 sm:max-w-lg"
          overlayClassName="bg-slate-950/60 backdrop-blur-[3px]"
          closeClassName="top-5 right-5 rounded-lg"
          showCloseButton={!updatingStatusId}
          onEscapeKeyDown={(event) => updatingStatusId && event.preventDefault()}
          onPointerDownOutside={(event) => updatingStatusId && event.preventDefault()}
        >
          <DialogHeader className="relative overflow-hidden border-b border-slate-100 px-6 py-5 pr-16 text-left">
            <div
              className={`pointer-events-none absolute -top-16 -right-14 h-36 w-36 rounded-full blur-3xl ${
                statusTeam?.activo ? "bg-red-100" : "bg-emerald-100"
              }`}
            />
            <div className="relative flex min-w-0 items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                  statusTeam?.activo
                    ? "border-red-100 bg-red-50 text-red-600"
                    : "border-emerald-100 bg-emerald-50 text-emerald-600"
                }`}
              >
                {statusTeam?.activo ? (
                  <AlertTriangle className="h-5 w-5" strokeWidth={1.8} />
                ) : (
                  <RotateCcw className="h-5 w-5" strokeWidth={1.8} />
                )}
              </div>
              <div className="min-w-0">
                <p
                  className={`text-[10px] font-bold tracking-[0.12em] uppercase ${
                    statusTeam?.activo ? "text-red-600" : "text-emerald-700"
                  }`}
                >
                  Estado del equipo
                </p>
                <DialogTitle className="mt-1 text-base leading-6 font-semibold text-slate-900">
                  {statusTeam?.activo
                    ? updatingStatusId
                      ? "Desactivando equipo"
                      : "Desactivar equipo"
                    : updatingStatusId
                      ? "Activando equipo"
                      : "Activar equipo"}
                </DialogTitle>
                <DialogDescription className="mt-1 leading-5">
                  {statusTeam?.activo
                    ? "Confirma que deseas detener temporalmente la operación de este equipo."
                    : "Confirma que deseas activar nuevamente este equipo."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 px-6 py-5">
            <div
              className={`rounded-xl border px-4 py-4 ${
                statusTeam?.activo
                  ? "border-red-100 bg-red-50/60"
                  : "border-emerald-100 bg-emerald-50/60"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    statusTeam?.activo
                      ? "bg-red-100 text-red-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {statusTeam?.activo ? (
                    <Power className="h-4 w-4" strokeWidth={1.9} />
                  ) : (
                    <RotateCcw className="h-4 w-4" strokeWidth={1.9} />
                  )}
                </div>
                <div className="min-w-0">
                  <p
                    className={`truncate text-sm font-semibold ${
                      statusTeam?.activo ? "text-red-800" : "text-emerald-800"
                    }`}
                  >
                    {statusTeam?.nombre || "Equipo"}
                  </p>
                  <p
                    className={`mt-1 text-xs leading-5 ${
                      statusTeam?.activo ? "text-red-700/80" : "text-emerald-700/80"
                    }`}
                  >
                    {statusTeam?.activo
                      ? "Sus integrantes no podrán registrar nuevas convocatorias hasta que el equipo vuelva a activarse."
                      : "El equipo recuperará su operación y conservará su líder y sus integrantes actuales."}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-slate-100 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStatusTeam(null)}
                disabled={Boolean(updatingStatusId)}
                className="h-10 rounded-xl px-4 text-sm font-medium shadow-none"
              >
                Cancelar
              </Button>
              <ActionButton
                action={statusTeam?.activo ? "deactivate" : "activate"}
                tone={statusTeam?.activo ? "danger" : "primary"}
                type="button"
                onClick={confirmStatusChange}
                loading={Boolean(updatingStatusId)}
                loadingText={statusTeam?.activo ? "Desactivando..." : "Activando..."}
              >
                {statusTeam?.activo ? "Desactivar equipo" : "Activar equipo"}
              </ActionButton>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(historyTeam)} onOpenChange={(open) => !open && setHistoryTeam(null)}>
        <DialogContent
          className="max-h-[88vh] gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-2xl"
          overlayClassName="bg-slate-950/60 backdrop-blur-[3px]"
          closeClassName="top-5 right-5 rounded-lg"
        >
          <DialogHeader className="relative overflow-hidden border-b border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white px-6 py-5 pr-16 text-left">
            <div className="pointer-events-none absolute -top-20 -right-12 h-44 w-44 rounded-full bg-emerald-100/80 blur-3xl" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-white text-emerald-700 shadow-sm">
                  <History className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.12em] text-emerald-700 uppercase">
                    Actividad del equipo
                  </p>
                  <DialogTitle className="mt-1 text-lg leading-6 font-bold text-slate-900">
                    Historial de miembros
                  </DialogTitle>
                  <DialogDescription className="mt-1 truncate leading-5">
                    {historyTeam?.nombre || "Equipo"}
                  </DialogDescription>
                </div>
              </div>
              {!historyLoading && !historyError && (
                <span className="mt-1 hidden shrink-0 rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-semibold text-emerald-700 sm:inline-flex">
                  {history.length} {history.length === 1 ? "movimiento" : "movimientos"}
                </span>
              )}
            </div>
          </DialogHeader>

          <div className="max-h-[62vh] overflow-y-auto bg-slate-50/60 px-5 py-5 sm:px-6">
            {historyLoading ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <span className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" />
                <p className="mt-3 text-sm font-medium text-slate-600">Cargando historial...</p>
                <p className="mt-1 text-xs text-slate-400">
                  Consultando los movimientos del equipo.
                </p>
              </div>
            ) : historyError ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-center">
                <AlertTriangle className="mx-auto h-6 w-6 text-red-600" strokeWidth={1.8} />
                <p className="mt-2 text-sm font-semibold text-red-800">
                  No se pudo cargar el historial
                </p>
                <p className="mt-1 text-xs leading-5 text-red-700/80">{historyError}</p>
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <History className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Sin movimientos registrados
                </p>
                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                  Los cambios de líder, asignaciones y retiros aparecerán aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((event) => {
                  const isRemoved = event.accion === "retirado";
                  const isRoleChange = event.accion === "cambio_rol";
                  const EventIcon = isRemoved ? UserMinus : isRoleChange ? ArrowRightLeft : UserPlus;
                  const tone = isRemoved
                    ? "border-red-100 bg-red-50 text-red-600"
                    : isRoleChange
                      ? "border-amber-100 bg-amber-50 text-amber-600"
                      : "border-emerald-100 bg-emerald-50 text-emerald-700";
                  const badge = isRemoved
                    ? "Retiro"
                    : isRoleChange
                      ? "Cambio de rol"
                      : "Asignación";

                  return (
                    <article
                      key={event.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.04)]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative shrink-0">
                          <MemberAvatar
                            member={event.integrante}
                            className="h-10 w-10 border border-slate-200 bg-slate-50"
                            fallbackClassName="bg-slate-100 text-xs font-bold text-slate-600"
                          />
                          <span
                            className={`absolute -right-1.5 -bottom-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white ${tone}`}
                          >
                            <EventIcon className="h-2.5 w-2.5" strokeWidth={2} />
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-800">
                                {event.integrante?.nombre || "Integrante"}
                              </p>
                              <span
                                className={`mt-1.5 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tone}`}
                              >
                                {badge}
                              </span>
                            </div>
                            <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] text-slate-400">
                              <Clock3 className="h-3 w-3" />
                              {historyDate(event.fecha)}
                            </span>
                          </div>

                          <p className="mt-3 text-xs leading-5 text-slate-600">
                            {historyDescription(event)}
                          </p>
                          {event.realizado_por?.nombre && (
                            <p className="mt-2 border-t border-slate-100 pt-2 text-[11px] text-slate-400">
                              Registrado por{" "}
                              <span className="font-medium text-slate-500">
                                {event.realizado_por.nombre}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-slate-100 bg-white px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setHistoryTeam(null)}
              className="h-10 rounded-xl px-5 text-sm font-medium shadow-none"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
