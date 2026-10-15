import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  History,
  Lightbulb,
  ListChecks,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

const sections = [
  { id: "vista-general", label: "Vista general", icon: BookOpen },
  { id: "leer-horario", label: "Leer mi horario", icon: CalendarDays },
  { id: "historial", label: "Historial de horario", icon: History },
  { id: "solicitudes", label: "Cambiar horario", icon: CalendarClock },
  { id: "recomendaciones", label: "Recomendaciones", icon: Lightbulb },
];

const cardClass =
  "my-schedule-manual-panel-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]";

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

export default function MiHorarioManualPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("vista-general");
  const returnToModule = () => navigate("/mi-horario");

  return (
    <div className="module-page-enter mx-auto max-w-7xl pb-10">
      <style>{`
        @keyframes myScheduleManualPanelEnter {
          from { opacity: 0; transform: translateY(14px) scale(.988); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes myScheduleManualContentEnter {
          from { opacity: 0; transform: translateY(7px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .my-schedule-manual-panel-enter {
          transform-origin: top center;
          animation: myScheduleManualPanelEnter 420ms cubic-bezier(.22,1,.36,1) both;
        }
        .my-schedule-manual-panel-enter > * {
          animation: myScheduleManualContentEnter 360ms cubic-bezier(.22,1,.36,1) both;
        }
        .my-schedule-manual-panel-enter > *:nth-child(2) { animation-delay: 70ms; }
        @media (prefers-reduced-motion: reduce) {
          .my-schedule-manual-panel-enter,
          .my-schedule-manual-panel-enter > * { animation: none; }
        }
      `}</style>

      <button
        type="button"
        onClick={returnToModule}
        className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        Volver a mi horario
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
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Manual de Mi horario</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80">
              Aprende a consultar tu jornada semanal, revisar horarios anteriores y solicitar un cambio cuando esté disponible.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs font-semibold text-emerald-100">Tiempo estimado</p>
            <p className="mt-1 text-lg font-bold">3 minutos</p>
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
                aria-controls={`my-schedule-manual-${id}`}
                onClick={() => setActiveSection(id)}
                className={`group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                  activeSection === id
                    ? "translate-x-0.5 bg-emerald-50 text-emerald-800 shadow-[inset_3px_0_0_#2D5A3D]"
                    : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${activeSection === id ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-600"}`}
                  strokeWidth={1.8}
                />
                <span className="min-w-0 flex-1">{label}</span>
                <ChevronRight className={`h-3.5 w-3.5 ${activeSection === id ? "text-emerald-500" : "text-slate-300"}`} />
              </button>
            ))}
          </nav>
        </aside>

        <main key={activeSection} className="min-w-0">
          <section
            id="my-schedule-manual-vista-general"
            role="tabpanel"
            className={`${cardClass} ${activeSection !== "vista-general" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={Clock3}
              number="01 · Vista general"
              title="¿Qué encontrarás en Mi horario?"
              description="Este módulo reúne tu horario semanal vigente y los accesos relacionados con sus cambios."
            />
            <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
              {[
                [CalendarDays, "Horario actual", "Visualiza tus bloques registrados de lunes a sábado."],
                [Clock3, "Horas semanales", "Consulta el total calculado con todos tus bloques vigentes."],
                [History, "Historial", "Revisa tus horarios anteriores y tus solicitudes de cambio."],
                [CalendarClock, "Solicitudes", "Inicia un cambio de horario cuando cumplas las condiciones."],
              ].map(([Icon, title, text]) => (
                <div key={title} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <Icon className="h-5 w-5 text-emerald-700" strokeWidth={1.8} />
                  <p className="mt-3 text-sm font-semibold text-slate-800">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section
            id="my-schedule-manual-leer-horario"
            role="tabpanel"
            className={`${cardClass} ${activeSection !== "leer-horario" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={CalendarDays}
              number="02 · Leer mi horario"
              title="Interpreta tu jornada semanal"
              description="La cuadrícula organiza tus bloques por día y hora para que puedas ubicar rápidamente tu disponibilidad."
              tone="blue"
            />
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_0.95fr]">
              <div className="space-y-4">
                <Step number="1" title="Revisa el total semanal">La tarjeta superior muestra la suma de horas de todos tus bloques vigentes.</Step>
                <Step number="2" title="Ubica el día">Las columnas presentan tu semana de lunes a sábado.</Step>
                <Step number="3" title="Lee cada bloque">La posición vertical indica la hora de inicio y fin dentro de la jornada.</Step>
                <Step number="4" title="Desplázate en pantallas pequeñas">La cuadrícula permite desplazamiento horizontal para conservar el detalle.</Step>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-[10px] font-bold tracking-wider text-emerald-700 uppercase">Ejemplo semanal</p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"].map((day, index) => (
                    <div key={day} className="rounded-lg border border-slate-200 bg-white p-2 text-center">
                      <p className="text-[9px] font-bold text-slate-500">{day.slice(0, 3)}</p>
                      <div className={`mt-2 h-10 rounded-md ${index < 5 ? "bg-slate-800" : "border border-dashed border-slate-200 bg-slate-50"}`} />
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-slate-700" /> Horario registrado
                </div>
              </div>
            </div>
          </section>

          <section
            id="my-schedule-manual-historial"
            role="tabpanel"
            className={`${cardClass} ${activeSection !== "historial" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={History}
              number="03 · Historial de horario"
              title="Consulta tus periodos anteriores"
              description="El historial conserva los horarios que has tenido durante tus distintos periodos institucionales."
              tone="violet"
            />
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
              <div className="space-y-4">
                <Step number="1" title="Abre Historial de horario">Usa el botón ubicado en la parte superior de Mi horario.</Step>
                <Step number="2" title="Busca o filtra">Puedes consultar por estado, modalidad, periodo o texto relacionado.</Step>
                <Step number="3" title="Descarga la información">El historial permite exportar a Excel todos los periodos que coincidan con los filtros.</Step>
              </div>
              <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-5">
                <ListChecks className="h-6 w-6 text-violet-700" strokeWidth={1.8} />
                <p className="mt-3 text-sm font-semibold text-slate-800">¿Qué muestra cada periodo?</p>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  Cargo, área, tipo de integrante, modalidad, fechas, estado, horas semanales y bloques registrados.
                </p>
              </div>
              <div className="lg:col-span-2">
                <Tip tone="blue">El historial de horario muestra periodos laborales; el historial de solicitudes muestra las peticiones de cambio y su estado.</Tip>
              </div>
            </div>
          </section>

          <section
            id="my-schedule-manual-solicitudes"
            role="tabpanel"
            className={`${cardClass} ${activeSection !== "solicitudes" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={CalendarClock}
              number="04 · Cambiar horario"
              title="Solicita una nueva distribución semanal"
              description="El sistema verifica automáticamente si puedes iniciar una nueva solicitud."
              tone="emerald"
            />
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_0.9fr]">
              <div className="space-y-4">
                <Step number="1" title="Comprueba el botón">Cuando esté habilitado, selecciona <strong>Cambiar horario</strong>.</Step>
                <Step number="2" title="Registra la propuesta">Completa la fecha de vigencia, el motivo y los nuevos bloques semanales.</Step>
                <Step number="3" title="Envía y da seguimiento">Consulta el resultado desde <strong>Historial de solicitudes</strong>.</Step>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4">
                  <ShieldCheck className="h-5 w-5 text-amber-700" strokeWidth={1.8} />
                  <p className="mt-2 text-sm font-semibold text-amber-900">El botón puede estar bloqueado</p>
                  <p className="mt-1 text-xs leading-5 text-amber-800/80">
                    No podrás iniciar otra solicitud si ya tienes una pendiente o si aún no han pasado 15 días desde que entró en vigencia el último horario aprobado.
                  </p>
                </div>
                <Tip>Si intentas usar una acción bloqueada, recibirás una notificación con el motivo correspondiente.</Tip>
              </div>
            </div>
          </section>

          <section
            id="my-schedule-manual-recomendaciones"
            role="tabpanel"
            className={`${cardClass} ${activeSection !== "recomendaciones" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={Lightbulb}
              number="05 · Recomendaciones"
              title="Buenas prácticas para gestionar tu horario"
              description="Estas comprobaciones ayudan a evitar errores antes de enviar una solicitud."
              tone="amber"
            />
            <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
              {[
                [CheckCircle2, "Revisa todos los días", "Confirma cada bloque de lunes a sábado y el total de horas semanales."],
                [CalendarClock, "Valida la vigencia", "Ten en cuenta desde qué fecha debe comenzar el nuevo horario."],
                [History, "Consulta el seguimiento", "Verifica si tu solicitud continúa pendiente, fue aprobada o fue rechazada."],
                [ShieldCheck, "Evita solicitudes duplicadas", "Espera la resolución de una solicitud pendiente antes de intentar otra."],
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
                <p className="text-sm font-semibold text-slate-800">¿Listo para revisar tu jornada?</p>
                <p className="mt-1 text-xs text-slate-500">Vuelve al módulo para consultar tu horario vigente.</p>
              </div>
              <Button
                type="button"
                onClick={returnToModule}
                className="h-10 gap-2 rounded-xl bg-[#2D5A3D] px-5 text-white hover:bg-[#234B32]"
              >
                <Clock3 className="h-4 w-4" /> Ir a Mi horario
              </Button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
