import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Building2,
  CakeSlice,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  Lightbulb,
  List,
  MapPin,
  Printer,
  Search,
  Sparkles,
  UserRound,
  Users2,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission, PERMISSIONS } from "@/utils/permissions";

const sections = [
  { id: "vista-general", label: "Vista general", icon: BookOpen },
  { id: "filtros", label: "Buscar y filtrar", icon: Filter },
  { id: "indicadores", label: "Consultar métricas", icon: BarChart3, permission: "metrics" },
  { id: "vistas", label: "Lista y calendario", icon: CalendarRange },
  { id: "resumen", label: "Próximos cumpleaños", icon: CakeSlice },
  { id: "exportar", label: "Exportar e imprimir", icon: Printer, permission: "actions" },
  { id: "recomendaciones", label: "Recomendaciones", icon: Lightbulb },
];

const cardClass =
  "birthday-manual-panel-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]";

function SectionHeader({ icon: Icon, number, title, description, tone = "rose" }) {
  const tones = {
    rose: "border-rose-100 bg-rose-50 text-rose-600",
    amber: "border-amber-100 bg-amber-50 text-amber-600",
    blue: "border-blue-100 bg-blue-50 text-blue-600",
    violet: "border-violet-100 bg-violet-50 text-violet-600",
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
          <p className="text-[11px] font-bold tracking-[0.12em] text-rose-600 uppercase">
            {number}
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
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-600 text-xs font-bold text-white">
        {number}
      </span>
      <div className="pt-0.5">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">{children}</p>
      </div>
    </div>
  );
}

function Tip({ children, tone = "rose" }) {
  const tones = {
    rose: "border-rose-100 bg-rose-50/70 text-rose-800",
    amber: "border-amber-100 bg-amber-50/70 text-amber-800",
    blue: "border-blue-100 bg-blue-50/70 text-blue-800",
  };

  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 ${tones[tone]}`}>
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.9} />
      <p className="text-sm leading-5">{children}</p>
    </div>
  );
}

function PreviewField({ icon: Icon, label, value }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold text-slate-500">{label}</p>
      <div className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        {value}
      </div>
    </div>
  );
}

function CalendarPreview() {
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const dates = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
        <p className="text-xs font-semibold text-slate-700">Septiembre 2026</p>
        <div className="flex gap-1">
          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200">
            <ChevronLeft className="h-3 w-3 text-slate-400" />
          </span>
          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200">
            <ChevronRight className="h-3 w-3 text-slate-400" />
          </span>
        </div>
      </div>
      <div className="grid grid-cols-7 bg-slate-50">
        {days.map((day) => (
          <div key={day} className="py-2 text-center text-[8px] font-bold text-slate-400 uppercase">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {dates.map((date) => (
          <div
            key={date}
            className="min-h-12 border-t border-r border-slate-100 p-1 last:border-r-0"
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-semibold ${
                date === 8 ? "bg-rose-600 text-white" : "text-slate-500"
              }`}
            >
              {date}
            </span>
            {date === 4 || date === 10 ? (
              <div className="mt-1 truncate rounded bg-rose-50 px-1 py-0.5 text-[7px] font-semibold text-rose-600">
                🎂 Integrante
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CumpleanosManualPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState("vista-general");
  const listSearch = location.state?.listSearch || "";
  const canDownloadExcel = hasPermission(
    profile,
    PERMISSIONS.CUMPLEANOS_DESCARGAR_EXCEL,
  );
  const canViewMetrics = hasPermission(profile, PERMISSIONS.CUMPLEANOS_VER_METRICAS);
  const canPrintSchedule = hasPermission(
    profile,
    PERMISSIONS.CUMPLEANOS_IMPRIMIR_HORARIO,
  );
  const canUseExportTools = canDownloadExcel || canPrintSchedule;
  const visibleSections = sections.filter((section) => {
    if (section.permission === "metrics") return canViewMetrics;
    if (section.permission === "actions") return canUseExportTools;
    return true;
  });

  const returnToModule = () => navigate(`/cumpleanos${listSearch}`);

  return (
    <div className="module-page-enter mx-auto max-w-7xl pb-10">
      <style>{`
        @keyframes birthdayManualPanelEnter {
          from { opacity: 0; transform: translateY(14px) scale(.988); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes birthdayManualContentEnter {
          from { opacity: 0; transform: translateY(7px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .birthday-manual-panel-enter {
          transform-origin: top center;
          animation: birthdayManualPanelEnter 420ms cubic-bezier(.22,1,.36,1) both;
        }
        .birthday-manual-panel-enter > * {
          animation: birthdayManualContentEnter 360ms cubic-bezier(.22,1,.36,1) both;
        }
        .birthday-manual-panel-enter > *:nth-child(2) { animation-delay: 70ms; }
        @media (prefers-reduced-motion: reduce) {
          .birthday-manual-panel-enter,
          .birthday-manual-panel-enter > * { animation: none; }
        }
      `}</style>

      <button
        type="button"
        onClick={returnToModule}
        className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        Volver a cumpleaños
      </button>

      <header className="relative mb-5 overflow-hidden rounded-2xl border border-rose-900/10 bg-gradient-to-br from-[#8F2847] to-[#B6385D] text-white shadow-sm">
        <div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-rose-200/10" />
        <div className="absolute -right-5 -bottom-24 h-52 w-52 rounded-full border border-white/10" />
        <Sparkles className="absolute top-8 right-12 h-5 w-5 text-rose-200/50" />
        <div className="relative grid gap-6 px-6 py-7 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10">
              <CakeSlice className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <p className="text-xs font-bold tracking-[0.14em] text-rose-100 uppercase">
              Guía de uso
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Manual del módulo de cumpleaños
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-rose-50/80">
              Aprende a identificar los próximos cumpleaños, consultar el calendario y preparar
              reportes para organizar cada celebración.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs font-semibold text-rose-100">Tiempo estimado</p>
            <p className="mt-1 text-lg font-bold">4 minutos</p>
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
                aria-selected={activeSection === id}
                aria-controls={`birthday-manual-${id}`}
                onClick={() => setActiveSection(id)}
                className={`group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                  activeSection === id
                    ? "translate-x-0.5 bg-rose-50 text-rose-800 shadow-[inset_3px_0_0_#E11D48]"
                    : "text-slate-600 hover:bg-rose-50 hover:text-rose-800"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${activeSection === id ? "text-rose-600" : "text-slate-400 group-hover:text-rose-500"}`}
                  strokeWidth={1.8}
                />
                <span className="min-w-0 flex-1">{label}</span>
                <ChevronRight
                  className={`h-3.5 w-3.5 ${activeSection === id ? "text-rose-500" : "text-slate-300"}`}
                />
              </button>
            ))}
          </nav>
        </aside>

        <main key={activeSection} className="min-w-0">
          <section
            id="birthday-manual-vista-general"
            role="tabpanel"
            className={`${cardClass} ${activeSection !== "vista-general" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={CakeSlice}
              number="01 · Vista general"
              title="¿Para qué sirve este módulo?"
              description="Centraliza los cumpleaños próximos de voluntarios, practicantes y gerentes activos."
            />
            <div className="p-5 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  [Search, "Localizar", "Encuentra a una persona por su nombre."],
                  [CalendarDays, "Planificar", "Consulta fechas próximas o un mes específico."],
                  ...(canViewMetrics
                    ? [
                        [
                          BarChart3,
                          "Analizar",
                          "Abre Métricas para revisar indicadores por área, mes y tipo.",
                        ],
                      ]
                    : []),
                  ...(canUseExportTools
                    ? [
                        [
                          Printer,
                          "Compartir",
                          canDownloadExcel && canPrintSchedule
                            ? "Descarga Excel o imprime el calendario mensual."
                            : canDownloadExcel
                              ? "Descarga los resultados en Excel."
                              : "Imprime el calendario mensual.",
                        ],
                      ]
                    : []),
                ].map(([Icon, title, text]) => (
                  <div
                    key={title}
                    className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"
                  >
                    <Icon className="h-5 w-5 text-rose-600" strokeWidth={1.8} />
                    <p className="mt-3 text-sm font-semibold text-slate-800">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-3">
                <Tip tone="blue">
                  Solo aparecen integrantes activos con una fecha de nacimiento registrada. Los
                  datos respetan el área permitida para tu cuenta.
                </Tip>
                <Tip>
                  Este módulo es informativo: si una fecha está equivocada, debes corregirla desde
                  la edición del integrante.
                </Tip>
              </div>
            </div>
          </section>

          <section
            id="birthday-manual-filtros"
            role="tabpanel"
            className={`${cardClass} ${activeSection !== "filtros" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={Filter}
              number="02 · Buscar y filtrar"
              title="Define qué cumpleaños necesitas ver"
              description="Combina el rango de días con la búsqueda, el área y el tipo de integrante."
              tone="blue"
            />
            <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[1fr_0.9fr]">
              <div className="space-y-4">
                <Step number="1" title="Selecciona un periodo">
                  Elige 15, 30, 60 o 90 días para planificar a corto plazo. Usa{" "}
                  <strong>Todos</strong> para consultar los siguientes 365 días.
                </Step>
                <Step number="2" title="Refina la consulta">
                  Busca por nombre y, si lo necesitas, filtra por área o por tipo: voluntario,
                  practicante o gerente.
                </Step>
                <Step number="3" title="Vuelve al estado inicial">
                  Presiona <strong>Limpiar filtros</strong> para mostrar nuevamente todos los
                  cumpleaños del año.
                </Step>
                <Tip tone="blue">
                  Los filtros quedan reflejados en la dirección de la página y se conservan al
                  volver desde el manual.
                </Tip>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="mb-3 text-xs font-semibold text-slate-500">
                  Ejemplo: celebración del próximo mes
                </p>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {[15, 30, 60, 90].map((day) => (
                    <span
                      key={day}
                      className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold ${day === 30 ? "border-rose-600 bg-rose-600 text-white" : "border-slate-200 bg-white text-slate-500"}`}
                    >
                      {day} días
                    </span>
                  ))}
                </div>
                <div className="space-y-2.5">
                  <PreviewField icon={Search} label="Nombre" value="María" />
                  <div className="grid grid-cols-2 gap-2.5">
                    <PreviewField icon={MapPin} label="Área" value="Comunicaciones" />
                    <PreviewField icon={Users2} label="Tipo" value="Practicante" />
                  </div>
                </div>
                <p className="mt-3 text-[11px] leading-4 text-slate-400">
                  {canDownloadExcel
                    ? "La lista y el Excel utilizarán este resultado."
                    : "La lista utilizará este resultado."}
                </p>
              </div>
            </div>
          </section>

          {canViewMetrics && (
            <section
              id="birthday-manual-indicadores"
              role="tabpanel"
              className={`${cardClass} ${activeSection !== "indicadores" ? "hidden" : ""}`}
            >
              <SectionHeader
                icon={BarChart3}
                number="03 · Métricas"
                title="Analiza los cumpleaños registrados"
                description="El botón Métricas abre los indicadores y distribuciones del módulo."
                tone="violet"
              />
              <div className="p-5 sm:p-6">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    [CalendarDays, "Este mes", "Cantidad dentro del mes calendario actual.", "12"],
                    [CalendarRange, "Esta semana", "Cantidad dentro de la semana actual.", "4"],
                    [CakeSlice, "Hoy", "Personas que cumplen años hoy.", "1"],
                    [
                      Building2,
                      "Área principal",
                      "Área con más cumpleaños entre los resultados.",
                      "Comunicaciones",
                    ],
                  ].map(([Icon, title, text, value]) => (
                    <div
                      key={title}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <Icon className="h-4 w-4 text-rose-500" />
                        <span className="text-lg font-bold text-slate-900">{value}</span>
                      </div>
                      <p className="mt-3 text-xs font-semibold text-slate-700">{title}</p>
                      <p className="mt-1 text-[11px] leading-4 text-slate-400">{text}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5">
                  <Tip tone="blue">
                    Desde la parte superior de Cumpleaños, presiona <strong>Métricas</strong>. Allí
                    también puedes revisar la distribución por mes, área y tipo de integrante.
                  </Tip>
                </div>
              </div>
            </section>
          )}

          <section
            id="birthday-manual-vistas"
            role="tabpanel"
            className={`${cardClass} ${activeSection !== "vistas" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={CalendarRange}
              number="04 · Lista y calendario"
              title="Elige la vista apropiada para tu tarea"
              description="Cambia entre una lista priorizada y una distribución mensual."
              tone="rose"
            />
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
              <div>
                <div className="mb-4 flex w-fit rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <span className="flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-[11px] font-semibold text-slate-800 shadow-sm">
                    <List className="h-3.5 w-3.5" /> Lista
                  </span>
                  <span className="flex h-8 items-center gap-1.5 px-3 text-[11px] font-semibold text-slate-400">
                    <CalendarRange className="h-3.5 w-3.5" /> Calendario
                  </span>
                </div>
                <div className="space-y-4">
                  <Step number="1" title="Vista Lista">
                    Ordena los cumpleaños desde el más próximo. Muestra nombre, tipo de integrante,
                    área, fecha, edad que cumplirá y cuenta regresiva. Presiona una fotografía para
                    ampliarla.
                  </Step>
                  <Step number="2" title="Paginación">
                    Presenta diez registros por página. Usa Anterior y Siguiente para recorrer todos
                    los resultados.
                  </Step>
                  <Step number="3" title="Vista Calendario">
                    Ubica cada nombre en su día del mes. Usa las flechas para cambiar de mes o{" "}
                    <strong>Hoy</strong> para regresar al mes actual.
                  </Step>
                </div>
              </div>
              <CalendarPreview />
            </div>
          </section>

          <section
            id="birthday-manual-resumen"
            role="tabpanel"
            className={`${cardClass} ${activeSection !== "resumen" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={CakeSlice}
              number="05 · Panel lateral"
              title="Anticípate con el resumen de próximos cumpleaños"
              description="El costado derecho destaca las fechas más cercanas."
              tone="amber"
            />
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-2xl border border-rose-100 bg-gradient-to-b from-white to-rose-50/40 p-5 text-center shadow-[0_8px_30px_rgba(244,63,94,0.08)]">
                <div className="flex items-center justify-between text-left">
                  <div>
                    <p className="text-[9px] font-bold tracking-wider text-rose-400 uppercase">
                      Próximo destacado
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-800">Vista rápida</p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-semibold text-amber-700">
                    En 3 días
                  </span>
                </div>
                <div className="mx-auto mt-5 flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 text-4xl">
                  🎂
                </div>
                <p className="mt-3 text-sm font-bold text-slate-900">María Torres</p>
                <p className="mt-1 text-[10px] text-slate-500">Comunicaciones · Diseño</p>
              </div>
              <div className="space-y-4">
                <Step number="1" title="Próximo destacado">
                  Presenta a la persona con la fecha más cercana, su área, cargo, fecha y edad. Si
                  cumple hoy, muestra un aviso de celebración.
                </Step>
                <Step number="2" title="Los siguientes tres">
                  Permite revisar rápidamente quiénes siguen después del cumpleaños destacado.
                </Step>
                <Tip>
                  Usa este panel para organizar saludos, comunicados o celebraciones con
                  anticipación.
                </Tip>
              </div>
            </div>
          </section>

          {canUseExportTools && (
            <section
              id="birthday-manual-exportar"
              role="tabpanel"
              className={`${cardClass} ${activeSection !== "exportar" ? "hidden" : ""}`}
            >
              <SectionHeader
                icon={Printer}
                number="06 · Exportar e imprimir"
                title="Comparte la información disponible"
                description="El manual muestra únicamente las acciones habilitadas para tu rol."
                tone="blue"
              />
              <div
                className={`grid gap-4 p-5 sm:p-6 ${
                  canDownloadExcel && canPrintSchedule ? "sm:grid-cols-2" : "sm:grid-cols-1"
                }`}
              >
                {canDownloadExcel && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-emerald-900">
                      Descargar Excel
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-emerald-800/75">
                      Exporta todos los resultados filtrados con nombre, área, cargo, fecha, edad y
                      días restantes. El archivo se llama <strong>cumpleanos.xls</strong>.
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm">
                      <Download className="h-3.5 w-3.5" /> cumpleanos.xls
                    </div>
                  </div>
                )}
                {canPrintSchedule && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                      <Printer className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-blue-900">Imprimir Horario</h3>
                    <p className="mt-2 text-xs leading-5 text-blue-800/75">
                      Cambia automáticamente a la vista calendario y abre la impresión del mes
                      seleccionado con formato institucional.
                    </p>
                    <p className="mt-4 text-[11px] font-medium text-blue-700">
                      Selecciona primero el mes que quieres imprimir.
                    </p>
                  </div>
                )}
                <div>
                  <Tip tone="amber">
                    {canDownloadExcel && canPrintSchedule
                      ? "El Excel incluye todo el rango filtrado; la impresión corresponde únicamente al mes visible en el calendario."
                      : canDownloadExcel
                        ? "El Excel incluye todo el rango y los filtros aplicados."
                        : "La impresión corresponde únicamente al mes visible en el calendario."}
                  </Tip>
                </div>
              </div>
            </section>
          )}

          <section
            id="birthday-manual-recomendaciones"
            role="tabpanel"
            className={`${cardClass} ${activeSection !== "recomendaciones" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={Lightbulb}
              number="07 · Recomendaciones"
              title="Buenas prácticas para una planificación confiable"
              description="Pequeñas comprobaciones ayudan a evitar fechas o reportes incorrectos."
              tone="amber"
            />
            <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
              {[
                ...(canDownloadExcel
                  ? [
                      [
                        CheckCircle2,
                        "Verifica los filtros",
                        "Antes de exportar, confirma el periodo, área y tipo seleccionados.",
                      ],
                    ]
                  : []),
                [
                  Clock3,
                  "Planifica con anticipación",
                  "Usa los rangos de 15 o 30 días para preparar las celebraciones próximas.",
                ],
                ...(canPrintSchedule
                  ? [
                      [
                        Eye,
                        "Revisa el mes",
                        "Antes de imprimir, confirma el nombre del mes mostrado en el calendario.",
                      ],
                    ]
                  : []),
                [
                  UserRound,
                  "Corrige en Integrantes",
                  "Las fechas de nacimiento se administran desde el perfil de cada integrante.",
                ],
              ].map(([Icon, title, text]) => (
                <div
                  key={title}
                  className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                >
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" strokeWidth={1.8} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <p className="text-sm font-semibold text-slate-800">¿Listo para planificar?</p>
                <p className="mt-1 text-xs text-slate-500">
                  Vuelve al módulo y consulta los próximos cumpleaños.
                </p>
              </div>
              <Button
                type="button"
                onClick={returnToModule}
                className="h-10 gap-2 rounded-xl bg-rose-600 px-5 text-white hover:bg-rose-700"
              >
                <CakeSlice className="h-4 w-4" /> Ir a cumpleaños
              </Button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
