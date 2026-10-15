import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  History,
  Lightbulb,
  Search,
  Settings2,
  ShieldAlert,
  SlidersHorizontal,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

const sections = [
  { id: "vista-general", label: "Vista general", icon: BookOpen },
  { id: "seguimiento", label: "Seguimiento diario", icon: Users },
  { id: "solicitudes", label: "Solicitudes", icon: ClipboardCheck },
  { id: "amonestaciones", label: "Amonestaciones", icon: ShieldAlert },
  { id: "metricas", label: "Métricas", icon: BarChart3 },
  { id: "configuracion", label: "Configuración", icon: Settings2 },
  { id: "recomendaciones", label: "Buenas prácticas", icon: Lightbulb },
];

const cardClass = "attendance-admin-manual-panel-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]";

function SectionHeader({ icon: Icon, number, title, description, tone = "emerald" }) {
  const tones = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    rose: "border-rose-100 bg-rose-50 text-rose-700",
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

function Feature({ icon: Icon, title, description, tone }) {
  return (
    <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="h-4 w-4" strokeWidth={1.8} />
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function Tip({ children, tone = "emerald" }) {
  const tones = {
    emerald: "border-emerald-100 bg-emerald-50/70 text-emerald-800",
    amber: "border-amber-100 bg-amber-50/70 text-amber-800",
    blue: "border-blue-100 bg-blue-50/70 text-blue-800",
    rose: "border-rose-100 bg-rose-50/70 text-rose-800",
  };

  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 ${tones[tone]}`}>
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.9} />
      <p className="text-sm leading-5">{children}</p>
    </div>
  );
}

export default function AsistenciaAdministracionManualPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("vista-general");
  const listSearch = location.state?.listSearch || "";
  const returnToManagement = () => navigate(`/asistencia/administracion${listSearch}`);

  return (
    <div className="module-page-enter mx-auto max-w-7xl pb-10">
      <style>{`
        @keyframes attendanceAdminManualPanelEnter {
          from { opacity: 0; transform: translateY(14px) scale(.988); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes attendanceAdminManualContentEnter {
          from { opacity: 0; transform: translateY(7px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .attendance-admin-manual-panel-enter {
          transform-origin: top center;
          animation: attendanceAdminManualPanelEnter 420ms cubic-bezier(.22,1,.36,1) both;
        }
        .attendance-admin-manual-panel-enter > * {
          animation: attendanceAdminManualContentEnter 360ms cubic-bezier(.22,1,.36,1) both;
        }
        .attendance-admin-manual-panel-enter > *:nth-child(2) { animation-delay: 70ms; }
        @media (prefers-reduced-motion: reduce) {
          .attendance-admin-manual-panel-enter,
          .attendance-admin-manual-panel-enter > * { animation: none; }
        }
      `}</style>

      <button type="button" onClick={returnToManagement} className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        Volver a gestión de asistencia
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
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Manual de Gestión de asistencia</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80">
              Aprende a supervisar jornadas, resolver solicitudes y consultar indicadores sin perder la trazabilidad de cada decisión.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs font-semibold text-emerald-100">Tiempo estimado</p>
            <p className="mt-1 text-lg font-bold">6 minutos</p>
          </div>
        </div>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[245px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.03)] lg:sticky lg:top-3">
          <p className="px-3 pt-2 pb-3 text-[11px] font-bold tracking-[0.1em] text-slate-400 uppercase">Contenido</p>
          <nav className="space-y-1" aria-label="Contenido del manual" role="tablist">
            {sections.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" role="tab" aria-selected={activeSection === id} aria-controls={`attendance-admin-manual-${id}`} onClick={() => setActiveSection(id)} className={`group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${activeSection === id ? "translate-x-0.5 bg-emerald-50 text-emerald-800 shadow-[inset_3px_0_0_#2D5A3D]" : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"}`}>
                <Icon className={`h-4 w-4 shrink-0 ${activeSection === id ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-600"}`} strokeWidth={1.8} />
                <span className="min-w-0 flex-1">{label}</span>
                <ChevronRight className={`h-3.5 w-3.5 ${activeSection === id ? "text-emerald-500" : "text-slate-300"}`} />
              </button>
            ))}
          </nav>
        </aside>

        <main key={activeSection} className="min-w-0">
          <section id="attendance-admin-manual-vista-general" role="tabpanel" className={`${cardClass} ${activeSection !== "vista-general" ? "hidden" : ""}`}>
            <SectionHeader icon={BookOpen} number="01 · Vista general" title="¿Qué reúne Gestión de asistencia?" description="La pantalla centraliza el seguimiento diario y las herramientas administrativas del módulo." />
            <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
              <Feature icon={Users} title="Seguimiento diario" description="Consulta quién tiene jornada, sus horarios y el estado actual de asistencia." tone="bg-emerald-100 text-emerald-700" />
              <Feature icon={ClipboardCheck} title="Solicitudes" description="Aprueba o deniega justificaciones pendientes de falta, tardanza o salida anticipada." tone="bg-blue-100 text-blue-700" />
              <Feature icon={ShieldAlert} title="Amonestaciones" description="Compara cuántas amonestaciones bajas, medias y graves tiene cada integrante." tone="bg-amber-100 text-amber-700" />
              <Feature icon={BarChart3} title="Métricas" description="Revisa tendencias generales y resultados del periodo disponible." tone="bg-violet-100 text-violet-700" />
            </div>
          </section>

          <section id="attendance-admin-manual-seguimiento" role="tabpanel" className={`${cardClass} ${activeSection !== "seguimiento" ? "hidden" : ""}`}>
            <SectionHeader icon={Users} number="02 · Seguimiento diario" title="Ubica rápidamente cada jornada" description="Los filtros y la tabla permiten revisar la asistencia de una fecha sin perder el contexto del integrante." tone="blue" />
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_0.9fr]">
              <div className="space-y-4">
                <Step number="1" title="Selecciona la fecha">Elige el día que deseas supervisar. No se muestran fechas futuras.</Step>
                <Step number="2" title="Reduce los resultados">Busca por nombre o correo y combina área, cargo y estado.</Step>
                <Step number="3" title="Lee el estado">La tabla diferencia jornadas próximas, abiertas, completadas, tardanzas, faltas y permisos.</Step>
                <Step number="4" title="Abre el detalle">Selecciona una fila para revisar horarios, incidencias y datos de marcación.</Step>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700"><Search className="h-4 w-4 text-emerald-700" />Filtros guardados en la URL</div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">Al recargar o compartir el enlace, la búsqueda, fecha, área, cargo, estado y página se conservan.</p>
                </div>
                <Tip tone="blue"><SlidersHorizontal className="mr-1 inline h-4 w-4" />Usa “Limpiar filtros” para volver a la vista diaria inicial.</Tip>
              </div>
            </div>
          </section>

          <section id="attendance-admin-manual-solicitudes" role="tabpanel" className={`${cardClass} ${activeSection !== "solicitudes" ? "hidden" : ""}`}>
            <SectionHeader icon={ClipboardCheck} number="03 · Solicitudes" title="Resuelve solicitudes pendientes" description="La pantalla separa faltas, tardanzas, salidas anticipadas y permisos; las decisiones tomadas pasan al historial." tone="violet" />
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
              <div className="space-y-4">
                <Step number="1" title="Elige el tipo">Cambia entre Falta, Tardanza, Salida anticipada y Permiso para revisar únicamente los casos pendientes de esa categoría.</Step>
                <Step number="2" title="Revisa la solicitud">Confirma integrante, fechas, horario, motivo, plan de recuperación y archivo adjunto antes de decidir.</Step>
                <Step number="3" title="Aprueba cuando corresponda">Puedes agregar una observación opcional y confirmar la aprobación.</Step>
                <Step number="4" title="Deniega con sustento">Escribe el motivo. En faltas, tardanzas y salidas anticipadas también debes seleccionar la gravedad de la amonestación.</Step>
                <Step number="5" title="Consulta el historial">La solicitud resuelta desaparece de pendientes y queda disponible en Historial de solicitudes.</Step>
              </div>
              <div className="space-y-3">
                <Feature icon={CheckCircle2} title="Aprobada" description="La justificación queda validada y se conserva la observación administrativa." tone="bg-emerald-100 text-emerald-700" />
                <Feature icon={XCircle} title="Denegada" description="La decisión conserva el motivo; si no es un permiso, genera una amonestación con la gravedad seleccionada." tone="bg-rose-100 text-rose-700" />
                <Tip tone="amber">Lee el documento adjunto antes de resolver. Una decisión queda registrada en la auditoría.</Tip>
              </div>
            </div>
          </section>

          <section id="attendance-admin-manual-amonestaciones" role="tabpanel" className={`${cardClass} ${activeSection !== "amonestaciones" ? "hidden" : ""}`}>
            <SectionHeader icon={ShieldAlert} number="04 · Amonestaciones" title="Compara la gravedad por integrante" description="La tabla incluye a los integrantes activos con acceso configurado y resume únicamente sus amonestaciones vigentes." tone="rose" />
            <div className="p-5 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <Feature icon={ShieldAlert} title="Baja" description="Observación de menor impacto dentro del historial vigente." tone="bg-blue-100 text-blue-700" />
                <Feature icon={ShieldAlert} title="Media" description="Incumplimiento que requiere mayor seguimiento administrativo." tone="bg-amber-100 text-amber-700" />
                <Feature icon={ShieldAlert} title="Grave" description="Caso de mayor severidad y prioridad para la revisión." tone="bg-rose-100 text-rose-700" />
              </div>
              <div className="mt-5 space-y-4">
                <Step number="1" title="Busca al integrante">Usa nombre, correo o área para localizarlo. Presiona su fotografía para verla ampliada y confirmar visualmente la persona.</Step>
                <Step number="2" title="Filtra por gravedad">El filtro muestra integrantes que tengan al menos una amonestación de la gravedad elegida.</Step>
                <Step number="3" title="Interpreta los conteos">Total es la suma de bajas, medias y graves activas.</Step>
                <Tip tone="emerald">Si una apelación aprobada retira una amonestación, esta deja de contarse automáticamente.</Tip>
              </div>
            </div>
          </section>

          <section id="attendance-admin-manual-metricas" role="tabpanel" className={`${cardClass} ${activeSection !== "metricas" ? "hidden" : ""}`}>
            <SectionHeader icon={BarChart3} number="05 · Métricas" title="Analiza el comportamiento de la asistencia" description="Los indicadores resumen jornadas, cumplimiento, tardanzas, faltas y recuperaciones del periodo." tone="blue" />
            <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
              <Feature icon={BarChart3} title="Indicadores generales" description="Compara jornadas programadas, completadas, faltas, permisos y tiempo realizado." tone="bg-blue-100 text-blue-700" />
              <Feature icon={CalendarDays} title="Periodo visible" description="Verifica siempre las fechas mostradas antes de interpretar los resultados." tone="bg-emerald-100 text-emerald-700" />
              <Feature icon={Users} title="Resultados por área" description="Identifica diferencias entre equipos sin salir del módulo." tone="bg-violet-100 text-violet-700" />
              <Feature icon={History} title="Recuperaciones" description="Consulta minutos recuperados y bloques que aún continúan pendientes." tone="bg-amber-100 text-amber-700" />
            </div>
          </section>

          <section id="attendance-admin-manual-configuracion" role="tabpanel" className={`${cardClass} ${activeSection !== "configuracion" ? "hidden" : ""}`}>
            <SectionHeader icon={Settings2} number="06 · Configuración" title="Ajusta las reglas institucionales" description="Modifica únicamente valores acordados por la organización, porque afectan la clasificación automática de jornadas." tone="amber" />
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
              <div className="space-y-4">
                <Step number="1" title="Lee la explicación">Cada campo indica qué comportamiento controla y utiliza minutos como unidad.</Step>
                <Step number="2" title="Actualiza con cuidado">Los márgenes de entrada, tardanza, falta y salida afectan nuevas evaluaciones.</Step>
                <Step number="3" title="Guarda los cambios">Confirma la configuración antes de abandonar la pantalla.</Step>
              </div>
              <div className="space-y-3">
                <Step number="4" title="Consulta feriados y días institucionales">Los feriados nacionales se cargan automáticamente. Puedes buscar y filtrar por origen, tratamiento y periodo.</Step>
                <Step number="5" title="Define si se controla asistencia">Marca cada fecha como No laborable o Laborable por excepción según la decisión institucional.</Step>
                <Step number="6" title="Administra fechas propias">Registra y elimina días institucionales. Los feriados nacionales no se eliminan, pero sí puedes cambiar su tratamiento.</Step>
                <Tip tone="rose">No cambies las reglas solo para corregir un caso individual. Revisa primero el detalle de esa asistencia.</Tip>
              </div>
            </div>
          </section>

          <section id="attendance-admin-manual-recomendaciones" role="tabpanel" className={`${cardClass} ${activeSection !== "recomendaciones" ? "hidden" : ""}`}>
            <SectionHeader icon={Lightbulb} number="07 · Buenas prácticas" title="Administra con criterios claros y trazables" description="Estas recomendaciones ayudan a mantener decisiones consistentes entre integrantes y áreas." tone="emerald" />
            <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
              <Feature icon={ClipboardCheck} title="Revisa antes de decidir" description="Contrasta fecha, horario, motivo y adjunto antes de aprobar o denegar." tone="bg-emerald-100 text-emerald-700" />
              <Feature icon={History} title="Consulta el historial" description="Evita decisiones duplicadas y confirma observaciones anteriores." tone="bg-blue-100 text-blue-700" />
              <Feature icon={ShieldAlert} title="Aplica gravedad consistente" description="Usa el mismo criterio institucional para casos equivalentes." tone="bg-amber-100 text-amber-700" />
              <Feature icon={Settings2} title="Respeta los permisos" description="La información visible depende del alcance global o del área asignada." tone="bg-violet-100 text-violet-700" />
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div><p className="text-sm font-semibold text-slate-800">¿Listo para comenzar?</p><p className="mt-1 text-xs text-slate-500">Vuelve a Gestión de asistencia conservando los filtros que tenías aplicados.</p></div>
              <Button type="button" onClick={returnToManagement} className="h-10 gap-2 rounded-xl bg-[#2D5A3D] px-5 text-white hover:bg-[#234B32]"><Users className="h-4 w-4" />Ir a Gestión de asistencia</Button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
