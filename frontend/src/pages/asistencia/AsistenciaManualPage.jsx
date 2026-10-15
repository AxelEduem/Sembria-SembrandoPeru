import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  History,
  Lightbulb,
  LogIn,
  LogOut,
  RefreshCw,
  ShieldAlert,
  Upload,
  WifiOff,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

const sections = [
  { id: "vista-general", label: "Vista general", icon: BookOpen },
  { id: "registrar", label: "Registrar asistencia", icon: LogIn },
  { id: "finalizar", label: "Finalizar jornada", icon: LogOut },
  { id: "faltas", label: "Faltas y justificaciones", icon: ShieldAlert },
  { id: "permisos", label: "Permisos y recuperación", icon: ClipboardList },
  { id: "calendario", label: "Calendario", icon: CalendarDays },
  { id: "recomendaciones", label: "Recomendaciones", icon: Lightbulb },
];

const cardClass =
  "attendance-manual-panel-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]";

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

function StatusExample({ icon: Icon, title, description, tone }) {
  return (
    <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

export default function AsistenciaManualPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("vista-general");
  const returnToModule = () => navigate("/asistencia");

  return (
    <div className="module-page-enter mx-auto max-w-7xl pb-10">
      <style>{`
        @keyframes attendanceManualPanelEnter {
          from { opacity: 0; transform: translateY(14px) scale(.988); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes attendanceManualContentEnter {
          from { opacity: 0; transform: translateY(7px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .attendance-manual-panel-enter {
          transform-origin: top center;
          animation: attendanceManualPanelEnter 420ms cubic-bezier(.22,1,.36,1) both;
        }
        .attendance-manual-panel-enter > * {
          animation: attendanceManualContentEnter 360ms cubic-bezier(.22,1,.36,1) both;
        }
        .attendance-manual-panel-enter > *:nth-child(2) { animation-delay: 70ms; }
        @media (prefers-reduced-motion: reduce) {
          .attendance-manual-panel-enter,
          .attendance-manual-panel-enter > * { animation: none; }
        }
      `}</style>

      <button type="button" onClick={returnToModule} className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        Volver a Mi asistencia
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
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Manual del módulo Mi asistencia</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80">
              Aprende a registrar tu jornada, justificar faltas, solicitar permisos y consultar el estado de tu asistencia.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs font-semibold text-emerald-100">Tiempo estimado</p>
            <p className="mt-1 text-lg font-bold">5 minutos</p>
          </div>
        </div>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[245px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.03)] lg:sticky lg:top-3">
          <p className="px-3 pt-2 pb-3 text-[11px] font-bold tracking-[0.1em] text-slate-400 uppercase">Contenido</p>
          <nav className="space-y-1" aria-label="Contenido del manual" role="tablist">
            {sections.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" role="tab" aria-selected={activeSection === id} aria-controls={`attendance-manual-${id}`} onClick={() => setActiveSection(id)} className={`group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${activeSection === id ? "translate-x-0.5 bg-emerald-50 text-emerald-800 shadow-[inset_3px_0_0_#2D5A3D]" : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"}`}>
                <Icon className={`h-4 w-4 shrink-0 ${activeSection === id ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-600"}`} strokeWidth={1.8} />
                <span className="min-w-0 flex-1">{label}</span>
                <ChevronRight className={`h-3.5 w-3.5 ${activeSection === id ? "text-emerald-500" : "text-slate-300"}`} />
              </button>
            ))}
          </nav>
        </aside>

        <main key={activeSection} className="min-w-0">
          <section id="attendance-manual-vista-general" role="tabpanel" className={`${cardClass} ${activeSection !== "vista-general" ? "hidden" : ""}`}>
            <SectionHeader icon={Clock3} number="01 · Vista general" title="¿Qué puedes hacer en Mi asistencia?" description="El módulo reúne las acciones y consultas relacionadas con tu jornada institucional." />
            <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
              <StatusExample icon={LogIn} title="Registrar entrada" description="Inicia cada bloque cuando se habilite según tu horario." tone="bg-emerald-100 text-emerald-700" />
              <StatusExample icon={LogOut} title="Finalizar jornada" description="Registra tu salida y describe el trabajo realizado." tone="bg-blue-100 text-blue-700" />
              <StatusExample icon={ShieldAlert} title="Gestionar faltas" description="Consulta inasistencias y presenta documentos de sustento." tone="bg-rose-100 text-rose-700" />
              <StatusExample icon={ClipboardList} title="Solicitar permisos" description="Solicita una ausencia planificada y programa su recuperación." tone="bg-violet-100 text-violet-700" />
            </div>
          </section>

          <section id="attendance-manual-registrar" role="tabpanel" className={`${cardClass} ${activeSection !== "registrar" ? "hidden" : ""}`}>
            <SectionHeader icon={LogIn} number="02 · Registrar asistencia" title="Marca tu entrada en el bloque correcto" description="Cada tarjeta corresponde a un horario programado para el día actual." tone="blue" />
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_0.9fr]">
              <div className="space-y-4">
                <Step number="1" title="Identifica el bloque">Revisa la hora de inicio y fin antes de seleccionar <strong>Iniciar jornada</strong>.</Step>
                <Step number="2" title="Marca dentro del horario">El botón se habilita cerca de la hora programada. No podrás iniciar después de finalizar el bloque.</Step>
                <Step number="3" title="Explica una tardanza">Si ingresas después de la tolerancia, el sistema solicitará un motivo antes de registrar la entrada.</Step>
                <Step number="4" title="Confirma el estado">La tarjeta cambiará a <strong>En jornada</strong> y mostrará la hora registrada.</Step>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Ejemplo de bloque</p>
                  <div className="mt-3 rounded-xl border border-emerald-100 bg-white p-4">
                    <div className="flex justify-between"><span className="text-sm font-bold text-slate-800">08:00 – 12:00</span><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">Disponible</span></div>
                    <div className="mt-4 h-9 rounded-lg bg-[#2D5A3D] text-center text-xs font-bold leading-9 text-white">Iniciar jornada</div>
                  </div>
                </div>
                <Tip tone="amber">No marques la entrada de otro bloque. El sistema valida la fecha y el horario desde el servidor.</Tip>
              </div>
            </div>
          </section>

          <section id="attendance-manual-finalizar" role="tabpanel" className={`${cardClass} ${activeSection !== "finalizar" ? "hidden" : ""}`}>
            <SectionHeader icon={LogOut} number="03 · Finalizar jornada" title="Registra tu salida y el trabajo realizado" description="La descripción permite dejar evidencia clara de las actividades desarrolladas." tone="violet" />
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
              <div className="space-y-4">
                <Step number="1" title="Selecciona Finalizar">Hazlo al concluir el bloque correspondiente.</Step>
                <Step number="2" title="Describe tu jornada">Escribe un resumen concreto del trabajo realizado. El campo requiere al menos cinco caracteres.</Step>
                <Step number="3" title="Adjunta evidencia si corresponde">Puedes incorporar la evidencia permitida por el formulario cuando sea necesaria.</Step>
                <Step number="4" title="Confirma la salida">Al guardar, verás la hora de fin y el estado actualizado de la jornada.</Step>
              </div>
              <div className="space-y-3">
                <Tip tone="blue">Si finalizas antes del horario programado, también debes explicar el motivo de la salida anticipada.</Tip>
                <Tip tone="amber">Una salida anticipada queda pendiente de revisión. La administración puede aprobarla o rechazarla.</Tip>
              </div>
            </div>
          </section>

          <section id="attendance-manual-faltas" role="tabpanel" className={`${cardClass} ${activeSection !== "faltas" ? "hidden" : ""}`}>
            <SectionHeader icon={ShieldAlert} number="04 · Faltas y justificaciones" title="Presenta una justificación con información suficiente" description="El apartado Faltas muestra únicamente las inasistencias que todavía no has justificado." tone="rose" />
            <div className="p-5 sm:p-6">
              <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
                <div className="space-y-4">
                  <Step number="1" title="Abre Faltas">Selecciona una inasistencia sin justificar.</Step>
                  <Step number="2" title="Explica el motivo">Detalla la situación para facilitar su evaluación.</Step>
                  <Step number="3" title="Programa la recuperación">Genera automáticamente el plan o registra los bloques manualmente.</Step>
                  <Step number="4" title="Agrega un documento">Selecciona o arrastra una imagen o PDF y verifica su vista previa.</Step>
                  <Step number="5" title="Consulta el resultado">Revisa el estado y el detalle del plan en Solicitudes.</Step>
                </div>
                <Tip tone="rose"><Upload className="mr-1 inline h-4 w-4" />Adjunta documentos legibles y relacionados con la fecha de la falta.</Tip>
              </div>
            </div>
          </section>

          <section id="attendance-manual-permisos" role="tabpanel" className={`${cardClass} ${activeSection !== "permisos" ? "hidden" : ""}`}>
            <SectionHeader icon={ClipboardList} number="05 · Permisos y recuperación" title="Solicita un permiso y programa la recuperación" description="La solicitud calcula las horas afectadas y evita cruces con tu horario vigente." tone="amber" />
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_0.9fr]">
              <div className="space-y-4">
                <Step number="1" title="Crea la solicitud">Desde Solicitudes, selecciona <strong>Solicitar permiso</strong> y elige el tipo correspondiente.</Step>
                <Step number="2" title="Completa fechas y motivo">Indica el periodo, explica la necesidad y adjunta una imagen o PDF si corresponde.</Step>
                <Step number="3" title="Programa la recuperación">Puedes registrar bloques manualmente o pedir una propuesta automática indicando en cuántos días recuperarás.</Step>
                <Step number="4" title="Revisa antes de enviar">Ningún bloque puede cruzarse con tu horario ni quedar fuera de la jornada institucional.</Step>
                <Step number="5" title="Da seguimiento">Consulta si la solicitud continúa pendiente, fue aprobada o fue rechazada.</Step>
              </div>
              <div className="space-y-3">
                <Tip tone="blue"><RefreshCw className="mr-1 inline h-4 w-4" />La propuesta automática considera tu horario, la jornada de la organización y los días disponibles.</Tip>
                <Tip tone="amber">Las recuperaciones solo quedan vigentes cuando la solicitud de permiso es aprobada.</Tip>
              </div>
            </div>
          </section>

          <section id="attendance-manual-calendario" role="tabpanel" className={`${cardClass} ${activeSection !== "calendario" ? "hidden" : ""}`}>
            <SectionHeader icon={CalendarDays} number="06 · Calendario" title="Consulta el historial de tus jornadas" description="El calendario resume cada fecha sin mezclar métricas ni filtros innecesarios." tone="blue" />
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
              <div className="space-y-4">
                <Step number="1" title="Abre Calendario">Usa el botón superior de Mi asistencia.</Step>
                <Step number="2" title="Cambia de mes">Utiliza las flechas para revisar periodos anteriores o posteriores disponibles.</Step>
                <Step number="3" title="Lee cada jornada">Cada bloque muestra hora de inicio, hora de fin y estado.</Step>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-center justify-between"><p className="text-xs font-bold text-slate-700">Septiembre 2026</p><History className="h-4 w-4 text-emerald-700" /></div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {["08:02 – 12:00 · Completada", "14:00 – 17:45 · Salida anticipada", "Sin registro · Falta", "09:00 – 13:00 · Permiso"].map((item) => <div key={item} className="rounded-lg border border-slate-200 bg-white p-2 text-[10px] font-semibold text-slate-600">{item}</div>)}
                </div>
              </div>
            </div>
          </section>

          <section id="attendance-manual-recomendaciones" role="tabpanel" className={`${cardClass} ${activeSection !== "recomendaciones" ? "hidden" : ""}`}>
            <SectionHeader icon={Lightbulb} number="07 · Recomendaciones" title="Buenas prácticas para registrar tu asistencia" description="Estas acciones evitan errores y facilitan la revisión de tus solicitudes." tone="amber" />
            <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
              <StatusExample icon={Clock3} title="Revisa el horario" description="Confirma el bloque y la fecha antes de marcar entrada o salida." tone="bg-emerald-100 text-emerald-700" />
              <StatusExample icon={WifiOff} title="Comprueba la conexión" description="Si trabajas sin conexión, verifica después que el registro se haya sincronizado." tone="bg-amber-100 text-amber-700" />
              <StatusExample icon={Upload} title="Usa evidencia legible" description="Adjunta archivos claros, completos y relacionados con la solicitud." tone="bg-blue-100 text-blue-700" />
              <StatusExample icon={CheckCircle2} title="Consulta los estados" description="No dupliques una solicitud que todavía se encuentra pendiente." tone="bg-violet-100 text-violet-700" />
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div><p className="text-sm font-semibold text-slate-800">¿Listo para registrar tu jornada?</p><p className="mt-1 text-xs text-slate-500">Vuelve al módulo para revisar los bloques disponibles de hoy.</p></div>
              <Button type="button" onClick={returnToModule} className="h-10 gap-2 rounded-xl bg-[#2D5A3D] px-5 text-white hover:bg-[#234B32]"><Clock3 className="h-4 w-4" />Ir a Mi asistencia</Button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
