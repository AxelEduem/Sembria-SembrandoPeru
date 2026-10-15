import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  FileSpreadsheet,
  Filter,
  Lightbulb,
  Search,
  ShieldCheck,
  TableProperties,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

const SECTIONS = [
  { id: "vista-general", label: "Vista general", icon: BookOpen },
  { id: "buscar-filtrar", label: "Buscar y filtrar", icon: Search },
  { id: "revisar", label: "Revisar solicitudes", icon: TableProperties },
  { id: "resolver", label: "Aprobar o rechazar", icon: CheckCircle2 },
  { id: "exportar", label: "Exportar a Excel", icon: FileSpreadsheet },
  { id: "recomendaciones", label: "Recomendaciones", icon: Lightbulb },
];

const panelClass =
  "manual-panel-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]";

function SectionHeader({ icon: Icon, eyebrow, title, description, tone = "emerald" }) {
  const tones = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
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

function Tip({ children, warning = false }) {
  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm leading-5 ${
        warning
          ? "border-amber-100 bg-amber-50/70 text-amber-800"
          : "border-emerald-100 bg-emerald-50/70 text-emerald-800"
      }`}
    >
      {warning ? (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.9} />
      ) : (
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.9} />
      )}
      <p>{children}</p>
    </div>
  );
}

export default function SolicitudesCambioHorarioManualPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("vista-general");
  const listSearch = location.state?.listSearch || "";
  const returnToList = () => navigate(`/solicitudes-cambio-horario${listSearch}`);

  return (
    <div className="module-page-enter mx-auto max-w-7xl pb-10">
      <style>{`
        @keyframes manualPanelEnter {
          from { opacity: 0; transform: translateY(14px) scale(0.988); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .manual-panel-enter {
          transform-origin: top center;
          animation: manualPanelEnter 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .manual-panel-enter { animation: none; }
        }
      `}</style>

      <button
        type="button"
        onClick={returnToList}
        className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        Volver a solicitudes de horario
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
              Manual de solicitudes de horario
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80">
              Aprende a consultar, filtrar y resolver las solicitudes de cambio de horario que se
              encuentran dentro de tu alcance institucional.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs font-semibold text-emerald-100">Tiempo estimado</p>
            <p className="mt-1 text-lg font-bold">4 minutos</p>
          </div>
        </div>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.03)] lg:sticky lg:top-3">
          <p className="px-3 pt-2 pb-3 text-[11px] font-bold tracking-[0.1em] text-slate-400 uppercase">
            Contenido
          </p>
          <nav className="space-y-1" aria-label="Contenido del manual" role="tablist">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeSection === id}
                aria-controls={id}
                onClick={() => setActiveSection(id)}
                className={`group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                  activeSection === id
                    ? "translate-x-0.5 bg-emerald-50 text-emerald-800 shadow-[inset_3px_0_0_#2D5A3D]"
                    : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    activeSection === id
                      ? "text-emerald-600"
                      : "text-slate-400 group-hover:text-emerald-600"
                  }`}
                  strokeWidth={1.8}
                />
                <span className="min-w-0 flex-1">{label}</span>
                <ChevronRight
                  className={`h-3.5 w-3.5 ${
                    activeSection === id ? "text-emerald-500" : "text-slate-300"
                  }`}
                />
              </button>
            ))}
          </nav>
        </aside>

        <main key={activeSection} className="min-w-0">
          <section
            id="vista-general"
            role="tabpanel"
            className={`${panelClass} ${activeSection !== "vista-general" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={BookOpen}
              eyebrow="01 · Vista general"
              title="¿Qué puedes hacer en este módulo?"
              description="Centraliza la revisión de las solicitudes enviadas por los integrantes para modificar su horario vigente."
            />
            <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
              {[
                [Search, "Consultar", "Encuentra solicitudes por el nombre del integrante."],
                [Filter, "Filtrar", "Combina estado, periodo, área y cargo para reducir el listado."],
                [CheckCircle2, "Resolver", "Aprueba una propuesta o recházala indicando el motivo."],
                [FileSpreadsheet, "Exportar", "Descarga en Excel todos los resultados filtrados."],
              ].map(([Icon, title, description]) => (
                <div key={title} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <Icon className="h-5 w-5 text-emerald-700" strokeWidth={1.8} />
                  <h3 className="mt-3 text-sm font-semibold text-slate-800">{title}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
                </div>
              ))}
            </div>
            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              <Tip>
                El listado respeta tus permisos y alcance institucional. Si tu cuenta está limitada
                a un área, solo podrás revisar solicitudes de esa área.
              </Tip>
            </div>
          </section>

          <section
            id="buscar-filtrar"
            role="tabpanel"
            className={`${panelClass} ${activeSection !== "buscar-filtrar" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={Search}
              eyebrow="02 · Buscar y filtrar"
              title="Encuentra una solicitud rápidamente"
              description="Los filtros pueden combinarse y permanecen en la URL cuando visitas el manual y regresas."
              tone="blue"
            />
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_0.9fr]">
              <div className="space-y-4">
                <Step number="1" title="Busca una referencia">
                  Escribe el nombre del integrante que deseas consultar.
                </Step>
                <Step number="2" title="Combina los desplegables">
                  Filtra por estado y periodo. También puedes seleccionar un área para mostrar solo
                  sus cargos registrados.
                </Step>
                <Step number="3" title="Restablece la vista">
                  Presiona <strong>Limpiar filtros</strong> para retirar todos los criterios y volver
                  a la primera página.
                </Step>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Filter className="h-4 w-4" /> Ejemplo de filtros
                </p>
                <div className="space-y-2.5">
                  {[
                    [Search, "ana torres"],
                    [Building2, "Comunicaciones"],
                    [BriefcaseBusiness, "Diseño gráfico"],
                    [Clock3, "Pendientes · Últimos 30 días"],
                  ].map(([Icon, value]) => (
                    <div
                      key={value}
                      className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600"
                    >
                      <Icon className="h-4 w-4 text-slate-400" strokeWidth={1.8} />
                      {value}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section
            id="revisar"
            role="tabpanel"
            className={`${panelClass} ${activeSection !== "revisar" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={TableProperties}
              eyebrow="03 · Revisar solicitudes"
              title="Comprueba la información antes de resolver"
              description="La tabla comienza directamente con sus encabezados y cada fila reúne los datos necesarios para evaluar el cambio propuesto."
              tone="violet"
            />
            <div className="p-5 sm:p-6">
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ["Integrante", "Nombre, fotografía, área y cargo asociados al periodo actual. La fotografía se puede presionar para ampliarla."],
                  ["Solicitud", "Número, fecha de envío, fecha efectiva y motivo declarado."],
                  ["Horario propuesto", "Días y rangos horarios que reemplazarán al horario vigente."],
                  ["Estado", "Pendiente, aprobada, rechazada o cancelada, con su resolución."],
                  ["Acciones", "Abre el menú de tres puntos para aprobar o rechazar solicitudes pendientes."],
                ].map(([title, text], index) => (
                  <div key={title} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-xs font-bold text-violet-700">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Tip warning>
                  Confirma especialmente la fecha efectiva y todos los bloques. Una aprobación
                  aplica el nuevo horario y modifica el periodo vigente del integrante.
                </Tip>
              </div>
            </div>
          </section>

          <section
            id="resolver"
            role="tabpanel"
            className={`${panelClass} ${activeSection !== "resolver" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={CheckCircle2}
              eyebrow="04 · Aprobar o rechazar"
              title="Resuelve las solicitudes pendientes"
              description="Las acciones solo aparecen mientras la solicitud conserva el estado Pendiente."
              tone="amber"
            />
            <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-5">
                <CheckCircle2 className="h-6 w-6 text-emerald-700" strokeWidth={1.8} />
                <h3 className="mt-3 text-sm font-semibold text-emerald-900">Aprobar</h3>
                <p className="mt-2 text-xs leading-5 text-emerald-800/75">
                  Muestra un modal de confirmación con el nombre del integrante. Al confirmar,
                  aplica el horario propuesto desde la fecha efectiva y registra el nuevo periodo.
                </p>
              </div>
              <div className="rounded-xl border border-red-100 bg-red-50/60 p-5">
                <XCircle className="h-6 w-6 text-red-700" strokeWidth={1.8} />
                <h3 className="mt-3 text-sm font-semibold text-red-900">Rechazar</h3>
                <p className="mt-2 text-xs leading-5 text-red-800/75">
                  Abre un modal para registrar el motivo obligatorio. El horario vigente no cambia
                  y la observación queda disponible en la solicitud.
                </p>
              </div>
              <div className="md:col-span-2">
                <Tip warning>
                  Una solicitud ya resuelta no puede aprobarse o rechazarse nuevamente. Si ocurre un
                  error, el sistema conserva su estado anterior y muestra el mensaje correspondiente.
                </Tip>
              </div>
            </div>
          </section>

          <section
            id="exportar"
            role="tabpanel"
            className={`${panelClass} ${activeSection !== "exportar" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={FileSpreadsheet}
              eyebrow="05 · Exportar"
              title="Descarga las solicitudes en Excel"
              description="El archivo incluye todos los resultados de los filtros activos, no solo la página visible."
            />
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="space-y-4">
                <Step number="1" title="Prepara el listado">
                  Selecciona el estado, periodo, área o cargo que necesites incluir en el reporte.
                </Step>
                <Step number="2" title="Descarga el archivo">
                  Presiona <strong>Descargar Excel</strong>. El reporte incluye integrante, área,
                  cargo, fechas, estado, motivo, horario propuesto y resolución.
                </Step>
              </div>
              <div className="flex min-w-60 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50/70 p-6">
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
                    <Download className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-emerald-900">
                    solicitudes_cambio_horario.xlsx
                  </p>
                  <p className="mt-1 text-xs text-emerald-700/70">Resultados filtrados</p>
                </div>
              </div>
            </div>
          </section>

          <section
            id="recomendaciones"
            role="tabpanel"
            className={`${panelClass} ${activeSection !== "recomendaciones" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={ShieldCheck}
              eyebrow="06 · Recomendaciones"
              title="Buenas prácticas para resolver solicitudes"
              description="Estas verificaciones ayudan a evitar cambios de horario incorrectos."
              tone="blue"
            />
            <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
              {[
                [Clock3, "Revisa los bloques", "Comprueba que no existan rangos equivocados o incompletos."],
                [Building2, "Confirma el alcance", "Asegúrate de gestionar únicamente solicitudes de las áreas asignadas."],
                [CheckCircle2, "Valida la fecha", "Verifica desde qué día debe comenzar a aplicarse el nuevo horario."],
                [XCircle, "Explica el rechazo", "Escribe una observación clara para que el integrante comprenda la decisión."],
              ].map(([Icon, title, text]) => (
                <div key={title} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
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
                <p className="mt-1 text-xs text-slate-500">Vuelve al listado y revisa las solicitudes pendientes.</p>
              </div>
              <Button
                type="button"
                onClick={returnToList}
                className="h-10 gap-2 rounded-xl bg-[#2D5A3D] px-5 text-white hover:bg-[#234B32]"
              >
                <TableProperties className="h-4 w-4" /> Ir a solicitudes
              </Button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
