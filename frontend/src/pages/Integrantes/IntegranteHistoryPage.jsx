import {
  ArrowLeft,
  Archive,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  GraduationCap,
  History,
  UserRound,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import FeedbackToast from "@/components/ui/FeedbackToast";
import IntegranteStatusBadge from "@/components/integrantes/IntegranteStatusBadge";
import { DAYS } from "@/constants/daysConstants";
import { useIntegranteHistory } from "@/hooks/integrantes/useIntegranteHistory";
import { calculateWeeklyHours } from "@/services/integrantes-horarios/integrantesHorariosService";
import { formatDate, formatShortDate } from "@/utils/formatters";

function typeLabel(type) {
  if (type === "practicante") return "Practicante";
  if (type === "gerente") return "Gerente";
  return "Voluntario";
}

function deactivationTypeLabel(type) {
  if (type === "manual") return "Manual";
  if (type === "automatica") return "Automática";
  return "-";
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-700">{value || "-"}</p>
    </div>
  );
}

function ScheduleBlocks({ blocks = [] }) {
  if (!blocks.length) {
    return <p className="text-sm text-slate-400">No se registraron horarios para este periodo.</p>;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {blocks.map((block) => (
        <div
          key={block.id || `${block.dia_semana}-${block.hora_inicio}`}
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5"
        >
          <span className="text-sm font-semibold text-slate-700">
            {DAYS[block.dia_semana] || "Día no registrado"}
          </span>
          <span className="text-xs font-medium text-slate-500">
            {block.hora_inicio} - {block.hora_fin}
          </span>
        </div>
      ))}
    </div>
  );
}

function HistoryCard({ item, index }) {
  const isIntern = item.tipo_integrante === "practicante";
  const weeklyHours = calculateWeeklyHours(item.horarios || []);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_12px_38px_rgba(15,23,42,0.09)]">
      <div className="h-1.5 bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500" />
      <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Periodo anterior {index + 1}</h2>
              <span className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                {typeLabel(item.tipo_integrante)}
              </span>
            </div>
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              {formatShortDate(item.fecha_inicio)} — {formatShortDate(item.fecha_fin)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Registrado el {formatDate(item.created_at)}
            </p>
          </div>
          <IntegranteStatusBadge active={item.estado === "Activo"} />
        </div>
      </div>

      <div className="space-y-6 p-6">
        <section>
          <div className="mb-3 flex items-center gap-2">
            <BriefcaseBusiness className="h-4 w-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-800">Asignación institucional</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem label="Área" value={item.area} />
            <InfoItem label="Cargo" value={item.cargo} />
            <InfoItem label="Rol" value={item.rol_nombre} />
            <InfoItem label="Modalidad" value={item.modalidad} />
          </div>
        </section>

        <section className="border-t border-slate-100 pt-5">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">Periodo de participación</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem label="Fecha de inicio" value={formatDate(item.fecha_inicio)} />
            <InfoItem label="Fecha de fin" value={formatDate(item.fecha_fin)} />
            <InfoItem
              label="Duración"
              value={
                item.tipo_integrante === "gerente"
                  ? "Sin periodo definido"
                  : `${item.periodo_meses || "-"} meses`
              }
            />
            <InfoItem label="Estado del periodo" value={item.estado} />
          </div>
        </section>

        {isIntern && (
          <section className="border-t border-slate-100 pt-5">
            <div className="mb-3 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-800">Datos de prácticas</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <InfoItem label="Institución educativa" value={item.institucion_educativa} />
              <InfoItem label="Carrera" value={item.carrera} />
              <InfoItem label="Ciclo" value={item.ciclo} />
              <InfoItem
                label="Horas requeridas"
                value={
                  item.horas_practicas_requeridas ? `${item.horas_practicas_requeridas} horas` : "-"
                }
              />
            </div>
          </section>
        )}

        <section className="border-t border-slate-100 pt-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-cyan-600" />
              <h3 className="text-sm font-bold text-slate-800">Horario registrado</h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {weeklyHours} {weeklyHours === 1 ? "hora semanal" : "horas semanales"}
            </span>
          </div>
          <ScheduleBlocks blocks={item.horarios} />
        </section>

        <section className="border-t border-slate-100 pt-5">
          <div className="mb-3 flex items-center gap-2">
            <BookOpenCheck className="h-4 w-4 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-800">Cierre y auditoría</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem
              label="Fecha de desactivación"
              value={formatShortDate(item.fecha_desactivacion)}
            />
            <InfoItem
              label="Tipo de desactivación"
              value={deactivationTypeLabel(item.tipo_desactivacion)}
            />
            <InfoItem label="Responsable" value={item.desactivado_por_nombre} />
            <InfoItem label="Última actualización" value={formatDate(item.updated_at)} />
          </div>
          <div className="mt-4">
            <InfoItem label="Motivo de desactivación" value={item.motivo_desactivacion} />
          </div>
        </section>
      </div>
    </article>
  );
}

export default function IntegranteHistoryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { integrante, histories, loading, error, clearError } = useIntegranteHistory();

  if (loading) {
    return (
      <div className="module-page-enter mx-auto max-w-6xl pb-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
          <p className="text-sm font-medium text-slate-600">Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="module-page-enter mx-auto max-w-6xl space-y-5 pb-8">
      <button
        type="button"
        onClick={() => navigate(`/integrantes${location.state?.listSearch || ""}`)}
        className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a integrantes
      </button>

      {integrante && (
        <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-[#244B34] via-[#2D5A3D] to-[#39724D] p-6 text-white">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <History className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold tracking-[0.12em] text-emerald-100 uppercase">
                    Historial anterior
                  </p>
                  <h1 className="mt-1 text-2xl font-bold">{integrante.nombre}</h1>
                  <p className="mt-1 text-sm text-emerald-50/80">
                    Periodos finalizados, asignaciones y cambios registrados anteriormente.
                  </p>
                </div>
              </div>
              <div className="flex min-w-32 items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <Archive className="h-5 w-5 text-emerald-100" />
                <div>
                  <p className="text-2xl leading-none font-bold">{histories.length}</p>
                  <p className="mt-1 text-[10px] font-semibold tracking-wide text-emerald-100 uppercase">
                    {histories.length === 1 ? "Periodo anterior" : "Periodos anteriores"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoItem
                label="Documento"
                value={`${integrante.tipo_documento?.toUpperCase() || ""} ${integrante.documento_identidad || ""}`.trim()}
              />
              <InfoItem label="Correo" value={integrante.correo} />
              <InfoItem label="Teléfono" value={integrante.telefono} />
              <InfoItem
                label="Fecha de nacimiento"
                value={formatDate(integrante.fecha_nacimiento)}
              />
              <InfoItem
                label="Ubicación"
                value={[integrante.distrito, integrante.ciudad, integrante.departamento]
                  .filter(Boolean)
                  .join(", ")}
              />
              <InfoItem label="Estado actual" value={integrante.estado} />
            </div>
          </div>
        </section>
      )}

      {histories.length ? (
        <div className="relative space-y-5 before:absolute before:top-5 before:bottom-5 before:left-5 before:hidden before:w-px before:bg-slate-200 sm:before:block">
          {histories.map((item, index) => (
            <div key={item.id} className="relative sm:pl-14">
              <div className="absolute top-6 left-0 z-10 hidden h-10 w-10 items-center justify-center rounded-full border-4 border-slate-50 bg-sky-600 text-sm font-bold text-white shadow-sm sm:flex">
                {index + 1}
              </div>
              <HistoryCard item={item} index={index} />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <UserRound className="mx-auto h-7 w-7 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">
            No existen historiales anteriores para este integrante.
          </p>
        </div>
      )}

      <FeedbackToast
        feedback={error ? { type: "error", message: error } : null}
        onClose={clearError}
      />
    </div>
  );
}
