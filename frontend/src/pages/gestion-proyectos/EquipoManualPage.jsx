import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Crown,
  FileSpreadsheet,
  Gauge,
  Lightbulb,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";

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
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${colors[color]}`}>
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-[11px] font-bold tracking-[0.12em] text-emerald-700 uppercase">{eyebrow}</p>
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

function Tip({ children, tone = "emerald", icon: Icon = Lightbulb }) {
  const styles = {
    blue: "border-blue-100 bg-blue-50/70 text-blue-800",
    emerald: "border-emerald-100 bg-emerald-50/70 text-emerald-800",
    amber: "border-amber-100 bg-amber-50/70 text-amber-800",
  };

  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm leading-5 ${styles[tone]}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.9} />
      <p>{children}</p>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, children }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      <Icon className="h-5 w-5 text-emerald-700" strokeWidth={1.8} />
      <h3 className="mt-3 text-sm font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-500">{children}</p>
    </div>
  );
}

function TeamPreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="h-1 bg-[#2D5A3D]" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-800">Equipo Horizonte</p>
            <p className="mt-0.5 text-xs text-slate-500">Gestión de Proyectos · 4 personas</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">Compatible</span>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">AT</div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><Crown className="h-3.5 w-3.5 text-amber-500" /> Ana Torres</p>
            <p className="mt-0.5 text-[10px] text-slate-400">Lun, Mié, Vie · 3 bloques</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricsPreview() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex flex-wrap gap-2">
        {["1 mes", "3 meses", "6 meses", "12 meses", "Personalizado"].map((period, index) => (
          <span key={period} className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold ${index === 1 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500"}`}>
            {period}
          </span>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-[10px] text-slate-400">Efectividad</p>
          <p className="mt-1 text-xl font-bold text-slate-800">68%</p>
          <p className="text-[10px] text-emerald-600">Aprobadas / registradas</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-[10px] text-slate-400">Mayor rendimiento</p>
          <p className="mt-1 truncate text-sm font-bold text-slate-800">Equipo Horizonte</p>
          <p className="text-[10px] text-blue-600">12 aprobadas</p>
        </div>
      </div>
    </div>
  );
}

export default function EquipoManualPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState("vista-general");
  const canCreate = hasPermission(profile, PERMISSIONS.GP_EQUIPOS_CREAR);
  const canEdit = hasPermission(profile, PERMISSIONS.GP_EQUIPOS_EDITAR);
  const canViewMetrics = hasPermission(profile, PERMISSIONS.GP_EQUIPOS_VER_METRICAS);
  const canDownloadExcel = hasPermission(profile, PERMISSIONS.GP_EQUIPOS_DESCARGAR_EXCEL);
  const sections = useMemo(
    () =>
      [
        { id: "vista-general", label: "Vista general", icon: BookOpen },
        { id: "consultar", label: "Consultar equipos", icon: Search },
        canCreate && { id: "crear", label: "Crear equipo", icon: Plus },
        canEdit && { id: "editar", label: "Editar equipo", icon: Pencil },
        (canCreate || canEdit) && { id: "compatibilidad", label: "Compatibilidad horaria", icon: Clock3 },
        canViewMetrics && { id: "metricas", label: "Ver métricas", icon: Gauge },
        canDownloadExcel && { id: "exportar", label: "Exportar a Excel", icon: FileSpreadsheet },
        { id: "permisos", label: "Recomendaciones", icon: Lightbulb },
      ].filter(Boolean),
    [canCreate, canDownloadExcel, canEdit, canViewMetrics],
  );
  const currentSection = sections.some(({ id }) => id === activeSection)
    ? activeSection
    : "vista-general";
  const sectionEyebrow = (id, label) => {
    const index = sections.findIndex((section) => section.id === id);
    return `${String(index + 1).padStart(2, "0")} · ${label}`;
  };

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
        onClick={() => navigate("/gestion-proyectos/detecta/equipos")}
        className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        Volver a equipos
      </button>

      <header className="relative mb-5 overflow-hidden rounded-2xl border border-emerald-900/10 bg-[#244C34] text-white shadow-sm">
        <div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-emerald-300/10" />
        <div className="absolute -right-4 -bottom-24 h-52 w-52 rounded-full border border-white/10" />
        <div className="relative grid gap-6 px-6 py-7 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10">
              <BookOpen className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <p className="text-xs font-bold tracking-[0.14em] text-emerald-200 uppercase">Guía de uso</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Manual del módulo de equipos</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80">
              Esta guía se adapta a los permisos de tu rol y muestra únicamente las funciones que puedes utilizar dentro del módulo.
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
          <p className="px-3 pt-2 pb-3 text-[11px] font-bold tracking-[0.1em] text-slate-400 uppercase">Contenido</p>
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
                <ChevronRight className={`h-3.5 w-3.5 ${currentSection === id ? "text-emerald-500" : "text-slate-300"}`} />
              </button>
            ))}
          </nav>
        </aside>

        <main key={currentSection} className="min-w-0 space-y-5">
          {currentSection === "vista-general" && (
            <section id="vista-general" role="tabpanel" className={cardClass}>
              <SectionHeader icon={UsersRound} eyebrow={sectionEyebrow("vista-general", "Vista general")} title="¿Qué puedes hacer en este módulo?" description="Consulta, organiza y analiza los equipos responsables de las convocatorias." />
              <div className="space-y-5 p-5 sm:p-6">
                <p className="text-sm leading-6 text-slate-600">Cada equipo reúne a una persona líder y a sus integrantes para registrar y dar seguimiento a convocatorias. La vista principal resume su composición y la compatibilidad de horarios.</p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <FeatureCard icon={UsersRound} title="Composición">Consulta el área, líder, integrantes y cantidad total de personas.</FeatureCard>
                  <FeatureCard icon={Clock3} title="Disponibilidad" tone="amber">Comprueba si cada integrante comparte al menos un horario con el líder.</FeatureCard>
                  {canViewMetrics && <FeatureCard icon={BarChart3} title="Resultados" tone="blue">Compara registros, aprobaciones y efectividad entre equipos.</FeatureCard>}
                  {(canCreate || canEdit) && <FeatureCard icon={UserPlus} title="Gestión" tone="violet">Crea o actualiza equipos según las acciones habilitadas para tu perfil.</FeatureCard>}
                </div>
                <Tip tone="blue" icon={CheckCircle2}>El manual solo muestra las funciones habilitadas para tu perfil. Si una opción no aparece, consulta tus permisos con la persona administradora.</Tip>
              </div>
            </section>
          )}

          {currentSection === "consultar" && (
            <section id="consultar" role="tabpanel" className={cardClass}>
              <SectionHeader icon={Search} eyebrow={sectionEyebrow("consultar", "Consultar equipos")} title="Interpreta cada equipo del listado" description="Revisa su composición, liderazgo y disponibilidad desde una sola tarjeta." color="blue" />
              <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[1fr_320px]">
                <div className="space-y-4">
                  <Step number="1" title="Identifica el equipo">Revisa el nombre, el área vinculada y el total de personas asignadas.</Step>
                  <Step number="2" title="Consulta a la persona líder">La insignia de corona distingue a quien coordina el equipo y muestra un resumen de su horario.</Step>
                  <Step number="3" title="Revisa a los integrantes">Cada integrante aparece con su cargo, datos básicos y disponibilidad registrada. Presiona una fotografía para ampliarla.</Step>
                  <Step number="4" title="Comprueba el estado horario">“Compatible” indica que todos comparten tiempo con el líder; “Revisar horarios” advierte que falta coincidencia.</Step>
                </div>
                <TeamPreview />
              </div>
            </section>
          )}

          {currentSection === "crear" && (
            <section id="crear" role="tabpanel" className={cardClass}>
              <SectionHeader icon={Plus} eyebrow={sectionEyebrow("crear", "Crear equipo")} title="Crea un nuevo equipo" description="Registra una agrupación y selecciona integrantes compatibles." color="violet" />
              <div className="space-y-5 p-5 sm:p-6">
                <Step number="1" title="Abre el formulario">Selecciona “Nuevo equipo” en la parte superior del listado.</Step>
                <Step number="2" title="Define el equipo">Escribe un nombre claro y selecciona a la persona con el cargo de líder de Gestión de Proyectos.</Step>
                <Step number="3" title="Agrega integrantes">Elige entre las personas disponibles con el cargo correspondiente. Quienes ya pertenecen a otro equipo no se ofrecen como candidatos.</Step>
                <Step number="4" title="Guarda los cambios">Verifica la composición y confirma la creación para volver al listado.</Step>
                <Tip tone="amber" icon={Clock3}>Selecciona primero a la persona líder: su horario se usa para evaluar qué integrantes son compatibles.</Tip>
                <Button type="button" onClick={() => navigate("/gestion-proyectos/detecta/equipos/nuevo")} className="gap-2 bg-[#2D5A3D] text-white hover:bg-[#244b33]">
                  <Plus className="h-4 w-4" /> Ir a Nuevo equipo
                </Button>
              </div>
            </section>
          )}

          {currentSection === "editar" && (
            <section id="editar" role="tabpanel" className={cardClass}>
              <SectionHeader icon={Pencil} eyebrow={sectionEyebrow("editar", "Editar equipo")} title="Actualiza un equipo existente" description="Edita sus datos desde una página independiente con la información actual precargada." color="violet" />
              <div className="space-y-5 p-5 sm:p-6">
                <Step number="1" title="Ubica el equipo">En el listado, selecciona el botón “Editar” de la tarjeta correspondiente.</Step>
                <Step number="2" title="Revisa los datos cargados">El formulario muestra el nombre, la persona líder y los integrantes actuales.</Step>
                <Step number="3" title="Realiza los cambios">Puedes renombrar el equipo, cambiar de líder o ajustar sus integrantes.</Step>
                <Step number="4" title="Confirma la actualización">Guarda para aplicar la nueva composición y regresar al módulo.</Step>
                <Tip tone="blue">Si cambias de líder, revisa nuevamente los integrantes seleccionados: el sistema retira las selecciones que dejan de ser compatibles.</Tip>
              </div>
            </section>
          )}

          {currentSection === "compatibilidad" && (
            <section id="compatibilidad" role="tabpanel" className={cardClass}>
              <SectionHeader icon={Clock3} eyebrow={sectionEyebrow("compatibilidad", "Compatibilidad horaria")} title="Comprueba la disponibilidad del equipo" description="Conoce cómo se valida que las personas puedan coordinar actividades." color="amber" />
              <div className="space-y-5 p-5 sm:p-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  <FeatureCard icon={Crown} title="Horario base" tone="amber">La disponibilidad de la persona líder es la referencia del equipo.</FeatureCard>
                  <FeatureCard icon={Clock3} title="Coincidencia">Cada integrante debe compartir al menos un bloque de tiempo con el líder.</FeatureCard>
                  <FeatureCard icon={CheckCircle2} title="Validación">La compatibilidad se comprueba al seleccionar personas y también al guardar.</FeatureCard>
                </div>
                <Tip tone="amber">La compatibilidad se calcula entre líder e integrante. No es necesario que todas las personas coincidan simultáneamente en el mismo bloque.</Tip>
                <p className="text-sm leading-6 text-slate-600">Si una persona no aparece disponible, confirma que tenga un horario registrado, el cargo correcto y que no pertenezca ya a otro equipo.</p>
              </div>
            </section>
          )}

          {currentSection === "metricas" && (
            <section id="metricas" role="tabpanel" className={cardClass}>
              <SectionHeader icon={Gauge} eyebrow={sectionEyebrow("metricas", "Ver métricas")} title="Analiza el rendimiento de los equipos" description="Mide volumen, aprobaciones y efectividad por equipo y período." color="blue" />
              <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[1fr_340px]">
                <div className="space-y-4">
                  <Step number="1" title="Selecciona el período">Usa accesos rápidos de 1, 3, 6 o 12 meses, o define una cantidad personalizada de meses.</Step>
                  <Step number="2" title="Filtra por equipo">Analiza toda la operación o enfócate en un equipo concreto.</Step>
                  <Step number="3" title="Compara los indicadores">Revisa convocatorias registradas, aprobadas, pendientes y la efectividad de aprobación.</Step>
                  <Step number="4" title="Interpreta el ranking">Identifica qué equipo registra más oportunidades y cuál logra más aprobaciones, sin confundir volumen con efectividad.</Step>
                  <Tip tone="blue" icon={CalendarRange}>La efectividad se calcula como convocatorias aprobadas entre convocatorias registradas dentro del período seleccionado.</Tip>
                  <Button type="button" variant="outline" onClick={() => navigate("/gestion-proyectos/detecta/equipos/metricas")} className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800">
                    <BarChart3 className="h-4 w-4" /> Abrir métricas
                  </Button>
                </div>
                <MetricsPreview />
              </div>
            </section>
          )}

          {currentSection === "exportar" && (
            <section id="exportar" role="tabpanel" className={cardClass}>
              <SectionHeader icon={FileSpreadsheet} eyebrow={sectionEyebrow("exportar", "Exportar a Excel")} title="Descarga la información de los equipos" description="Genera una copia estructurada de su composición y disponibilidad." color="cyan" />
              <div className="space-y-5 p-5 sm:p-6">
                <Step number="1" title="Abre el listado">Vuelve a la página principal de Equipos.</Step>
                <Step number="2" title="Selecciona Descargar Excel">El archivo se genera con los equipos disponibles para tu alcance.</Step>
                <Step number="3" title="Revisa el archivo">Incluye equipo, área, líder, integrantes, correos, compatibilidad horaria y estado.</Step>
                <Tip tone="emerald" icon={FileSpreadsheet}>La descarga se habilita cuando existen equipos y tu perfil cuenta con el permiso de exportación.</Tip>
              </div>
            </section>
          )}

          {currentSection === "permisos" && (
            <section id="permisos" role="tabpanel" className={cardClass}>
              <SectionHeader icon={Lightbulb} eyebrow={sectionEyebrow("permisos", "Recomendaciones")} title="Permisos y buenas prácticas" description="Ten en cuenta estas recomendaciones al organizar y analizar los equipos." color="amber" />
              <div className="space-y-4 p-5 sm:p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FeatureCard icon={Search} title="Consultar equipos">Permite acceder al listado y revisar su composición.</FeatureCard>
                  {canCreate && <FeatureCard icon={Plus} title="Crear equipo" tone="violet">Habilita el registro de nuevos equipos.</FeatureCard>}
                  {canEdit && <FeatureCard icon={Pencil} title="Editar equipo" tone="violet">Habilita la actualización de equipos existentes.</FeatureCard>}
                  {canViewMetrics && <FeatureCard icon={BarChart3} title="Ver métricas" tone="blue">Habilita el análisis de resultados y efectividad por equipo.</FeatureCard>}
                  {canDownloadExcel && <FeatureCard icon={FileSpreadsheet} title="Descargar Excel" tone="emerald">Habilita la exportación del listado.</FeatureCard>}
                </div>
                <Tip tone="blue" icon={ShieldCheck}>Los permisos y el alcance global o por área se validan en el servidor. El manual oculta las secciones que no están disponibles para tu perfil.</Tip>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-600">
                  <p className="font-semibold text-slate-800">Funciones disponibles en tu perfil</p>
                  <p className="mt-1">Ver módulo de equipos · {canCreate ? "Crear equipo · " : ""}{canEdit ? "Editar equipo · " : ""}{canViewMetrics ? "Ver métricas · " : ""}{canDownloadExcel ? "Descargar Excel" : "Sin permiso de descarga"}</p>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
