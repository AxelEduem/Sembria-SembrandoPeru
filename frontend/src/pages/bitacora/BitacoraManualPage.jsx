import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  Filter,
  Globe2,
  Lightbulb,
  ListFilter,
  ScrollText,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  PERMISSIONS,
  getPermissionScope,
  hasAccessTotal,
  hasPermission,
} from "@/utils/permissions";

const cardClass =
  "manual-panel-enter scroll-mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]";

function SectionHeader({ icon: Icon, eyebrow, title, description, color = "emerald" }) {
  const colors = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    violet: "border-violet-100 bg-violet-50 text-violet-700",
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
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2D5A3D] text-xs font-bold text-white">{number}</span>
      <div className="pt-0.5"><p className="text-sm font-semibold text-slate-800">{title}</p><p className="mt-1 text-sm leading-6 text-slate-500">{children}</p></div>
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
    <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm leading-5 ${styles[tone]}`}>
      {tone === "amber" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />}
      <p>{children}</p>
    </div>
  );
}

export default function BitacoraManualPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState("vista-general");
  const listSearch = location.state?.listSearch || "";
  const canViewMetrics = hasPermission(profile, PERMISSIONS.BITACORA_VER_METRICAS);
  const canDownloadExcel = hasPermission(profile, PERMISSIONS.BITACORA_DESCARGAR_EXCEL);
  const globalScope =
    hasAccessTotal(profile) || getPermissionScope(profile, PERMISSIONS.BITACORA_VER) === "global";

  const sections = useMemo(
    () => [
      { id: "vista-general", label: "Vista general", icon: BookOpen },
      { id: "buscar-filtrar", label: "Buscar y filtrar", icon: Search },
      { id: "detalle", label: "Consultar detalles", icon: Eye },
      canViewMetrics && { id: "metricas", label: "Ver métricas", icon: BarChart3 },
      canDownloadExcel && { id: "exportar", label: "Exportar a Excel", icon: FileSpreadsheet },
      { id: "recomendaciones", label: "Recomendaciones", icon: Lightbulb },
    ].filter(Boolean),
    [canDownloadExcel, canViewMetrics],
  );

  const currentSection = sections.some(({ id }) => id === activeSection)
    ? activeSection
    : "vista-general";
  const eyebrow = (id, label) => {
    const index = sections.findIndex((section) => section.id === id);
    return `${String(index + 1).padStart(2, "0")} · ${label}`;
  };
  const returnToList = () => navigate(`/bitacora${listSearch}`);

  const overviewItems = [
    [Search, "Consultar", "Busca operaciones por responsable, correo, descripción o entidad relacionada."],
    [Filter, "Filtrar", "Combina módulo, acción, resultado y rango de fechas para precisar la consulta."],
    [Eye, "Revisar detalles", "Consulta responsable, ruta, respuesta HTTP, IP y campos involucrados."],
    canViewMetrics && [BarChart3, "Analizar", "Revisa tendencias, efectividad y módulos con mayor actividad."],
    canDownloadExcel && [FileSpreadsheet, "Exportar", "Descarga en Excel todos los eventos que coinciden con los filtros."],
  ].filter(Boolean);

  return (
    <div className="module-page-enter mx-auto max-w-7xl pb-10">
      <style>{`
        @keyframes manualPanelEnter {
          from { opacity: 0; transform: translateY(14px) scale(0.988); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes manualPanelContentEnter {
          from { opacity: 0; transform: translateY(7px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .manual-panel-enter { transform-origin: top center; animation: manualPanelEnter 420ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        .manual-panel-enter > * { animation: manualPanelContentEnter 360ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        .manual-panel-enter > *:nth-child(2) { animation-delay: 70ms; }
        @media (prefers-reduced-motion: reduce) {
          .manual-panel-enter, .manual-panel-enter > * { animation: none; }
        }
      `}</style>

      <button type="button" onClick={returnToList} className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        Volver a bitácora
      </button>

      <header className="relative mb-5 overflow-hidden rounded-2xl border border-emerald-900/10 bg-[#244C34] text-white shadow-sm">
        <div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-emerald-300/10" />
        <div className="absolute -right-4 -bottom-24 h-52 w-52 rounded-full border border-white/10" />
        <div className="relative grid gap-6 px-6 py-7 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10"><BookOpen className="h-6 w-6" strokeWidth={1.8} /></div>
            <p className="text-xs font-bold tracking-[0.14em] text-emerald-200 uppercase">Guía de uso</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Manual del módulo de bitácora</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80">Esta guía se adapta a los permisos de tu rol y muestra únicamente las funciones disponibles para tu cuenta.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm"><p className="text-xs font-semibold text-emerald-100">Tiempo estimado</p><p className="mt-1 text-lg font-bold">4 minutos</p></div>
        </div>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.03)] lg:sticky lg:top-3">
          <p className="px-3 pt-2 pb-3 text-[11px] font-bold tracking-[0.1em] text-slate-400 uppercase">Contenido</p>
          <nav className="space-y-1" aria-label="Contenido del manual" role="tablist">
            {sections.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" role="tab" aria-selected={currentSection === id} aria-controls={id} onClick={() => setActiveSection(id)} className={`group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${currentSection === id ? "translate-x-0.5 bg-emerald-50 text-emerald-800 shadow-[inset_3px_0_0_#2D5A3D]" : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"}`}>
                <Icon className={`h-4 w-4 shrink-0 ${currentSection === id ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-600"}`} strokeWidth={1.8} />
                <span className="min-w-0 flex-1">{label}</span>
                <ChevronRight className={`h-3.5 w-3.5 ${currentSection === id ? "text-emerald-500" : "text-slate-300"}`} />
              </button>
            ))}
          </nav>
        </aside>

        <main key={currentSection} className="min-w-0 space-y-5">
          <section id="vista-general" role="tabpanel" className={`${cardClass} ${currentSection !== "vista-general" ? "hidden" : ""}`}>
            <SectionHeader icon={ScrollText} eyebrow={eyebrow("vista-general", "Vista general")} title="¿Qué puedes hacer en este módulo?" description="La bitácora concentra la trazabilidad de las operaciones institucionales realizadas en Sembria." />
            <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
              {overviewItems.map(([Icon, title, description]) => <div key={title} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"><Icon className="h-5 w-5 text-emerald-700" strokeWidth={1.8} /><h3 className="mt-3 text-sm font-semibold text-slate-800">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div>)}
            </div>
            <div className="px-5 pb-5 sm:px-6 sm:pb-6"><Tip tone="blue">Tu alcance actual es <strong>{globalScope ? "global" : "por área"}</strong>. {globalScope ? "Puedes consultar eventos de todas las áreas." : "Solo puedes consultar eventos vinculados con tu área institucional."}</Tip></div>
          </section>

          <section id="buscar-filtrar" role="tabpanel" className={`${cardClass} ${currentSection !== "buscar-filtrar" ? "hidden" : ""}`}>
            <SectionHeader icon={ListFilter} eyebrow={eyebrow("buscar-filtrar", "Buscar y filtrar")} title="Encuentra un evento rápidamente" description="Los filtros se pueden combinar para reducir el listado a las operaciones relevantes." color="blue" />
            <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[1fr_0.9fr]">
              <div className="space-y-4">
                <Step number="1" title="Escribe una referencia">Busca por nombre, correo, descripción, tipo o identificador de la entidad.</Step>
                <Step number="2" title="Combina criterios">Selecciona módulo, acción y resultado; también puedes limitar la consulta con las fechas desde y hasta.</Step>
                <Step number="3" title="Restablece la vista">Presiona <strong>Limpiar filtros</strong> para regresar al listado sin criterios aplicados.</Step>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500"><Filter className="h-4 w-4" /> Ejemplo de búsqueda</div>
                <div className="space-y-2.5"><div className="flex h-10 items-center gap-2 rounded-xl border border-emerald-300 bg-white px-3 text-sm text-slate-600 ring-4 ring-emerald-500/10"><Search className="h-4 w-4 text-slate-400" /> Ana Admin</div><div className="grid grid-cols-2 gap-2"><span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">Módulo: áreas</span><span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">Resultado: exitoso</span><span className="col-span-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">Periodo: 01/10/2026 — 31/10/2026</span></div><p className="pt-1 text-[11px] leading-4 text-slate-400">Resultado: operaciones exitosas de Ana dentro del módulo de áreas durante octubre.</p></div>
              </div>
            </div>
          </section>

          <section id="detalle" role="tabpanel" className={`${cardClass} ${currentSection !== "detalle" ? "hidden" : ""}`}>
            <SectionHeader icon={Eye} eyebrow={eyebrow("detalle", "Consultar detalles")} title="Interpreta cada evento" description="El botón de la columna Acciones abre toda la evidencia técnica y funcional disponible." color="violet" />
            <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
              <div className="space-y-4"><Step number="1" title="Identifica al responsable">Revisa su foto, nombre, correo y área institucional. Presiona la fotografía para verla ampliada.</Step><Step number="2" title="Comprueba la operación">La descripción indica qué se creó, editó o cambió y, cuando está disponible, muestra el nombre del integrante o registro afectado. La columna Entidad conserva también su ID para trazabilidad.</Step><Step number="3" title="Revisa la respuesta">Verifica fecha, método, ruta, código HTTP, resultado e IP de origen.</Step><Step number="4" title="Consulta el contexto">Los campos involucrados muestran los nombres modificados, nunca contraseñas ni valores sensibles.</Step></div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3 border-b border-slate-100 pb-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><UserRound className="h-5 w-5" /></span><div><p className="text-sm font-semibold text-slate-800">Ana Admin</p><p className="text-xs text-slate-400">Administración</p></div><span className="ml-auto rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Exitoso</span></div><div className="mt-4 space-y-3 text-xs"><div className="flex justify-between gap-4"><span className="text-slate-400">Acción</span><strong className="text-slate-700">Crear área</strong></div><div className="flex justify-between gap-4"><span className="text-slate-400">Solicitud</span><code className="text-slate-700">POST /api/areas</code></div><div className="flex justify-between gap-4"><span className="text-slate-400">Respuesta</span><strong className="text-emerald-700">HTTP 201</strong></div></div></div>
            </div>
          </section>

          {canViewMetrics && <section id="metricas" role="tabpanel" className={`${cardClass} ${currentSection !== "metricas" ? "hidden" : ""}`}><SectionHeader icon={BarChart3} eyebrow={eyebrow("metricas", "Métricas")} title="Analiza la actividad institucional" description="El botón Métricas abre indicadores calculados dentro del alcance permitido para tu rol." color="blue" /><div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-2"><Step number="1" title="Abre Métricas">Presiona el botón ubicado sobre los filtros del listado.</Step><Step number="2" title="Interpreta los indicadores">Revisa eventos, tasa de éxito, errores, usuarios, actividad diaria, módulos y acciones frecuentes.</Step><Tip tone="blue">Los datos respetan el mismo alcance global o por área que tiene tu permiso de métricas.</Tip></div></section>}

          {canDownloadExcel && <section id="exportar" role="tabpanel" className={`${cardClass} ${currentSection !== "exportar" ? "hidden" : ""}`}><SectionHeader icon={FileSpreadsheet} eyebrow={eyebrow("exportar", "Exportar")} title="Descarga la consulta en Excel" description="La exportación incluye todos los eventos que coinciden con los filtros, no solo la página visible." /><div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center"><div className="space-y-4"><Step number="1" title="Prepara la consulta">Aplica los filtros necesarios antes de iniciar la descarga.</Step><Step number="2" title="Genera el archivo">Presiona <strong>Descargar Excel</strong> y espera la confirmación del sistema.</Step><Tip tone="amber">El reporte puede contener información institucional como correos, rutas e IP. Compártelo únicamente con personas autorizadas.</Tip></div><div className="flex min-w-56 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50/70 p-6"><div className="text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white"><FileSpreadsheet className="h-5 w-5" /></div><p className="mt-3 text-sm font-semibold text-emerald-900">bitacora-fecha.xlsx</p><p className="mt-1 text-xs text-emerald-700/70">Eventos filtrados</p></div></div></div></section>}

          <section id="recomendaciones" role="tabpanel" className={`${cardClass} ${currentSection !== "recomendaciones" ? "hidden" : ""}`}>
            <SectionHeader icon={ShieldCheck} eyebrow={eyebrow("recomendaciones", "Recomendaciones")} title="Consulta la bitácora de forma responsable" description="Estas prácticas ayudan a proteger la trazabilidad y la información institucional." color="amber" />
            <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
              {[[CheckCircle2, "Usa filtros precisos", "Reduce el periodo y selecciona el módulo antes de revisar eventos extensos."], [CalendarDays, "Comprueba la fecha", "Relaciona la hora del evento con la operación que estás investigando."], [Globe2, "Protege la información", "No difundas direcciones IP, correos o archivos exportados fuera del personal autorizado."], [ShieldCheck, "Respeta el alcance", "Las opciones y eventos visibles dependen de los permisos y del área asignada a tu rol."]].map(([Icon, title, text]) => <div key={title} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" strokeWidth={1.8} /><div><p className="text-sm font-semibold text-slate-800">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p></div></div>)}
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><p className="text-sm font-semibold text-slate-800">¿Listo para consultar?</p><p className="mt-1 text-xs text-slate-500">Vuelve al listado y aplica lo aprendido.</p></div><Button type="button" onClick={returnToList} className="h-10 gap-2 rounded-xl bg-[#2D5A3D] px-5 text-white hover:bg-[#234B32]"><ScrollText className="h-4 w-4" /> Ir a bitácora</Button></div>
          </section>
        </main>
      </div>
    </div>
  );
}
