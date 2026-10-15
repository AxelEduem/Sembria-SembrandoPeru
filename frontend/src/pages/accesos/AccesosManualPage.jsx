import {
  AlertTriangle,
  AppWindow,
  ArrowLeft,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Download,
  FileSpreadsheet,
  Filter,
  Gauge,
  KeyRound,
  Layers3,
  Lightbulb,
  LockKeyhole,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS, hasPermission } from "@/utils/permissions";

const sections = [
  {
    id: "vista-general",
    label: "Vista general",
    icon: BookOpen,
    permission: PERMISSIONS.ACCESOS_VER,
  },
  { id: "licencias", label: "Licencias", icon: BarChart3, permission: PERMISSIONS.ACCESOS_VER },
  {
    id: "asignar",
    label: "Gestionar accesos",
    icon: UserPlus,
    permission: PERMISSIONS.ACCESOS_GESTIONAR,
  },
  {
    id: "consultar",
    label: "Consultar y filtrar",
    icon: Search,
    permission: PERMISSIONS.ACCESOS_VER,
  },
  {
    id: "inactivos",
    label: "Accesos pendientes",
    icon: ShieldAlert,
    permission: PERMISSIONS.ACCESOS_VER_INACTIVOS,
  },
  {
    id: "retirar",
    label: "Retirar accesos",
    icon: Trash2,
    permission: PERMISSIONS.ACCESOS_GESTIONAR,
  },
  { id: "metricas", label: "Métricas", icon: Gauge, permission: PERMISSIONS.ACCESOS_VER_METRICAS },
  {
    id: "exportar",
    label: "Exportar",
    icon: FileSpreadsheet,
    permission: PERMISSIONS.ACCESOS_DESCARGAR_EXCEL,
  },
];

const panelClass =
  "access-manual-panel-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]";

function SectionHeader({ icon: Icon, number, title, description, tone = "emerald" }) {
  const tones = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    red: "border-red-100 bg-red-50 text-red-600",
    violet: "border-violet-100 bg-violet-50 text-violet-700",
  };

  return (
    <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
      <div className="flex items-start gap-3.5">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${tones[tone]}`}
        >
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-[11px] font-bold tracking-[0.12em] text-emerald-700 uppercase">
            {number}
          </p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
    </div>
  );
}

function Step({ number, title, children, tone = "emerald" }) {
  const numberClass =
    tone === "red" ? "bg-red-600" : tone === "amber" ? "bg-amber-500" : "bg-[#2D5A3D]";

  return (
    <div className="flex gap-3">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${numberClass}`}
      >
        {number}
      </span>
      <div className="pt-0.5">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">{children}</p>
      </div>
    </div>
  );
}

function Notice({ children, tone = "blue", icon: Icon = Lightbulb }) {
  const tones = {
    blue: "border-blue-100 bg-blue-50/70 text-blue-800",
    emerald: "border-emerald-100 bg-emerald-50/70 text-emerald-800",
    amber: "border-amber-100 bg-amber-50/70 text-amber-800",
    red: "border-red-100 bg-red-50/70 text-red-800",
  };

  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 ${tones[tone]}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.9} />
      <p className="text-sm leading-5">{children}</p>
    </div>
  );
}

function LicensePreview({ name, used, total, color = "emerald" }) {
  const percent = Math.round((used / total) * 100);
  const colorClass = color === "amber" ? "bg-amber-500" : "bg-emerald-600";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
          <AppWindow className="h-5 w-5 text-emerald-700" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-800">{name}</p>
          <p className="text-[11px] text-slate-400">
            {used} de {total} ocupadas
          </p>
        </div>
        <span className="text-sm font-bold text-slate-800">{percent}%</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-slate-400">
        <span>{used} ocupadas</span>
        <span>{total - used} disponibles</span>
      </div>
    </div>
  );
}

function FilterPreview() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex h-10 items-center gap-2 rounded-xl border border-emerald-300 bg-white px-3 text-sm text-slate-600 ring-4 ring-emerald-500/10">
        <Search className="h-4 w-4 text-slate-400" /> Ana Torres
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {["Área: Comunicaciones", "Cargo: Diseño", "Tipo: Practicante", "Aplicación: Canva"].map(
          (value) => (
            <div
              key={value}
              className="flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-[11px] text-slate-600"
            >
              {value}
            </div>
          ),
        )}
      </div>
    </div>
  );
}

export default function AccesosManualPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState("vista-general");
  const listSearch = location.state?.listSearch || "";
  const visibleSections = sections.filter(({ permission }) => hasPermission(profile, permission));
  const selectedSection = visibleSections.some(({ id }) => id === activeSection)
    ? activeSection
    : visibleSections[0]?.id || "vista-general";
  const canManage = hasPermission(profile, PERMISSIONS.ACCESOS_GESTIONAR);
  const canDownloadExcel = hasPermission(profile, PERMISSIONS.ACCESOS_DESCARGAR_EXCEL);
  const canViewInactive = hasPermission(profile, PERMISSIONS.ACCESOS_VER_INACTIVOS);
  const overviewCards = [
    [BarChart3, "Controlar licencias", "Consulta ocupadas y disponibles por aplicación."],
    ...(canManage
      ? [
          [UserPlus, "Asignar", "Entrega una o varias herramientas compatibles."],
          [Trash2, "Retirar", "Elimina una asignación cuando ya no corresponde."],
        ]
      : []),
    [Search, "Supervisar", "Filtra accesos activos dentro de tu alcance."],
  ];
  const permissionHelp = [
    [
      PERMISSIONS.ACCESOS_VER,
      "Ver módulo de accesos",
      "Consulta licencias y asignaciones dentro de tu alcance.",
    ],
    [
      PERMISSIONS.ACCESOS_GESTIONAR,
      "Gestionar accesos",
      "Permite asignar aplicaciones y retirar accesos.",
    ],
    [
      PERMISSIONS.ACCESOS_VER_METRICAS,
      "Ver métricas",
      "Permite consultar los indicadores y riesgos del módulo.",
    ],
    [
      PERMISSIONS.ACCESOS_DESCARGAR_EXCEL,
      "Descargar Excel",
      "Habilita la exportación de los listados disponibles.",
    ],
    [
      PERMISSIONS.ACCESOS_VER_INACTIVOS,
      "Ver integrantes inactivos con acceso",
      "Muestra las asignaciones pendientes de integrantes inactivos.",
    ],
  ].filter(([permission]) => hasPermission(profile, permission));
  const inactiveCards = [
    [
      ShieldAlert,
      "Identifica pendientes",
      "El contador de la pestaña indica cuántas asignaciones inactivas requieren revisión.",
      "amber",
    ],
    [
      Filter,
      canDownloadExcel ? "Filtra y exporta" : "Filtra el listado",
      canDownloadExcel
        ? "Usa los filtros y descarga el listado para coordinar el retiro."
        : "Usa los filtros de accesos para localizar las asignaciones que debes revisar.",
      "blue",
    ],
    ...(canManage
      ? [
          [
            Layers3,
            "Libera licencias",
            "Retira cada acceso confirmado para devolver la licencia al inventario disponible.",
            "emerald",
          ],
        ]
      : []),
  ];
  const exportReports = [
    [
      "Sin acceso",
      "integrantes_sin_acceso.xls",
      "Personas activas sin ninguna herramienta asignada.",
    ],
    [
      "Con acceso",
      "integrantes_con_acceso.xls",
      "Asignaciones activas que cumplen los filtros actuales.",
    ],
    ...(canViewInactive
      ? [
          [
            "Inactivos",
            "integrantes_inactivos_con_acceso.xls",
            "Asignaciones pendientes de integrantes desactivados.",
          ],
        ]
      : []),
  ];

  const returnToModule = () => navigate(`/accesos${listSearch}`);

  return (
    <div className="module-page-enter mx-auto max-w-7xl pb-10">
      <style>{`
        @keyframes accessManualPanelEnter {
          from { opacity: 0; transform: translateY(14px) scale(.988); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes accessManualContentEnter {
          from { opacity: 0; transform: translateY(7px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .access-manual-panel-enter {
          transform-origin: top center;
          animation: accessManualPanelEnter 420ms cubic-bezier(.22,1,.36,1) both;
        }
        .access-manual-panel-enter > * {
          animation: accessManualContentEnter 360ms cubic-bezier(.22,1,.36,1) both;
        }
        .access-manual-panel-enter > *:nth-child(2) { animation-delay: 70ms; }
        @media (prefers-reduced-motion: reduce) {
          .access-manual-panel-enter,
          .access-manual-panel-enter > * { animation: none; }
        }
      `}</style>

      <button
        type="button"
        onClick={returnToModule}
        className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        Volver a accesos
      </button>

      <header className="relative mb-5 overflow-hidden rounded-2xl border border-emerald-900/10 bg-gradient-to-br from-[#183E2A] to-[#2D5A3D] text-white shadow-sm">
        <div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-emerald-200/10" />
        <div className="absolute -right-5 -bottom-24 h-52 w-52 rounded-full border border-white/10" />
        <div className="relative grid gap-6 px-6 py-7 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10">
              <ShieldCheck className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <p className="text-xs font-bold tracking-[0.14em] text-emerald-200 uppercase">
              Guía de uso
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Manual del módulo de accesos
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80">
              Consulta únicamente las guías de las funciones habilitadas para tu cuenta y su alcance
              autorizado.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs font-semibold text-emerald-100">Tiempo estimado</p>
            <p className="mt-1 text-lg font-bold">7 minutos</p>
          </div>
        </div>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[245px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.03)] lg:sticky lg:top-3">
          <p className="px-3 pt-2 pb-3 text-[11px] font-bold tracking-[0.1em] text-slate-400 uppercase">
            Contenido
          </p>
          <nav className="space-y-1" aria-label="Contenido del manual" role="tablist">
            {visibleSections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={selectedSection === id}
                aria-controls={`access-manual-${id}`}
                onClick={() => setActiveSection(id)}
                className={`group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                  selectedSection === id
                    ? "translate-x-0.5 bg-emerald-50 text-emerald-800 shadow-[inset_3px_0_0_#2D5A3D]"
                    : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${selectedSection === id ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-600"}`}
                  strokeWidth={1.8}
                />
                <span className="min-w-0 flex-1">{label}</span>
                <ChevronRight
                  className={`h-3.5 w-3.5 ${selectedSection === id ? "text-emerald-500" : "text-slate-300"}`}
                />
              </button>
            ))}
          </nav>
        </aside>

        <main key={selectedSection} className="min-w-0">
          <section
            id="access-manual-vista-general"
            role="tabpanel"
            className={`${panelClass} ${selectedSection !== "vista-general" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={ShieldCheck}
              number="01 · Vista general"
              title="¿Qué administra este módulo?"
              description="Relaciona a cada integrante con las herramientas institucionales que necesita."
            />
            <div className="p-5 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {overviewCards.map(([Icon, title, text]) => (
                  <div
                    key={title}
                    className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"
                  >
                    <Icon className="h-5 w-5 text-emerald-700" strokeWidth={1.8} />
                    <p className="mt-3 text-sm font-semibold text-slate-800">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-3">
                <Notice icon={LockKeyhole}>
                  Las secciones de este manual se muestran según tus permisos para consultar,
                  gestionar, ver métricas, exportar o revisar accesos de integrantes inactivos.
                </Notice>
                <Notice tone="emerald" icon={ShieldCheck}>
                  El alcance por área limita qué integrantes puedes administrar y qué aplicaciones
                  puedes asignarles.
                </Notice>
              </div>
            </div>
          </section>

          <section
            id="access-manual-licencias"
            role="tabpanel"
            className={`${panelClass} ${selectedSection !== "licencias" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={BarChart3}
              number="02 · Licencias"
              title="Comprueba la capacidad de cada aplicación"
              description="Las tarjetas superiores muestran el consumo total antes de realizar asignaciones."
              tone="blue"
            />
            <div className="p-5 sm:p-6">
              <div className="grid gap-3 md:grid-cols-2">
                <LicensePreview name="Google Workspace" used={18} total={25} />
                <LicensePreview name="Canva Institucional" used={9} total={10} color="amber" />
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <Step number="1" title="Licencias ocupadas">
                  Incluyen las asignaciones de integrantes activos y también las que aún conservan
                  integrantes inactivos.
                </Step>
                <Step number="2" title="Licencias disponibles">
                  Es la diferencia entre el total registrado para la aplicación y todas sus
                  asignaciones actuales.
                </Step>
              </div>
              <div className="mt-5">
                <Notice tone="amber" icon={AlertTriangle}>
                  Si una aplicación no tiene licencias libres, no podrá asignarse hasta retirar una
                  asignación o ampliar su capacidad en Aplicaciones.
                </Notice>
              </div>
            </div>
          </section>

          <section
            id="access-manual-asignar"
            role="tabpanel"
            className={`${panelClass} ${selectedSection !== "asignar" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={UserPlus}
              number="03 · Gestionar accesos"
              title="Asigna aplicaciones desde la tabla"
              description="La acción Gestionar de cada fila permite revisar los accesos actuales y asignar varias herramientas en una sola operación."
              tone="violet"
            />
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_0.9fr]">
              <div className="space-y-4">
                <Step number="1" title="Abre la gestión del integrante">
                  Localiza a la persona con los filtros y presiona <strong>Gestionar</strong> en la
                  columna Acción de su fila.
                </Step>
                <Step number="2" title="Marca las aplicaciones">
                  El sistema muestra herramientas generales o correspondientes al área, que la
                  persona todavía no posee y que tienen licencia disponible.
                </Step>
                <Step number="3" title="Confirma la asignación">
                  Revisa la cantidad seleccionada y presiona <strong>Asignar</strong>. Puedes
                  otorgar varias aplicaciones al mismo tiempo.
                </Step>
                <Notice tone="emerald" icon={CheckCircle2}>
                  Al finalizar, el formulario se limpia y las estadísticas se actualizan con las
                  nuevas licencias ocupadas.
                </Notice>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <UserPlus className="h-4 w-4 text-emerald-700" /> Gestionar accesos
                </div>
                <div className="mt-4 flex h-10 items-center gap-2 rounded-xl border border-emerald-300 bg-white px-3 text-xs text-slate-600 ring-4 ring-emerald-500/10">
                  <Search className="h-4 w-4 text-slate-400" /> Ana Torres
                </div>
                <p className="mt-4 text-[11px] font-semibold text-slate-600">
                  Aplicaciones disponibles
                </p>
                <div className="mt-2 space-y-2">
                  {[
                    "Google Workspace · 7 disponibles",
                    "Canva · 1 disponible",
                    "Notion · 5 disponibles",
                  ].map((app, index) => (
                    <div
                      key={app}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-xs ${index < 2 ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600"}`}
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded border ${index < 2 ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300"}`}
                      >
                        {index < 2 ? <Check className="h-3 w-3" /> : null}
                      </span>
                      {app}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex h-10 items-center justify-center gap-2 rounded-xl bg-[#2D5A3D] text-xs font-semibold text-white">
                  <Plus className="h-4 w-4" /> Asignar 2
                </div>
              </div>
            </div>
          </section>

          <section
            id="access-manual-consultar"
            role="tabpanel"
            className={`${panelClass} ${selectedSection !== "consultar" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={Search}
              number="04 · Consultar y filtrar"
              title="Revisa quién utiliza cada aplicación"
              description="La tabla principal presenta todos los integrantes e indica sus aplicaciones asignadas o si todavía no tienen acceso."
              tone="blue"
            />
            <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[1fr_0.9fr]">
              <div className="space-y-4">
                <Step number="1" title="Busca por nombre o correo">
                  Escribe una referencia para localizar rápidamente al integrante.
                </Step>
                <Step number="2" title="Combina filtros">
                  Filtra por área, cargo, tipo de integrante y aplicación. Selecciona primero el
                  área para obtener sus cargos. El selector muestra las áreas registradas en el
                  backend dentro de tu alcance autorizado, aunque todavía no tengan accesos.
                </Step>
                <Step number="3" title="Interpreta las filas">
                  Cada fila corresponde a una aplicación asignada. Una persona con tres herramientas
                  aparecerá en tres filas. Presiona su fotografía para ampliarla sin abandonar la
                  tabla.
                </Step>
                <Step number="4" title="Restablece la consulta">
                  Usa <strong>Limpiar filtros</strong> para recuperar todas las asignaciones
                  visibles.
                </Step>
                <Notice tone="blue" icon={Filter}>
                  Los filtros se guardan en la URL y Laravel realiza la consulta. Puedes recargar o
                  compartir el enlace sin perder la vista y los criterios seleccionados.
                </Notice>
              </div>
              <FilterPreview />
            </div>
          </section>

          <section
            id="access-manual-inactivos"
            role="tabpanel"
            className={`${panelClass} ${selectedSection !== "inactivos" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={ShieldAlert}
              number="05 · Accesos pendientes"
              title="Revisa integrantes inactivos que aún conservan herramientas"
              description="Esta pestaña funciona como una lista de control para recuperar licencias pendientes."
              tone="amber"
            />
            <div className="p-5 sm:p-6">
              <div className="grid gap-4 lg:grid-cols-3">
                {inactiveCards.map(([Icon, title, text, tone]) => (
                  <div
                    key={title}
                    className={`rounded-xl border p-4 ${
                      tone === "amber"
                        ? "border-amber-100 bg-amber-50/60"
                        : tone === "blue"
                          ? "border-blue-100 bg-blue-50/60"
                          : "border-emerald-100 bg-emerald-50/60"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        tone === "amber"
                          ? "text-amber-600"
                          : tone === "blue"
                            ? "text-blue-600"
                            : "text-emerald-700"
                      }`}
                    />
                    <p className="mt-3 text-sm font-semibold text-slate-900">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <Notice tone="amber" icon={AlertTriangle}>
                  Desactivar un integrante no siempre significa que el acceso externo ya fue
                  retirado. Comprueba la aplicación antes de confirmar la eliminación en el sistema.
                </Notice>
              </div>
            </div>
          </section>

          <section
            id="access-manual-retirar"
            role="tabpanel"
            className={`${panelClass} ${selectedSection !== "retirar" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={Trash2}
              number="06 · Retirar accesos"
              title="Quita uno o todos los accesos de forma segura"
              description="Desde Gestionar puedes retirar una aplicación específica o todas las asignaciones del integrante, sin eliminarlo del sistema."
              tone="red"
            />
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_0.85fr]">
              <div className="space-y-4">
                <Step number="1" title="Retira el acceso en la aplicación externa" tone="red">
                  Ingresa a la herramienta correspondiente y deshabilita o elimina la cuenta del
                  integrante.
                </Step>
                <Step number="2" title="Elige qué deseas retirar" tone="red">
                  En la fila del integrante presiona <strong>Gestionar</strong>. Luego usa el ícono
                  de eliminación de una aplicación o <strong>Quitar todos</strong>.
                </Step>
                <Step number="3" title="Marca la declaración" tone="red">
                  Confirma que ya retiraste el acceso real en la aplicación. Sin esta casilla, el
                  botón final permanece deshabilitado.
                </Step>
                <Step number="4" title="Confirma el retiro" tone="red">
                  La asignación desaparecerá y la licencia volverá a figurar como disponible.
                </Step>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Quitar acceso</p>
                    <p className="mt-1 text-xs text-slate-500">
                      La persona dejará de tener esta aplicación.
                    </p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-800">Ana Torres</p>
                  <p className="mt-1 text-xs text-slate-500">Canva Institucional</p>
                </div>
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-blue-600 bg-blue-600 text-white">
                    <Check className="h-3 w-3" />
                  </span>
                  <p className="text-[11px] leading-4 text-slate-700">
                    Confirmo que ya quité el acceso en esta aplicación.
                  </p>
                </div>
                <div className="mt-4 flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 text-xs font-semibold text-white">
                  <Trash2 className="h-4 w-4" /> Quitar acceso
                </div>
              </div>
            </div>
          </section>

          <section
            id="access-manual-metricas"
            role="tabpanel"
            className={`${panelClass} ${selectedSection !== "metricas" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={Gauge}
              number="07 · Métricas"
              title="Detecta capacidad, cobertura y riesgos"
              description="La página de métricas convierte las asignaciones y licencias actuales en indicadores para tomar decisiones."
              tone="blue"
            />
            <div className="p-5 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  [KeyRound, "Accesos activos", "Cantidad de asignaciones vigentes."],
                  [ShieldCheck, "Cobertura", "Integrantes activos con al menos una aplicación."],
                  [Gauge, "Ocupación", "Porcentaje global de licencias utilizadas."],
                  [Layers3, "Disponibilidad", "Licencias que todavía pueden asignarse."],
                  [AlertTriangle, "Aplicaciones críticas", "Herramientas con 80% o más de uso."],
                  [
                    ShieldAlert,
                    "Accesos por retirar",
                    "Asignaciones que conservan integrantes inactivos.",
                  ],
                ].map(([Icon, title, text]) => (
                  <div
                    key={title}
                    className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"
                  >
                    <Icon className="h-5 w-5 text-emerald-700" strokeWidth={1.8} />
                    <p className="mt-3 text-sm font-semibold text-slate-800">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                  <Step number="1" title="Revisa primero los riesgos" tone="red">
                    Atiende <strong>Accesos por retirar</strong> y las aplicaciones sin capacidad
                    disponible. Son los indicadores que requieren acción inmediata.
                  </Step>
                  <Step number="2" title="Compara ocupadas y disponibles">
                    El gráfico de capacidad muestra cada aplicación y permite anticipar dónde será
                    necesario retirar accesos o ampliar licencias.
                  </Step>
                  <Step number="3" title="Comprueba la cobertura">
                    Usa la proporción con y sin acceso para detectar integrantes que podrían
                    necesitar herramientas. No todos los cargos requieren todas las aplicaciones.
                  </Step>
                </div>
                <div className="space-y-4">
                  <Step number="4" title="Identifica concentraciones">
                    Los accesos por área muestran qué equipos consumen más herramientas
                    institucionales.
                  </Step>
                  <Step number="5" title="Revisa la carga por integrante">
                    Detecta cuántas personas concentran una, dos o más aplicaciones para revisar
                    asignaciones excesivas o innecesarias.
                  </Step>
                  <Step number="6" title="Analiza los retiros pendientes" tone="amber">
                    El último gráfico agrupa por aplicación los accesos que todavía conservan los
                    integrantes inactivos.
                  </Step>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Notice tone="emerald" icon={CheckCircle2}>
                  Las métricas usan datos actuales del backend y respetan el alcance de acceso de tu
                  cuenta.
                </Notice>
                <Notice tone="blue" icon={LockKeyhole}>
                  El botón Métricas solo aparece para cuentas que tengan permiso para consultar
                  indicadores.
                </Notice>
              </div>
            </div>
          </section>

          <section
            id="access-manual-exportar"
            role="tabpanel"
            className={`${panelClass} ${selectedSection !== "exportar" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={FileSpreadsheet}
              number="08 · Exportar"
              title="Descarga los reportes permitidos para tu cuenta"
              description="Los listados disponibles respetan los permisos y el alcance asignados a tu rol."
              tone="violet"
            />
            <div className="p-5 sm:p-6">
              <div className="grid gap-3 md:grid-cols-3">
                {exportReports.map(([title, file, text]) => (
                  <div
                    key={title}
                    className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                  >
                    <Download className="h-5 w-5 text-emerald-700" />
                    <p className="mt-3 text-sm font-semibold text-slate-800">{title}</p>
                    <p className="mt-1 text-[10px] font-medium break-all text-emerald-700">
                      {file}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold text-slate-700">Permisos del módulo</p>
                </div>
                <div className="grid gap-px bg-slate-100 sm:grid-cols-2">
                  {permissionHelp.map(([, title, text]) => (
                    <div key={title} className="bg-white p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <KeyRound className="h-4 w-4 text-emerald-700" /> {title}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Notice tone="blue" icon={CircleHelp}>
                  Si una pestaña o botón no aparece, revisa con un administrador los permisos y el
                  área asignada a tu rol.
                </Notice>
                <Notice tone="emerald" icon={CheckCircle2}>
                  Antes de asignar o retirar, verifica siempre la persona, la aplicación y la
                  disponibilidad de licencias.
                </Notice>
              </div>
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  ¿Listo para administrar accesos?
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Vuelve al módulo y revisa las licencias disponibles.
                </p>
              </div>
              <Button
                type="button"
                onClick={returnToModule}
                className="h-10 gap-2 rounded-xl bg-[#2D5A3D] px-5 text-white hover:bg-[#234B32]"
              >
                <ShieldCheck className="h-4 w-4" /> Ir a accesos
              </Button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
