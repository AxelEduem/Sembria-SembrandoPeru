import {
  ArrowLeft,
  BookOpen,
  Building2,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  Filter,
  FileSpreadsheet,
  Lightbulb,
  ListFilter,
  Mail,
  Search,
  Table2,
  UserRound,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

const sections = [
  { id: "vista-general", label: "Vista general", icon: BookOpen },
  { id: "buscar-filtrar", label: "Buscar y filtrar", icon: Filter },
  { id: "exportar", label: "Exportar a Excel", icon: FileSpreadsheet },
  { id: "tarjetas", label: "Leer los horarios", icon: CalendarDays },
  { id: "area", label: "Horario por área", icon: Building2 },
  { id: "vistas-area", label: "Vista semanal y tabla", icon: CalendarRange },
  { id: "recomendaciones", label: "Recomendaciones", icon: Lightbulb },
];

const cardClass =
  "schedule-manual-panel-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]";

function SectionHeader({ icon: Icon, number, title, description, tone = "emerald" }) {
  const tones = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    violet: "border-violet-100 bg-violet-50 text-violet-700",
  };

  return (
    <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
      <div className="flex items-start gap-3.5">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${tones[tone]}`}>
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-[11px] font-bold tracking-[0.12em] text-emerald-700 uppercase">{number}</p>
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
      <div className="pt-0.5">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">{children}</p>
      </div>
    </div>
  );
}

function Tip({ children, tone = "emerald" }) {
  const tones = {
    emerald: "border-emerald-100 bg-emerald-50/70 text-emerald-800",
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

function FilterPreview({ icon: Icon, label }) {
  return (
    <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-500">
      <Icon className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.8} />
      {label}
    </div>
  );
}

export default function HorarioManualPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("vista-general");
  const listSearch = location.state?.listSearch || "";
  const returnToModule = () => navigate(`/horario${listSearch}`);

  return (
    <div className="module-page-enter mx-auto max-w-7xl pb-10">
      <style>{`
        @keyframes scheduleManualPanelEnter {
          from { opacity: 0; transform: translateY(14px) scale(.988); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes scheduleManualContentEnter {
          from { opacity: 0; transform: translateY(7px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .schedule-manual-panel-enter {
          transform-origin: top center;
          animation: scheduleManualPanelEnter 420ms cubic-bezier(.22,1,.36,1) both;
        }
        .schedule-manual-panel-enter > * {
          animation: scheduleManualContentEnter 360ms cubic-bezier(.22,1,.36,1) both;
        }
        .schedule-manual-panel-enter > *:nth-child(2) { animation-delay: 70ms; }
        @media (prefers-reduced-motion: reduce) {
          .schedule-manual-panel-enter,
          .schedule-manual-panel-enter > * { animation: none; }
        }
      `}</style>

      <button
        type="button"
        onClick={returnToModule}
        className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        Volver a horario
      </button>

      <header className="relative mb-5 overflow-hidden rounded-2xl border border-emerald-900/10 bg-[#244C34] text-white shadow-sm">
        <div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-emerald-300/10" />
        <div className="absolute -right-4 -bottom-24 h-52 w-52 rounded-full border border-white/10" />
        <div className="relative grid gap-6 px-6 py-7 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10">
              <Clock3 className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <p className="text-xs font-bold tracking-[0.14em] text-emerald-200 uppercase">Guía de uso</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Manual del módulo de horario</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80">
              Aprende a localizar integrantes, revisar su programación semanal y analizar la disponibilidad de cada área.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs font-semibold text-emerald-100">Tiempo estimado</p>
            <p className="mt-1 text-lg font-bold">4 minutos</p>
          </div>
        </div>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[245px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.03)] lg:sticky lg:top-3">
          <p className="px-3 pt-2 pb-3 text-[11px] font-bold tracking-[0.1em] text-slate-400 uppercase">Contenido</p>
          <nav className="space-y-1" aria-label="Contenido del manual" role="tablist">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeSection === id}
                aria-controls={`schedule-manual-${id}`}
                onClick={() => setActiveSection(id)}
                className={`group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                  activeSection === id
                    ? "translate-x-0.5 bg-emerald-50 text-emerald-800 shadow-[inset_3px_0_0_#2D5A3D]"
                    : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${activeSection === id ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-600"}`} strokeWidth={1.8} />
                <span className="min-w-0 flex-1">{label}</span>
                <ChevronRight className={`h-3.5 w-3.5 ${activeSection === id ? "text-emerald-500" : "text-slate-300"}`} />
              </button>
            ))}
          </nav>
        </aside>

        <main key={activeSection} className="min-w-0">
          <section id="schedule-manual-vista-general" role="tabpanel" className={`${cardClass} ${activeSection !== "vista-general" ? "hidden" : ""}`}>
            <SectionHeader icon={Clock3} number="01 · Vista general" title="¿Para qué sirve este módulo?" description="Centraliza los horarios institucionales activos de voluntarios, practicantes y gerentes." />
            <div className="p-5 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  [Search, "Localizar", "Busca por nombre o correo institucional."],
                  [Filter, "Segmentar", "Combina tipo, área, cargo y horas semanales."],
                  [CalendarDays, "Consultar", "Revisa los bloques asignados de cada persona."],
                  [Building2, "Analizar", "Compara la cobertura semanal de un área."],
                  [FileSpreadsheet, "Exportar", "Descarga todos los horarios disponibles en Excel."],
                ].map(([Icon, title, text]) => (
                  <div key={title} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                    <Icon className="h-5 w-5 text-emerald-700" strokeWidth={1.8} />
                    <p className="mt-3 text-sm font-semibold text-slate-800">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
                  <ListFilter className="h-5 w-5 text-emerald-700" />
                  <p className="mt-2 text-sm font-semibold text-slate-800">Todos los horarios</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Vista individual con datos, total de horas y bloques de lunes a sábado.</p>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                  <Building2 className="h-5 w-5 text-blue-700" />
                  <p className="mt-2 text-sm font-semibold text-slate-800">Horario por área</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Vista conjunta para reconocer coincidencias y cobertura del equipo.</p>
                </div>
              </div>
            </div>
          </section>

          <section id="schedule-manual-buscar-filtrar" role="tabpanel" className={`${cardClass} ${activeSection !== "buscar-filtrar" ? "hidden" : ""}`}>
            <SectionHeader icon={Filter} number="02 · Buscar y filtrar" title="Encuentra el horario que necesitas" description="Los filtros de la vista general se pueden combinar y permanecen reflejados en la dirección de la página." tone="blue" />
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_1.05fr]">
              <div className="space-y-4">
                <Step number="1" title="Escribe un nombre o correo">La búsqueda muestra coincidencias mientras escribes.</Step>
                <Step number="2" title="Selecciona los criterios">Filtra por voluntarios, practicantes o gerentes, área, cargo y rango de horas.</Step>
                <Step number="3" title="Limpia cuando termines">Usa <strong>Limpiar filtros</strong> para volver al listado completo.</Step>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="sm:col-span-2"><FilterPreview icon={Search} label="Buscar por nombre o correo..." /></div>
                  <FilterPreview icon={Users} label="Tipo de integrante" />
                  <FilterPreview icon={Building2} label="Área" />
                  <FilterPreview icon={UserRound} label="Cargo" />
                  <FilterPreview icon={Clock3} label="Rango de horas" />
                </div>
              </div>
              <div className="lg:col-span-2"><Tip>Al seleccionar un área, el selector de cargos se limita a los cargos que pertenecen a ella.</Tip></div>
            </div>
          </section>

          <section id="schedule-manual-exportar" role="tabpanel" className={`${cardClass} ${activeSection !== "exportar" ? "hidden" : ""}`}>
            <SectionHeader icon={FileSpreadsheet} number="03 · Exportar a Excel" title="Descarga el horario institucional completo" description="El archivo reúne todos los integrantes y sus bloques semanales, sin limitarse a la página visible." tone="emerald" />
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
              <div className="space-y-4">
                <Step number="1" title="Espera a que termine la carga">El botón se habilita cuando todos los horarios disponibles para tu alcance se encuentran listos.</Step>
                <Step number="2" title="Descarga el archivo">Presiona <strong>Descargar Excel</strong> en la parte superior del módulo.</Step>
                <Step number="3" title="Revisa el reporte">Cada fila incluye integrante, correo, tipo, área, cargo, horas semanales, bloques de lunes a sábado y estado del horario.</Step>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <FileSpreadsheet className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <p className="mt-3 text-sm font-semibold text-emerald-900">horarios_integrantes.xlsx</p>
                <p className="mt-1 text-xs leading-5 text-emerald-700/75">Incluye todos los registros accesibles, aunque la vista esté paginada.</p>
              </div>
            </div>
          </section>

          <section id="schedule-manual-tarjetas" role="tabpanel" className={`${cardClass} ${activeSection !== "tarjetas" ? "hidden" : ""}`}>
            <SectionHeader icon={CalendarDays} number="04 · Leer los horarios" title="Interpreta la tarjeta de cada integrante" description="Cada tarjeta resume la identidad, la asignación institucional y la distribución semanal." />
            <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_1.1fr]">
              <div className="space-y-4">
                <Step number="1" title="Identifica a la persona">La cabecera muestra nombre, correo, tipo de integrante, área y cargo. Presiona su fotografía para verla ampliada.</Step>
                <Step number="2" title="Comprueba el total">El indicador <strong>Horas</strong> resume la carga semanal registrada.</Step>
                <Step number="3" title="Lee cada día">Los bloques verdes indican la hora de inicio y fin. “Sin actividad” significa que no hay un bloque ese día.</Step>
                <Step number="4" title="Cambia de página">Cada página presenta hasta seis personas.</Step>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 font-bold text-emerald-700">AR</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800">Andrea Ramírez</p>
                      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500"><Mail className="h-3 w-3" /> andrea@sembria.org</p>
                      <div className="mt-2 flex gap-1.5"><span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-semibold text-blue-700">Practicante</span><span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] text-slate-600">Comunicaciones</span></div>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2 text-center"><p className="text-[8px] font-bold text-slate-400 uppercase">Horas</p><p className="text-sm font-bold">20 h</p></div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 p-4">
                  {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day, index) => (
                    <div key={day} className="rounded-lg border border-slate-100 bg-slate-50/60 p-2">
                      <p className="text-[9px] font-bold text-slate-500 uppercase">{day}</p>
                      <p className={`mt-2 rounded-md px-1.5 py-1 text-[9px] font-semibold ${index < 5 ? "bg-emerald-50 text-emerald-700" : "text-slate-300"}`}>{index < 5 ? "09:00 — 13:00" : "Sin actividad"}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="schedule-manual-area" role="tabpanel" className={`${cardClass} ${activeSection !== "area" ? "hidden" : ""}`}>
            <SectionHeader icon={Building2} number="05 · Horario por área" title="Analiza la programación de un equipo" description="Esta vista agrupa a las personas que pertenecen a una misma área." tone="violet" />
            <div className="p-5 sm:p-6">
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-4">
                  <Step number="1" title="Cambia de vista">Selecciona <strong>Horario por área</strong> en el control superior.</Step>
                  <Step number="2" title="Elige un área">El horario aparecerá cuando selecciones una opción del listado.</Step>
                  <Step number="3" title="Revisa el resumen">Los indicadores muestran voluntarios, practicantes, gerentes y la suma total de horas.</Step>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <p className="text-[10px] font-bold tracking-wider text-emerald-700 uppercase">Horario por área</p>
                  <p className="mt-1 text-base font-bold text-slate-800">Comunicaciones</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[["Voluntarios", "5"], ["Practicantes", "3"], ["Gerentes", "1"], ["Horas", "92 h"]].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-slate-200 bg-white px-2 py-3 text-center">
                        <p className="text-[8px] font-bold text-slate-400 uppercase">{label}</p><p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-5"><Tip tone="blue">Si un área no tiene horarios registrados, el módulo lo indicará sin mezclar integrantes de otras áreas.</Tip></div>
            </div>
          </section>

          <section id="schedule-manual-vistas-area" role="tabpanel" className={`${cardClass} ${activeSection !== "vistas-area" ? "hidden" : ""}`}>
            <SectionHeader icon={CalendarRange} number="06 · Vista semanal y tabla" title="Elige el nivel de detalle" description="Dentro de un área puedes alternar entre una línea de tiempo visual y una tabla comparativa." tone="blue" />
            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-5">
                <CalendarRange className="h-6 w-6 text-emerald-700" />
                <h3 className="mt-3 text-sm font-semibold text-slate-800">Semanal</h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">Selecciona un día y observa los bloques entre las 08:00 y 18:00. Los horarios coincidentes se agrupan.</p>
                <p className="mt-3 text-xs font-medium text-emerald-800">Haz clic en un bloque para ver a todos sus integrantes.</p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-5">
                <Table2 className="h-6 w-6 text-blue-700" />
                <h3 className="mt-3 text-sm font-semibold text-slate-800">Tabla</h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">Compara nombres, cargos y horas de lunes a sábado en filas. La tabla muestra hasta diez integrantes por página.</p>
              </div>
              <div className="sm:col-span-2"><Tip>Usa la vista semanal para detectar coincidencias y la tabla para comparar rápidamente la programación individual.</Tip></div>
            </div>
          </section>

          <section id="schedule-manual-recomendaciones" role="tabpanel" className={`${cardClass} ${activeSection !== "recomendaciones" ? "hidden" : ""}`}>
            <SectionHeader icon={Lightbulb} number="07 · Recomendaciones" title="Buenas prácticas para una consulta confiable" description="Estas comprobaciones ayudan a interpretar correctamente la información mostrada." tone="amber" />
            <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
              {[
                [CheckCircle2, "Confirma los filtros", "Revisa los criterios activos antes de sacar conclusiones sobre un equipo."],
                [Eye, "Compara las dos vistas", "Usa tarjetas para el detalle personal y áreas para la cobertura conjunta."],
                [Clock3, "Verifica los bloques", "Considera tanto el total de horas como su distribución durante la semana."],
                [UserRound, "Actualiza en Integrantes", "Los horarios se registran o modifican desde la ficha de cada integrante."],
              ].map(([Icon, title, text]) => (
                <div key={title} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" strokeWidth={1.8} />
                  <div><p className="text-sm font-semibold text-slate-800">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p></div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div><p className="text-sm font-semibold text-slate-800">¿Listo para consultar?</p><p className="mt-1 text-xs text-slate-500">Vuelve al módulo y revisa el horario institucional.</p></div>
              <Button type="button" onClick={returnToModule} className="h-10 gap-2 rounded-xl bg-[#2D5A3D] px-5 text-white hover:bg-[#234B32]">
                <Clock3 className="h-4 w-4" /> Ir a horario
              </Button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
