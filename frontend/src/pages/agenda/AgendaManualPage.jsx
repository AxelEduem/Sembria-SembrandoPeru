import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BellRing,
  BookOpen,
  CalendarCheck2,
  CalendarDays,
  CalendarClock,
  CalendarPlus,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  History,
  Link as LinkIcon,
  Lightbulb,
  MapPin,
  Palette,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
  UsersRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

const sections = [
  { id: "vista-general", label: "Vista general", icon: BookOpen },
  { id: "disponibilidad", label: "Buscar disponibilidad", icon: UsersRound },
  { id: "crear", label: "Crear una reunión", icon: CalendarPlus },
  { id: "solicitudes", label: "Gestionar solicitudes", icon: UserCheck },
  { id: "reuniones", label: "Reuniones confirmadas", icon: CalendarCheck2 },
  { id: "historial", label: "Historial de reuniones", icon: History },
  { id: "metricas", label: "Métricas", icon: BarChart3 },
  { id: "recomendaciones", label: "Recomendaciones", icon: Lightbulb },
];

const cardClass =
  "agenda-manual-panel-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]";

function SectionHeader({ icon: Icon, number, title, description, tone = "emerald" }) {
  const tones = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    sky: "border-sky-100 bg-sky-50 text-sky-700",
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
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
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
    sky: "border-sky-100 bg-sky-50/70 text-sky-800",
  };

  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 ${tones[tone]}`}>
      {tone === "amber" ? (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.9} />
      ) : (
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.9} />
      )}
      <p className="text-sm leading-5">{children}</p>
    </div>
  );
}

function AvailabilityPreview() {
  const hours = ["08:30", "09:00", "09:30", "10:00"];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-xs font-semibold text-slate-800">Disponibilidad común</p>
          <p className="mt-0.5 text-[10px] text-slate-400">Lunes · 2 personas seleccionadas</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-700">
          90 MIN
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 bg-slate-50/70 p-4">
        {hours.map((hour, index) => (
          <div key={hour} className="text-center">
            <p className="mb-2 text-[9px] font-semibold text-slate-400">{hour}</p>
            <div
              className={`h-12 rounded-lg border ${index < 3 ? "border-emerald-200 bg-emerald-100" : "border-slate-200 bg-white"}`}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-3 text-[10px] text-slate-500">
        <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
        Haz clic en un bloque verde para programar la reunión.
      </div>
    </div>
  );
}

function MeetingPreview() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5 shadow-sm">
      <div className="absolute inset-y-5 left-0 w-1 rounded-r-full bg-emerald-500" />
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 ring-1 ring-emerald-100">
          <BellRing className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[8px] font-extrabold tracking-wider text-emerald-600 uppercase">
              Próxima reunión
            </p>
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-bold text-emerald-700 ring-1 ring-emerald-100">
              CONFIRMADA
            </span>
          </div>
          <p className="mt-1.5 text-sm font-bold text-slate-800">Coordinación general</p>
          <p className="mt-1 text-[10px] text-slate-500">
            Organizada por <strong className="text-slate-700">Pablo Méndez</strong>
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {[
          [CalendarClock, "Lun, 21 set."],
          [Clock3, "08:30 – 10:00"],
          [MapPin, "Virtual"],
          [UsersRound, "2 participantes"],
        ].map(([Icon, label]) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1.5 text-[9px] font-semibold text-slate-600 ring-1 ring-slate-100"
          >
            <Icon className="h-3 w-3 text-emerald-600" /> {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AgendaManualPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("vista-general");
  const listSearch = location.state?.listSearch || "";

  const returnToAgenda = () => navigate(`/agenda/reuniones${listSearch}`);

  return (
    <div className="module-page-enter mx-auto max-w-7xl pb-10">
      <style>{`
        @keyframes agendaManualPanelEnter {
          from { opacity: 0; transform: translateY(14px) scale(.988); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes agendaManualContentEnter {
          from { opacity: 0; transform: translateY(7px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .agenda-manual-panel-enter {
          transform-origin: top center;
          animation: agendaManualPanelEnter 420ms cubic-bezier(.22,1,.36,1) both;
        }
        .agenda-manual-panel-enter > * {
          animation: agendaManualContentEnter 360ms cubic-bezier(.22,1,.36,1) both;
        }
        .agenda-manual-panel-enter > *:nth-child(2) { animation-delay: 70ms; }
        @media (prefers-reduced-motion: reduce) {
          .agenda-manual-panel-enter,
          .agenda-manual-panel-enter > * { animation: none; }
        }
      `}</style>

      <button
        type="button"
        onClick={returnToAgenda}
        className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        Volver a agenda
      </button>

      <header className="relative mb-5 overflow-hidden rounded-2xl border border-emerald-900/10 bg-gradient-to-br from-[#164E3B] to-[#087F5B] text-white shadow-sm">
        <div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-emerald-200/10" />
        <div className="absolute -right-4 -bottom-24 h-52 w-52 rounded-full border border-white/10" />
        <CalendarClock className="absolute top-8 right-12 h-5 w-5 text-emerald-200/40" />
        <div className="relative grid gap-6 px-6 py-7 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10">
              <BookOpen className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <p className="text-xs font-bold tracking-[0.14em] text-emerald-100 uppercase">
              Guía de uso
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Manual del módulo de agenda
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80">
              Aprende a encontrar horarios comunes, enviar solicitudes y gestionar reuniones sin
              generar cruces en la agenda del equipo.
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
          <p className="px-3 pt-2 pb-3 text-[11px] font-bold tracking-[0.1em] text-slate-400 uppercase">
            Contenido
          </p>
          <nav className="space-y-1" aria-label="Contenido del manual" role="tablist">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeSection === id}
                aria-controls={`agenda-manual-${id}`}
                onClick={() => setActiveSection(id)}
                className={`group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                  activeSection === id
                    ? "translate-x-0.5 bg-emerald-50 text-emerald-800 shadow-[inset_3px_0_0_#059669]"
                    : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${activeSection === id ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-600"}`}
                  strokeWidth={1.8}
                />
                <span className="min-w-0 flex-1">{label}</span>
                <ChevronRight
                  className={`h-3.5 w-3.5 ${activeSection === id ? "text-emerald-500" : "text-slate-300"}`}
                />
              </button>
            ))}
          </nav>
        </aside>

        <main key={activeSection} className="min-w-0">
          <section
            id="agenda-manual-vista-general"
            role="tabpanel"
            className={`${cardClass} ${activeSection !== "vista-general" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={CalendarClock}
              number="01 · Vista general"
              title="¿Qué puedes hacer en Agenda?"
              description="El módulo reúne la coordinación completa de una reunión, desde el horario común hasta su confirmación."
            />
            <div className="p-5 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  [UsersRound, "Comparar", "Encuentra bloques disponibles para varias personas."],
                  [CalendarPlus, "Solicitar", "Propón una fecha y define los datos de la reunión."],
                  [UserCheck, "Responder", "Acepta o rechaza las invitaciones recibidas."],
                  [
                    CalendarCheck2,
                    "Gestionar",
                    "Consulta, ingresa o cancela reuniones confirmadas.",
                  ],
                  [History, "Consultar historial", "Busca y filtra reuniones que ya finalizaron."],
                  [BarChart3, "Revisar métricas", "Analiza tu actividad y participación en reuniones."],
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
              <div className="mt-5">
                <Tip tone="sky">
                  Las pestañas separan tus reuniones confirmadas, las solicitudes que debes
                  responder, las que enviaste y la búsqueda de disponibilidad.
                </Tip>
              </div>
            </div>
          </section>

          <section
            id="agenda-manual-disponibilidad"
            role="tabpanel"
            className={`${cardClass} ${activeSection !== "disponibilidad" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={UsersRound}
              number="02 · Buscar disponibilidad"
              title="Encuentra un horario que funcione para todos"
              description="Compara los horarios institucionales antes de enviar una solicitud."
              tone="sky"
            />
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_0.9fr]">
              <div className="space-y-4">
                <Step number="1" title="Abre Disponibilidad">
                  Tu cuenta aparece seleccionada y bloqueada porque el organizador siempre forma
                  parte de la reunión.
                </Step>
                <Step number="2" title="Selecciona participantes">
                  Busca integrantes activos y agrégalos. La vista semanal se recalcula con cada
                  selección. Puedes presionar sus fotografías para comprobarlas en tamaño grande.
                </Step>
                <Step number="3" title="Elige un bloque común">
                  Selecciona un espacio donde todas las personas estén disponibles para abrir el
                  formulario de la reunión.
                </Step>
                <Tip tone="amber">
                  Si no aparece un bloque común, cambia los participantes o revisa otro día. No se
                  puede programar fuera de sus horarios registrados.
                </Tip>
              </div>
              <AvailabilityPreview />
            </div>
          </section>

          <section
            id="agenda-manual-crear"
            role="tabpanel"
            className={`${cardClass} ${activeSection !== "crear" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={CalendarPlus}
              number="03 · Crear una reunión"
              title="Completa y envía la solicitud"
              description="El formulario utiliza el bloque común elegido como límite para la fecha y las horas."
              tone="violet"
            />
            <div className="p-5 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  ["1", "Título", "Escribe un nombre claro de al menos tres caracteres."],
                  [
                    "2",
                    "Fecha y horario",
                    "Elige una fecha del día seleccionado y ajusta el intervalo.",
                  ],
                  ["3", "Modalidad", "Selecciona virtual, presencial o híbrida."],
                  ["4", "Lugar o enlace", "Añade la sala, dirección o vínculo según corresponda."],
                  ["5", "Descripción", "Resume el objetivo, temas o indicaciones previas."],
                  ["6", "Participantes", "Se incluyen automáticamente desde la disponibilidad."],
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
              <div className="mt-5 space-y-3">
                <Tip tone="amber">
                  La solicitud no se enviará si el organizador o algún participante ya tiene una
                  reunión confirmada que se cruza con ese horario. El mensaje indicará quién está
                  ocupado.
                </Tip>
                <Tip>
                  Una reunión que termina exactamente cuando empieza otra no se considera un cruce y
                  sí puede programarse.
                </Tip>
              </div>
            </div>
          </section>

          <section
            id="agenda-manual-solicitudes"
            role="tabpanel"
            className={`${cardClass} ${activeSection !== "solicitudes" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={UserCheck}
              number="04 · Gestionar solicitudes"
              title="Revisa invitaciones recibidas y enviadas"
              description="Cada pestaña presenta las acciones y el seguimiento que corresponden a tu participación."
              tone="amber"
            />
            <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
              <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                  <UserCheck className="h-4 w-4" /> Solicitudes recibidas
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  Revisa al organizador, horario, modalidad y participantes antes de responder.
                </p>
                <div className="mt-4 flex gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-[10px] font-semibold text-red-600">
                    <X className="h-3.5 w-3.5" /> Rechazar
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-semibold text-white">
                    <Check className="h-3.5 w-3.5" /> Aceptar solicitud
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-sky-800">
                  <Send className="h-4 w-4" /> Solicitudes enviadas
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  Consulta el avance, las respuestas individuales y las personas que siguen
                  pendientes.
                </p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-sky-100">
                  <div className="h-full w-2/3 rounded-full bg-sky-500" />
                </div>
                <p className="mt-2 text-[10px] font-semibold text-sky-700">
                  2 de 3 participantes aceptaron
                </p>
              </div>
              <div className="space-y-3 lg:col-span-2">
                <Tip tone="sky">
                  La reunión queda confirmada cuando todas las personas aceptan. Si alguien la
                  rechaza, la solicitud completa queda rechazada.
                </Tip>
                <Tip tone="amber">
                  Antes de la confirmación final se vuelve a comprobar que nadie tenga otra reunión
                  confirmada en ese horario.
                </Tip>
              </div>
            </div>
          </section>

          <section
            id="agenda-manual-reuniones"
            role="tabpanel"
            className={`${cardClass} ${activeSection !== "reuniones" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={CalendarCheck2}
              number="05 · Reuniones confirmadas"
              title="Consulta y gestiona tus próximas reuniones"
              description="La reunión más cercana aparece destacada y las siguientes se muestran debajo."
            />
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_0.9fr]">
              <div className="space-y-4">
                <Step number="1" title="Revisa la tarjeta destacada">
                  Consulta título, organizador, descripción, fecha, horario, modalidad y número de
                  participantes.
                </Step>
                <Step number="2" title="Personaliza el color">
                  Usa el selector de color para reconocer la tarjeta. La preferencia queda guardada
                  en tu navegador.
                </Step>
                <Step number="3" title="Ingresa a la reunión">
                  Si tiene enlace, utiliza <strong>Ingresar a la reunión</strong> para abrirlo en
                  una pestaña nueva.
                </Step>
                <Step number="4" title="Cancela si eres el organizador">
                  Solo quien creó la reunión verá la opción de cancelarla. Al hacerlo desaparecerá
                  de las reuniones activas de todos los participantes.
                </Step>
              </div>
              <div>
                <MeetingPreview />
                <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                    <Palette className="h-3.5 w-3.5" /> Color personalizable
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700">
                    <LinkIcon className="h-3.5 w-3.5" /> Acceso directo
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section
            id="agenda-manual-historial"
            role="tabpanel"
            className={`${cardClass} ${activeSection !== "historial" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={History}
              number="06 · Historial de reuniones"
              title="Encuentra reuniones anteriores con filtros precisos"
              description="El historial reúne reuniones finalizadas, canceladas, rechazadas y solicitudes vencidas de tu cuenta."
              tone="sky"
            />
            <div className="p-5 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  [Search, "Búsqueda", "Busca por el título de la reunión o por el nombre de un participante."],
                  [SlidersHorizontal, "Estado y participación", "Distingue reuniones confirmadas, canceladas o rechazadas y si las organizaste o asististe como invitado."],
                  [CalendarDays, "Modalidad y periodo", "Filtra por modalidad y limita los resultados a los últimos 30, 90 o 365 días."],
                ].map(([Icon, title, text]) => (
                  <div
                    key={title}
                    className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"
                  >
                    <Icon className="h-5 w-5 text-sky-700" strokeWidth={1.8} />
                    <p className="mt-3 text-sm font-semibold text-slate-800">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-3">
                <Tip tone="sky">
                  Los filtros y la página quedan guardados en la URL. Puedes compartirla o volver
                  desde otra pantalla sin perder la consulta.
                </Tip>
                <Tip tone="amber">
                  Usa <strong>Limpiar filtros</strong> para regresar al historial completo. El botón
                  solo se habilita cuando existe al menos un filtro activo.
                </Tip>
              </div>
            </div>
          </section>

          <section
            id="agenda-manual-metricas"
            role="tabpanel"
            className={`${cardClass} ${activeSection !== "metricas" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={BarChart3}
              number="07 · Métricas"
              title="Comprende tu actividad de reuniones"
              description="Las métricas consideran únicamente reuniones confirmadas que ya finalizaron."
              tone="violet"
            />
            <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
              <div className="space-y-4">
                <Step number="1" title="Revisa los indicadores principales">
                  Consulta el total de reuniones, cuántas organizaste, en cuántas participaste, las
                  horas acumuladas, la duración promedio y el número de colaboradores distintos.
                </Step>
                <Step number="2" title="Compara la evolución">
                  Los gráficos agrupan las reuniones por mes, modalidad y tipo de participación para
                  mostrar tendencias de forma rápida.
                </Step>
                <Step number="3" title="Interpreta el alcance">
                  Las reuniones pendientes, rechazadas, canceladas o todavía activas no se incluyen
                  hasta que correspondan al histórico confirmado.
                </Step>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  [CalendarCheck2, "Reuniones", "Total finalizado"],
                  [UserCheck, "Organizadas", "Creadas por ti"],
                  [Clock3, "Horas", "Tiempo acumulado"],
                  [UsersRound, "Colaboradores", "Personas distintas"],
                ].map(([Icon, title, text]) => (
                  <div key={title} className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                    <Icon className="h-5 w-5 text-violet-700" strokeWidth={1.8} />
                    <p className="mt-3 text-sm font-semibold text-slate-800">{title}</p>
                    <p className="mt-1 text-xs text-slate-500">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            id="agenda-manual-recomendaciones"
            role="tabpanel"
            className={`${cardClass} ${activeSection !== "recomendaciones" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={Lightbulb}
              number="08 · Recomendaciones"
              title="Buenas prácticas para coordinar sin contratiempos"
              description="Estas comprobaciones ayudan a mantener una agenda clara para todo el equipo."
              tone="amber"
            />
            <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
              {[
                [
                  Clock3,
                  "Deja tiempo entre reuniones",
                  "Evita programar bloques demasiado ajustados si habrá preparación o traslado.",
                ],
                [
                  CheckCircle2,
                  "Revisa antes de aceptar",
                  "Confirma la fecha, el horario, la modalidad y el enlace de la invitación.",
                ],
                [
                  ShieldCheck,
                  "Respeta la disponibilidad",
                  "Programa únicamente dentro del horario común que muestra el sistema.",
                ],
                [
                  UsersRound,
                  "Selecciona solo a quienes participarán",
                  "Agregar personas innecesarias reduce los bloques comunes disponibles.",
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
                <p className="text-sm font-semibold text-slate-800">¿Listo para coordinar?</p>
                <p className="mt-1 text-xs text-slate-500">
                  Vuelve a Agenda y encuentra un horario común para tu equipo.
                </p>
              </div>
              <Button
                type="button"
                onClick={returnToAgenda}
                className="h-10 gap-2 rounded-xl bg-emerald-600 px-5 text-white hover:bg-emerald-700"
              >
                <CalendarPlus className="h-4 w-4" /> Ir a agenda
              </Button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
