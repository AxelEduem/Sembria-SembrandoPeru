import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  GraduationCap,
  History,
  KeyRound,
  Lightbulb,
  ListFilter,
  MoreHorizontal,
  Pencil,
  Power,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission, PERMISSIONS } from "@/utils/permissions";

const cardClass =
  "manual-panel-enter scroll-mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]";

function SectionHeader({ icon: Icon, eyebrow, title, description, color = "emerald" }) {
  const colors = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    violet: "border-violet-100 bg-violet-50 text-violet-700",
    cyan: "border-cyan-100 bg-cyan-50 text-cyan-700",
  };

  return (
    <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
      <div className="flex items-start gap-3.5">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${colors[color]}`}
        >
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-[11px] font-bold tracking-[0.12em] text-emerald-700 uppercase">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
    </div>
  );
}

function Step({ number, title, children }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2D5A3D] text-xs font-bold text-white">
        {number}
      </span>
      <div className="pt-0.5">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">{children}</p>
      </div>
    </div>
  );
}

function Tip({ children, tone = "emerald" }) {
  const styles = {
    emerald: "border-emerald-100 bg-emerald-50/70 text-emerald-800",
    amber: "border-amber-100 bg-amber-50/70 text-amber-800",
    blue: "border-blue-100 bg-blue-50/70 text-blue-800",
  };

  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm leading-5 ${styles[tone]}`}
    >
      {tone === "amber" ? (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.9} />
      ) : (
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.9} />
      )}
      <p>{children}</p>
    </div>
  );
}

function FieldPreview({ label, value, muted = false }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold text-slate-600">{label}</p>
      <div
        className={`flex h-9 items-center rounded-lg border px-3 text-xs ${muted ? "border-slate-100 bg-slate-50 text-slate-400" : "border-slate-200 bg-white text-slate-600"}`}
      >
        {value}
      </div>
    </div>
  );
}

export default function IntegrantesManualPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState("vista-general");
  const listSearch = location.state?.listSearch || "";

  const canCreate = hasPermission(profile, PERMISSIONS.INTEGRANTES_CREAR);
  const canViewDetail = hasPermission(profile, PERMISSIONS.INTEGRANTES_VER_DETALLE);
  const canEdit = hasPermission(profile, PERMISSIONS.INTEGRANTES_EDITAR);
  const canDeactivate = hasPermission(profile, PERMISSIONS.INTEGRANTES_DESACTIVAR);
  const canActivate = hasPermission(profile, PERMISSIONS.INTEGRANTES_ACTIVAR);
  const canDownloadExcel = hasPermission(profile, PERMISSIONS.INTEGRANTES_DESCARGAR_EXCEL);
  const canViewMetrics = hasPermission(profile, PERMISSIONS.INTEGRANTES_VER_METRICAS);
  const canViewHistory = hasPermission(profile, PERMISSIONS.INTEGRANTES_VER_HISTORIAL);
  const canRehire = hasPermission(profile, PERMISSIONS.INTEGRANTES_RECONTRATAR);
  const canUseRowActions = canViewDetail || canViewHistory || canEdit;
  const canManageStates = canDeactivate || canActivate || canRehire;
  const stateActionLabels = [
    canDeactivate && "desactivar",
    canActivate && "activar",
    canRehire && "recontratar",
  ].filter(Boolean);
  const stateActionSummary =
    stateActionLabels.length > 1
      ? `${stateActionLabels.slice(0, -1).join(", ")} o ${stateActionLabels.at(-1)}`
      : stateActionLabels[0] || "gestionar estados";

  const sections = useMemo(
    () =>
      [
        { id: "vista-general", label: "Vista general", icon: BookOpen },
        { id: "buscar-filtrar", label: "Buscar y filtrar", icon: Search },
        canCreate && { id: "registrar", label: "Registrar", icon: UserPlus },
        canUseRowActions && {
          id: "acciones",
          label: "Consultar y editar",
          icon: MoreHorizontal,
        },
        canManageStates && { id: "estados", label: "Gestionar estados", icon: RefreshCw },
        canViewMetrics && { id: "metricas", label: "Ver métricas", icon: BarChart3 },
        canDownloadExcel && {
          id: "exportar",
          label: "Exportar a Excel",
          icon: FileSpreadsheet,
        },
        { id: "recomendaciones", label: "Recomendaciones", icon: Lightbulb },
      ].filter(Boolean),
    [
      canCreate,
      canDownloadExcel,
      canManageStates,
      canUseRowActions,
      canViewMetrics,
    ],
  );

  const currentSection = sections.some(({ id }) => id === activeSection)
    ? activeSection
    : "vista-general";
  const sectionEyebrow = (id, label) => {
    const index = sections.findIndex((section) => section.id === id);
    return `${String(index + 1).padStart(2, "0")} · ${label}`;
  };

  const overviewItems = [
    [Search, "Consultar", "Busca personas y combina filtros para encontrar un registro."],
    canViewMetrics && [
      BarChart3,
      "Analizar",
      "Consulta indicadores de integrantes por estado, tipo, área, modalidad y periodo.",
    ],
    canCreate && [
      UserPlus,
      "Registrar",
      "Elige el tipo y completa los datos, fechas y horarios correspondientes.",
    ],
    canUseRowActions && [
      Pencil,
      "Administrar",
      "Consulta la ficha, edita sus datos o revisa periodos anteriores según tus permisos.",
    ],
    canManageStates && [
      RefreshCw,
      "Gestionar estados",
      `Aprende a ${stateActionSummary} integrantes con las acciones habilitadas para tu rol.`,
    ],
    canDownloadExcel && [
      FileSpreadsheet,
      "Exportar",
      "Descarga en Excel todos los resultados que coinciden con los filtros aplicados.",
    ],
  ].filter(Boolean);

  const rowActionItems = [
    canViewDetail && {
      icon: Eye,
      label: "Ver",
      color: "text-slate-600",
      description:
        "Abre la ficha vigente con información personal, periodo y horario del integrante.",
    },
    canViewHistory && {
      icon: History,
      label: "Ver historial",
      color: "text-sky-700",
      description:
        "Consulta periodos anteriores, horarios y datos de cierre sin repetir el periodo vigente.",
    },
    canEdit && {
      icon: Pencil,
      label: "Editar",
      color: "text-emerald-700",
      description: "Actualiza y corrige los datos de la participación vigente.",
    },
  ].filter(Boolean);

  const returnToList = () => navigate(`/integrantes${listSearch}`);

  return (
    <div className="module-page-enter mx-auto max-w-7xl pb-10">
      <style>{`
        @keyframes manualPanelEnter {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.988);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes manualPanelContentEnter {
          from {
            opacity: 0;
            transform: translateY(7px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .manual-panel-enter {
          transform-origin: top center;
          animation: manualPanelEnter 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .manual-panel-enter > * {
          animation: manualPanelContentEnter 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .manual-panel-enter > *:nth-child(2) {
          animation-delay: 70ms;
        }

        @media (prefers-reduced-motion: reduce) {
          .manual-panel-enter,
          .manual-panel-enter > * {
            animation: none;
          }
        }
      `}</style>

      <button
        type="button"
        onClick={returnToList}
        className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        Volver a integrantes
      </button>

      <header className="relative mb-5 overflow-hidden rounded-2xl border border-emerald-900/10 bg-[#244C34] text-white shadow-sm">
        <div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-emerald-300/10" />
        <div className="absolute -right-4 -bottom-24 h-52 w-52 rounded-full border border-white/10" />
        <div className="relative grid gap-6 px-6 py-7 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10">
              <BookOpen className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <p className="text-xs font-bold tracking-[0.14em] text-emerald-200 uppercase">
              Guía de uso
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Manual del módulo de integrantes
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80">
              Esta guía se adapta a los permisos de tu rol y muestra únicamente las funciones que
              puedes utilizar dentro del módulo.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs font-semibold text-emerald-100">Tiempo estimado</p>
            <p className="mt-1 text-lg font-bold">5 minutos</p>
          </div>
        </div>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.03)] lg:sticky lg:top-3">
          <p className="px-3 pt-2 pb-3 text-[11px] font-bold tracking-[0.1em] text-slate-400 uppercase">
            Contenido
          </p>
          <nav className="space-y-1" aria-label="Contenido del manual" role="tablist">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={currentSection === id}
                aria-controls={id}
                onClick={() => setActiveSection(id)}
                className={`group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                  currentSection === id
                    ? "translate-x-0.5 bg-emerald-50 text-emerald-800 shadow-[inset_3px_0_0_#2D5A3D]"
                    : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    currentSection === id
                      ? "text-emerald-600"
                      : "text-slate-400 group-hover:text-emerald-600"
                  }`}
                  strokeWidth={1.8}
                />
                <span className="min-w-0 flex-1">{label}</span>
                <ChevronRight
                  className={`h-3.5 w-3.5 ${
                    currentSection === id ? "text-emerald-500" : "text-slate-300"
                  }`}
                />
              </button>
            ))}
          </nav>
        </aside>

        <main key={currentSection} className="min-w-0 space-y-5">
          <section
            id="vista-general"
            role="tabpanel"
            className={`${cardClass} ${currentSection !== "vista-general" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={Users}
              eyebrow={sectionEyebrow("vista-general", "Vista general")}
              title="¿Qué puedes hacer en este módulo?"
              description="El módulo reúne en una sola pantalla la gestión de voluntarios, practicantes y gerentes."
            />
            <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
              {overviewItems.map(([Icon, title, description]) => (
                <div key={title} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <Icon className="h-5 w-5 text-emerald-700" strokeWidth={1.8} />
                  <h3 className="mt-3 text-sm font-semibold text-slate-800">{title}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
                </div>
              ))}
            </div>
            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              <Tip tone="blue">
                Las opciones visibles dependen de tus permisos y del alcance asignado. Si tu acceso
                está limitado a un área, solo verás y gestionarás integrantes de esa área.
              </Tip>
            </div>
          </section>

          <section
            id="buscar-filtrar"
            role="tabpanel"
            className={`${cardClass} ${currentSection !== "buscar-filtrar" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={ListFilter}
              eyebrow={sectionEyebrow("buscar-filtrar", "Buscar y filtrar")}
              title="Encuentra rápidamente a un integrante"
              description="Los filtros pueden combinarse y permanecen aplicados cuando visitas un registro y vuelves al listado."
              color="blue"
            />
            <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[1fr_0.9fr]">
              <div className="space-y-4">
                <Step number="1" title="Escribe una referencia">
                  Usa nombre, correo institucional, documento de identidad o teléfono.
                </Step>
                <Step number="2" title="Combina criterios">
                  Filtra por área, tipo de integrante —incluido Gerente—, cargo, periodo, estado o
                  fecha. Para elegir un cargo, selecciona primero un área.
                </Step>
                <Step number="3" title="Restablece la vista">
                  Presiona <strong>Limpiar filtros</strong> para volver al listado inicial.
                </Step>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Filter className="h-4 w-4" /> Ejemplo de búsqueda
                </div>
                <div className="space-y-2.5">
                  <div className="flex h-10 items-center gap-2 rounded-xl border border-emerald-300 bg-white px-3 text-sm text-slate-600 ring-4 ring-emerald-500/10">
                    <Search className="h-4 w-4 text-slate-400" /> ana torres
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <FieldPreview label="Área" value="Comunicaciones" />
                    <FieldPreview label="Tipo" value="Practicante" />
                    <FieldPreview label="Cargo" value="Diseño gráfico" />
                    <FieldPreview label="Estado" value="Activo" />
                  </div>
                  <p className="pt-1 text-[11px] leading-4 text-slate-400">
                    Resultado: practicantes activos llamados Ana Torres dentro de Comunicaciones y
                    con ese cargo.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {canCreate && (
            <section
              id="registrar"
              role="tabpanel"
              className={`${cardClass} ${currentSection !== "registrar" ? "hidden" : ""}`}
            >
            <SectionHeader
              icon={UserPlus}
              eyebrow={sectionEyebrow("registrar", "Registrar")}
              title="Registra un nuevo integrante"
              description="Presiona “Nuevo integrante” y completa las secciones del formulario en orden."
              color="violet"
            />
            <div className="p-5 sm:p-6">
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  [
                    "1",
                    "Tipo de integrante",
                    "Al abrir el formulario no hay un tipo preseleccionado. Elige Voluntario, Practicante o Gerente para mostrar, con una animación, las secciones que debes completar.",
                  ],
                  [
                    "2",
                    "Datos personales",
                    "Completa nombres, documento, teléfono, modalidad y ubicación.",
                  ],
                  [
                    "3",
                    "Área y cargo",
                    "Selecciona primero el área; luego se habilitarán sus cargos disponibles.",
                  ],
                  [
                    "4",
                    "Periodo",
                    "Para voluntarios y practicantes, indica inicio y fin o usa una duración rápida. Para gerentes, registra solo la fecha de inicio; permanecen activos hasta su desactivación.",
                  ],
                  [
                    "5",
                    "Horario",
                    "Solo voluntarios y practicantes configuran bloques y cumplen el mínimo semanal. El horario del gerente se registra automáticamente y su contenedor no aparece en el formulario.",
                  ],
                ].map(([number, title, text]) => (
                  <div
                    key={number}
                    className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-xs font-bold text-violet-700">
                      {number}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                    <Users className="h-4 w-4" /> Voluntario
                  </div>
                  <p className="mt-2 text-xs leading-5 text-emerald-800/75">
                    Completa los datos personales, de participación, periodo y horario.
                  </p>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                    <GraduationCap className="h-4 w-4" /> Practicante
                  </div>
                  <p className="mt-2 text-xs leading-5 text-amber-800/75">
                    Además requiere carrera, ciclo, institución educativa y un mínimo de horas de
                    prácticas que debe quedar cubierto por el horario de todo el periodo.
                  </p>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                    <BriefcaseBusiness className="h-4 w-4" /> Gerente
                  </div>
                  <p className="mt-2 text-xs leading-5 text-blue-800/75">
                    Solicita los mismos datos personales y de participación que un voluntario, más
                    una fecha de inicio. No requiere fecha de fin ni configurar un horario: su
                    disponibilidad durante la jornada se registra automáticamente.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <Tip tone="blue">
                  El horario configurable representa la participación de voluntarios y practicantes.
                  Los gerentes se consideran disponibles durante toda la jornada y no muestran este
                  contenedor. Las invitaciones a reuniones se gestionan por separado en Agenda.
                </Tip>
                <Tip>
                  Si cambias de Gerente a Voluntario o Practicante, el horario comienza vacío para
                  que definas los bloques correctos; la disponibilidad automática del gerente no se
                  conserva.
                </Tip>
                <Tip>
                  Si sales antes de terminar, el sistema puede ofrecerte continuar con el borrador
                  guardado al regresar al formulario.
                </Tip>
                <Tip tone="blue">
                  En practicantes, escribe las horas prácticas requeridas con el teclado o los
                  controles del campo. Desplazarte con la rueda del mouse no cambia accidentalmente
                  el valor mientras el campo está seleccionado.
                </Tip>
                <Tip tone="amber">
                  Registrar un integrante no crea su acceso al sistema. El correo institucional y la
                  contraseña se configuran después desde el módulo Usuarios.
                </Tip>
              </div>
            </div>
            </section>
          )}

          {canUseRowActions && (
            <section
              id="acciones"
              role="tabpanel"
              className={`${cardClass} ${currentSection !== "acciones" ? "hidden" : ""}`}
            >
            <SectionHeader
              icon={MoreHorizontal}
              eyebrow={sectionEyebrow("acciones", "Consultar y editar")}
              title="Usa el menú de acciones de cada fila"
              description="El botón de tres puntos agrupa las operaciones disponibles según el estado del integrante."
              color="cyan"
            />
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="mx-auto w-full max-w-xs rounded-xl border border-slate-200 bg-white p-2 shadow-[0_12px_35px_rgba(15,23,42,0.10)]">
                {rowActionItems.map(({ icon: Icon, label, color }) => (
                  <div
                    key={label}
                    className={`flex h-10 items-center gap-2.5 rounded-lg px-3 text-xs font-medium ${color}`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.8} /> {label}
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                {rowActionItems.map(({ label, description }, index) => (
                  <Step key={label} number={String(index + 1)} title={label}>
                    {description}
                  </Step>
                ))}
                <Tip tone="amber">
                  Los accesos y las credenciales se administran exclusivamente desde el módulo
                  Usuarios.
                </Tip>
                <Tip tone="blue">
                  Presiona la fotografía de un integrante para ampliarla. Puedes cerrarla con la
                  “X”, haciendo clic fuera de la imagen o presionando Escape.
                </Tip>
              </div>
            </div>
            </section>
          )}

          {canManageStates && (
            <section
              id="estados"
              role="tabpanel"
              className={`${cardClass} ${currentSection !== "estados" ? "hidden" : ""}`}
            >
            <SectionHeader
              icon={RefreshCw}
              eyebrow={sectionEyebrow("estados", "Gestionar estados")}
              title={`Cómo ${stateActionSummary} integrantes`}
              description="El manual muestra únicamente las acciones habilitadas para tu rol."
              color="amber"
            />
            <div className="p-5 sm:p-6">
              <div className="grid gap-3 md:grid-cols-3">
                {canDeactivate && (
                  <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
                    <Power className="h-5 w-5 text-red-600" />
                    <h3 className="mt-3 text-sm font-semibold text-red-900">Desactivar</h3>
                    <p className="mt-1 text-xs leading-5 text-red-800/70">
                      Abre un formulario para indicar el motivo obligatorio y cerrar la
                      participación vigente.
                    </p>
                  </div>
                )}
                {canActivate && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                    <Check className="h-5 w-5 text-emerald-600" />
                    <h3 className="mt-3 text-sm font-semibold text-emerald-900">Activar</h3>
                    <p className="mt-1 text-xs leading-5 text-emerald-800/70">
                      Reactiva al integrante conservando la información de su participación actual.
                      El cambio se refleja inmediatamente en la tabla.
                    </p>
                  </div>
                )}
                {canRehire && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                    <RefreshCw className="h-5 w-5 text-blue-600" />
                    <h3 className="mt-3 text-sm font-semibold text-blue-900">Recontratar</h3>
                    <p className="mt-1 text-xs leading-5 text-blue-800/70">
                      Inicia una nueva participación y permite actualizar el tipo, área, cargo,
                      modalidad y, cuando corresponda, las fechas y el horario.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {canDeactivate && (
                  <Step number="1" title="Cómo desactivar">
                    Ubica un integrante activo, abre el menú de acciones, selecciona
                    <strong> Desactivar</strong>, registra el motivo y confirma.
                  </Step>
                )}
                {canActivate && (
                  <Step number={canDeactivate ? "2" : "1"} title="Cómo activar">
                    Filtra los integrantes inactivos, abre el menú de acciones y selecciona
                    <strong> Activar</strong>. Confirma para recuperar la participación actual.
                  </Step>
                )}
                {canRehire && (
                  <Step
                    number={String(Number(canDeactivate) + Number(canActivate) + 1)}
                    title="Cómo recontratar"
                  >
                    En un integrante inactivo, selecciona <strong>Recontratar</strong>, completa los
                    datos del nuevo periodo —incluidos área, cargo, fechas y horario— y guarda.
                  </Step>
                )}
              </div>

              {canDeactivate && (
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Desactivación directa</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Las aplicaciones institucionales activas no bloquean esta acción. Al elegir
                        <strong> Desactivar</strong>, se solicita el motivo y la fila cambia a
                        inactiva al confirmar.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold">
                <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-emerald-700">
                  Activo
                </span>
                {canDeactivate && (
                  <>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                    <span className="rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-red-700">
                      Desactivar
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </>
                )}
                <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-slate-600">
                  Inactivo
                </span>
                {canActivate && (
                  <>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                    <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-emerald-700">
                      Activar
                    </span>
                  </>
                )}
                {canRehire && (
                  <>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                    <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-blue-700">
                      Recontratar
                    </span>
                  </>
                )}
              </div>
            </div>
            </section>
          )}

          {canViewMetrics && (
            <section
              id="metricas"
              role="tabpanel"
              className={`${cardClass} ${currentSection !== "metricas" ? "hidden" : ""}`}
            >
              <SectionHeader
                icon={BarChart3}
                eyebrow={sectionEyebrow("metricas", "Métricas")}
                title="Analiza la composición de los integrantes"
                description="El botón Métricas abre indicadores elaborados con la información que tu rol puede consultar."
                color="blue"
              />
              <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-2">
                <Step number="1" title="Abre Métricas">
                  Desde la parte superior del listado, presiona <strong>Métricas</strong> para abrir
                  el panel de indicadores.
                </Step>
                <Step number="2" title="Interpreta los resultados">
                  Revisa la distribución por estado, tipo, área, modalidad y periodo para detectar
                  tendencias y necesidades de seguimiento.
                </Step>
                <Tip tone="blue">
                  Si el botón Métricas deja de aparecer, verifica que tu rol conserve el permiso
                  Ver métricas del módulo Integrantes.
                </Tip>
              </div>
            </section>
          )}

          {canDownloadExcel && (
            <section
              id="exportar"
              role="tabpanel"
              className={`${cardClass} ${currentSection !== "exportar" ? "hidden" : ""}`}
            >
            <SectionHeader
              icon={FileSpreadsheet}
              eyebrow={sectionEyebrow("exportar", "Exportar")}
              title="Descarga el listado en Excel"
              description="La exportación toma los resultados que se encuentran visibles según los filtros aplicados."
            />
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="space-y-4">
                <Step number="1" title="Prepara el listado">
                  Aplica los filtros necesarios. Por ejemplo: área “Comunicaciones”, tipo
                  “Practicante” y estado “Activo”.
                </Step>
                <Step number="2" title="Descarga el archivo">
                  Presiona <strong>Descargar Excel</strong>. Se generará el archivo{" "}
                  <strong>integrantes.xlsx</strong> con todos los resultados filtrados, no solo la
                  página visible.
                </Step>
                <Tip tone="blue">
                  El archivo contiene los datos personales y de la participación vigente. No incluye
                  historiales anteriores, datos de desactivación, control de accesos ni la foto de
                  perfil. Los gerentes figuran sin una duración definida porque solo se registra su
                  fecha de inicio.
                </Tip>
              </div>
              <div className="flex min-w-56 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50/70 p-6">
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
                    <Download className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-emerald-900">integrantes.xlsx</p>
                  <p className="mt-1 text-xs text-emerald-700/70">Listado filtrado</p>
                </div>
              </div>
            </div>
            </section>
          )}

          <section
            id="recomendaciones"
            role="tabpanel"
            className={`${cardClass} ${currentSection !== "recomendaciones" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={CircleHelp}
              eyebrow={sectionEyebrow("recomendaciones", "Recomendaciones")}
              title="Buenas prácticas y ayuda rápida"
              description="Ten en cuenta estas recomendaciones para mantener información confiable."
              color="blue"
            />
            <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
              {[
                [
                  CheckCircle2,
                  "Evita duplicados",
                  "Busca primero por documento antes de registrar a una persona.",
                ],
                [
                  CalendarDays,
                  "Comprueba las fechas",
                  "Verifica el horario semanal de voluntarios y practicantes. En practicantes, confirma que el total proyectado del periodo cubra las horas requeridas; la disponibilidad del gerente es automática.",
                ],
                [
                  KeyRound,
                  "Protege las credenciales",
                  "Configura y comparte contraseñas únicamente desde el módulo Usuarios.",
                ],
                [
                  ShieldCheck,
                  "Respeta los permisos",
                  "Si una opción no aparece o un área está bloqueada, tu cuenta puede tener un alcance limitado.",
                ],
              ].map(([Icon, title, text]) => (
                <div
                  key={title}
                  className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                >
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" strokeWidth={1.8} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <p className="text-sm font-semibold text-slate-800">¿Listo para comenzar?</p>
                <p className="mt-1 text-xs text-slate-500">
                  Vuelve al listado y aplica lo aprendido.
                </p>
              </div>
              <Button
                type="button"
                onClick={returnToList}
                className="h-10 gap-2 rounded-xl bg-[#2D5A3D] px-5 text-white hover:bg-[#234B32]"
              >
                <UserRound className="h-4 w-4" /> Ir a integrantes
              </Button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
