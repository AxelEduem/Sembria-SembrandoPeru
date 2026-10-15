import {
  Archive,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  FileSpreadsheet,
  Filter,
  Lightbulb,
  ListChecks,
  Pencil,
  Search,
  Send,
  ShieldCheck,
  Target,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { hasAnyPermission, hasPermission, PERMISSIONS } from "@/utils/permissions";

const listPath = "/gestion-proyectos/detecta/convocatorias";
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
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${colors[color]}`}
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

function Tip({ children, tone = "emerald", icon: Icon = Lightbulb }) {
  const styles = {
    blue: "border-blue-100 bg-blue-50/70 text-blue-800",
    emerald: "border-emerald-100 bg-emerald-50/70 text-emerald-800",
    amber: "border-amber-100 bg-amber-50/70 text-amber-800",
  };

  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm leading-5 ${styles[tone]}`}
    >
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

function ProcessPreview() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-xs font-semibold text-slate-500">Ruta de una convocatoria</p>
      <div className="mt-4 space-y-2">
        {[
          "Registro",
          "Primer filtro",
          "Segundo filtro",
          "Aprobación",
          "Postulación",
          "Envío a equipo IDEAR",
          "Seguimiento",
          "Cierre",
        ].map((label, index) => (
          <div key={label} className="flex items-center gap-3">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                index < 3
                  ? "bg-emerald-100 text-emerald-700"
                  : "border border-slate-200 bg-white text-slate-500"
              }`}
            >
              {index + 1}
            </span>
            <span className="text-xs font-medium text-slate-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ConvocatoriasManualPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState("vista-general");
  const listSearch = location.state?.listSearch || "";

  const canCreate = hasPermission(profile, PERMISSIONS.GP_CONVOCATORIAS_CREAR);
  const canEdit = hasPermission(profile, PERMISSIONS.GP_CONVOCATORIAS_EDITAR);
  const canEvaluate = hasPermission(profile, PERMISSIONS.GP_CONVOCATORIAS_EVALUAR);
  const canReview = hasPermission(profile, PERMISSIONS.GP_CONVOCATORIAS_REVISAR);
  const canApprove = hasPermission(profile, PERMISSIONS.GP_CONVOCATORIAS_APROBAR);
  const canViewApproval = hasPermission(profile, PERMISSIONS.GP_CONVOCATORIAS_VER_APROBACION);
  const canPostulate = hasPermission(profile, PERMISSIONS.GP_CONVOCATORIAS_POSTULAR);
  const canViewPostulation = hasAnyPermission(profile, [
    PERMISSIONS.GP_CONVOCATORIAS_VER_POSTULACION,
    PERMISSIONS.GP_CONVOCATORIAS_VER_ENVIO,
  ]);
  const canViewTracking = hasAnyPermission(profile, [
    PERMISSIONS.GP_CONVOCATORIAS_POSTULAR,
    PERMISSIONS.GP_CONVOCATORIAS_VER_SEGUIMIENTO,
  ]);
  const canManageClosure = hasPermission(profile, PERMISSIONS.GP_CONVOCATORIAS_ARCHIVAR);
  const canViewClosure = hasPermission(profile, PERMISSIONS.GP_CONVOCATORIAS_VER_CIERRE);
  const canDownloadExcel = hasPermission(profile, PERMISSIONS.GP_CONVOCATORIAS_DESCARGAR_EXCEL);

  const sections = useMemo(
    () =>
      [
        { id: "vista-general", label: "Vista general", icon: BookOpen },
        { id: "consultar", label: "Consultar y filtrar", icon: Search },
        (canCreate || canEdit) && {
          id: "registro",
          label: "Registrar y editar",
          icon: Pencil,
        },
        canEvaluate && { id: "primer-filtro", label: "Primer filtro", icon: Filter },
        canReview && { id: "segundo-filtro", label: "Segundo filtro", icon: ListChecks },
        (canApprove || canViewApproval) && {
          id: "aprobacion",
          label: "Aprobación",
          icon: ClipboardCheck,
        },
        (canPostulate || canViewPostulation) && {
          id: "postulacion",
          label: "Postulación y envío a IDEAR",
          icon: Send,
        },
        canViewTracking && { id: "seguimiento", label: "Seguimiento", icon: Target },
        (canManageClosure || canViewClosure) && {
          id: "cierre",
          label: "Cierre y archivo",
          icon: Archive,
        },
        canDownloadExcel && {
          id: "exportar",
          label: "Exportar a Excel",
          icon: FileSpreadsheet,
        },
        { id: "recomendaciones", label: "Recomendaciones", icon: Lightbulb },
      ].filter(Boolean),
    [
      canApprove,
      canCreate,
      canDownloadExcel,
      canEdit,
      canEvaluate,
      canManageClosure,
      canPostulate,
      canReview,
      canViewApproval,
      canViewClosure,
      canViewPostulation,
      canViewTracking,
    ],
  );

  const currentSection = sections.some(({ id }) => id === activeSection)
    ? activeSection
    : "vista-general";
  const sectionEyebrow = (id, label) => {
    const index = sections.findIndex((section) => section.id === id);
    return `${String(index + 1).padStart(2, "0")} · ${label}`;
  };
  const returnToList = () => navigate(`${listPath}${listSearch}`);

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
        .manual-panel-enter {
          transform-origin: top center;
          animation: manualPanelEnter 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .manual-panel-enter > * {
          animation: manualPanelContentEnter 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .manual-panel-enter > *:nth-child(2) { animation-delay: 70ms; }
        @media (prefers-reduced-motion: reduce) {
          .manual-panel-enter, .manual-panel-enter > * { animation: none; }
        }
      `}</style>

      <button
        type="button"
        onClick={returnToList}
        className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        Volver a convocatorias
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
              Manual del módulo de convocatorias
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80">
              Esta guía se adapta a los permisos de tu rol y explica únicamente las bandejas y
              acciones que puedes utilizar.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs font-semibold text-emerald-100">Tiempo estimado</p>
            <p className="mt-1 text-lg font-bold">6 minutos</p>
          </div>
        </div>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
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
                <ChevronRight
                  className={`h-3.5 w-3.5 ${currentSection === id ? "text-emerald-500" : "text-slate-300"}`}
                />
              </button>
            ))}
          </nav>
        </aside>

        <main key={currentSection} className="min-w-0 space-y-5">
          {currentSection === "vista-general" && (
            <section id="vista-general" role="tabpanel" className={cardClass}>
              <SectionHeader
                icon={BookOpen}
                eyebrow={sectionEyebrow("vista-general", "Vista general")}
                title="Entiende el recorrido de una convocatoria"
                description="Cada bandeja representa una etapa del proceso, desde el registro hasta el cierre."
              />
              <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[1fr_280px]">
                <div className="space-y-5">
                  <p className="text-sm leading-6 text-slate-600">
                    El módulo organiza oportunidades de financiamiento. Una convocatoria avanza de
                    bandeja cuando se completa la revisión correspondiente; si deja de ser viable,
                    pasa al cierre con el resultado registrado.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FeatureCard icon={Search} title="Consultar">
                      Revisa la información, las fechas, el financiador y el historial de cada
                      oportunidad.
                    </FeatureCard>
                    <FeatureCard icon={ClipboardCheck} title="Procesar">
                      Atiende únicamente las etapas para las que tu rol tiene autorización.
                    </FeatureCard>
                    <FeatureCard icon={Target} title="Dar seguimiento">
                      Registra avances y resultados después del envío de una postulación.
                    </FeatureCard>
                    <FeatureCard icon={Archive} title="Cerrar">
                      Identifica convocatorias finalizadas, descartadas o archivadas.
                    </FeatureCard>
                  </div>
                  <Tip tone="blue" icon={ShieldCheck}>
                    Si una bandeja o sección no aparece, tu perfil no tiene permiso para consultarla
                    o administrarla. El servidor también valida cada acción.
                  </Tip>
                </div>
                <ProcessPreview />
              </div>
            </section>
          )}

          {currentSection === "consultar" && (
            <section id="consultar" role="tabpanel" className={cardClass}>
              <SectionHeader
                icon={Search}
                eyebrow={sectionEyebrow("consultar", "Consultar y filtrar")}
                title="Encuentra la convocatoria que necesitas"
                description="Selecciona una bandeja y combina los filtros para reducir los resultados."
                color="blue"
              />
              <div className="space-y-5 p-5 sm:p-6">
                <Step number="1" title="Elige una bandeja">
                  La barra superior solo muestra las etapas habilitadas para tu perfil. Al cambiar
                  de bandeja verás las convocatorias que se encuentran actualmente en esa etapa.
                </Step>
                <Step number="2" title="Busca por texto">
                  Escribe el nombre de la convocatoria o del financiador.
                </Step>
                <Step number="3" title="Combina filtros">
                  Puedes acotar por fuente, sector, estado, etapa, elegibilidad o fecha de cierre.
                </Step>
                <Step number="4" title="Abre la convocatoria">
                  Selecciona una fila para consultar datos generales, evaluaciones, postulación,
                  seguimiento e historial disponibles para tu rol.
                </Step>
                <Tip tone="emerald" icon={CheckCircle2}>
                  La bandeja y los filtros quedan reflejados en la dirección de la página, por lo
                  que puedes volver desde la convocatoria o el manual sin perder el contexto.
                </Tip>
              </div>
            </section>
          )}

          {currentSection === "registro" && (
            <section id="registro" role="tabpanel" className={cardClass}>
              <SectionHeader
                icon={Pencil}
                eyebrow={sectionEyebrow("registro", "Registrar y editar")}
                title="Completa la ficha inicial de la oportunidad"
                description="Registra información verificable antes de enviar la convocatoria a evaluación."
                color="violet"
              />
              <div className="space-y-5 p-5 sm:p-6">
                {canCreate && (
                  <>
                    <Step number="1" title="Abre Registrar convocatoria">
                      La acción aparece en la bandeja Registro. Debes estar asignado a un equipo con
                      capacidad para registrar.
                    </Step>
                    <Step number="2" title="Completa los datos">
                      Registra nombre, fuente, financiador, sector, fechas, monto, moneda, enlace y
                      demás información solicitada.
                    </Step>
                  </>
                )}
                {canEdit && (
                  <Step number={canCreate ? "3" : "1"} title="Corrige antes del primer filtro">
                    La edición se habilita mientras la convocatoria todavía no haya sido revisada en
                    el primer filtro. Después, la convocatoria conserva la información evaluada.
                  </Step>
                )}
                <Tip tone="amber" icon={FileCheck2}>
                  Verifica la fecha de cierre y el enlace original. Son datos clave para priorizar y
                  sustentar las siguientes decisiones.
                </Tip>
              </div>
            </section>
          )}

          {currentSection === "primer-filtro" && (
            <section id="primer-filtro" role="tabpanel" className={cardClass}>
              <SectionHeader
                icon={Filter}
                eyebrow={sectionEyebrow("primer-filtro", "Primer filtro")}
                title="Realiza la evaluación inicial"
                description="Comprueba rápidamente si la oportunidad cumple los criterios básicos."
                color="blue"
              />
              <div className="space-y-5 p-5 sm:p-6">
                <Step number="1" title="Abre una convocatoria pendiente">
                  La bandeja muestra las oportunidades autorizadas para esta primera revisión.
                </Step>
                <Step number="2" title="Responde todos los criterios">
                  Revisa la convocatoria y registra cada respuesta con la evidencia u observación
                  necesaria.
                </Step>
                <Step number="3" title="Confirma el resultado">
                  Si cumple, avanza al segundo filtro; si no es viable, pasa a cierre.
                </Step>
              </div>
            </section>
          )}

          {currentSection === "segundo-filtro" && (
            <section id="segundo-filtro" role="tabpanel" className={cardClass}>
              <SectionHeader
                icon={ListChecks}
                eyebrow={sectionEyebrow("segundo-filtro", "Segundo filtro")}
                title="Completa la revisión técnica"
                description="Profundiza la evaluación antes de solicitar la aprobación final."
                color="blue"
              />
              <div className="space-y-5 p-5 sm:p-6">
                <Step number="1" title="Consulta el primer resultado">
                  Revisa la calificación y las observaciones registradas en el primer filtro.
                </Step>
                <Step number="2" title="Evalúa los criterios del segundo filtro">
                  Completa la revisión con información consistente con la convocatoria.
                </Step>
                <Step number="3" title="Registra la conclusión">
                  Una convocatoria elegible avanza a aprobación; una no viable pasa a cierre.
                </Step>
              </div>
            </section>
          )}

          {currentSection === "aprobacion" && (
            <section id="aprobacion" role="tabpanel" className={cardClass}>
              <SectionHeader
                icon={ClipboardCheck}
                eyebrow={sectionEyebrow("aprobacion", "Aprobación")}
                title={canApprove ? "Registra la decisión final" : "Consulta la decisión final"}
                description="Revisa los filtros previos y la resolución que define si continúa la postulación."
                color="violet"
              />
              <div className="space-y-5 p-5 sm:p-6">
                <Step number="1" title="Revisa la convocatoria completa">
                  Confirma los resultados del primer y segundo filtro antes de interpretar la
                  decisión.
                </Step>
                {canApprove ? (
                  <>
                    <Step number="2" title="Aprueba o no apruebes">
                      La aprobación permite continuar a Postulación. Si no apruebas, registra una
                      justificación y la convocatoria pasará a Cierre.
                    </Step>
                    <Tip tone="amber">
                      La decisión queda registrada en el historial de la convocatoria.
                    </Tip>
                  </>
                ) : (
                  <Tip tone="blue" icon={ShieldCheck}>
                    Tu permiso es de consulta: puedes revisar la decisión, pero no modificarla.
                  </Tip>
                )}
              </div>
            </section>
          )}

          {currentSection === "postulacion" && (
            <section id="postulacion" role="tabpanel" className={cardClass}>
              <SectionHeader
                icon={Send}
                eyebrow={sectionEyebrow("postulacion", "Postulación y envío a IDEAR")}
                title={
                  canPostulate
                    ? "Prepara y registra el envío a IDEAR"
                    : "Consulta la postulación y el envío a IDEAR"
                }
                description="Organiza la preparación del proyecto y registra su revisión con el equipo IDEAR."
                color="cyan"
              />
              <div className="space-y-5 p-5 sm:p-6">
                <Step number="1" title="Revisa la convocatoria aprobada">
                  Confirma los requisitos, responsables y fecha límite antes de iniciar la
                  preparación.
                </Step>
                <Step number="2" title="Consulta el estado de postulación">
                  El proyecto muestra el avance, la información registrada y los datos de envío a IDEAR.
                </Step>
                {canPostulate ? (
                  <Step number="3" title="Actualiza y confirma el envío a IDEAR">
                    Registra al líder IDEAR, las fechas de revisión, el rango en miles de USD, la
                    fecha de radicado y el plazo de respuesta de 30 o 45 días.
                  </Step>
                ) : (
                  <Tip tone="blue" icon={ShieldCheck}>
                    Tu perfil puede consultar esta etapa, pero las actualizaciones están reservadas
                    para quienes tienen el permiso de postular.
                  </Tip>
                )}
              </div>
            </section>
          )}

          {currentSection === "seguimiento" && (
            <section id="seguimiento" role="tabpanel" className={cardClass}>
              <SectionHeader
                icon={Target}
                eyebrow={sectionEyebrow("seguimiento", "Seguimiento")}
                title={canPostulate ? "Mantén actualizado el resultado" : "Consulta el seguimiento"}
                description="Da continuidad a la propuesta enviada hasta conocer la respuesta del financiador."
                color="emerald"
              />
              <div className="space-y-5 p-5 sm:p-6">
                <Step number="1" title="Abre la convocatoria enviada">
                  Consulta los datos de postulación y la fecha en que fue presentada.
                </Step>
                <Step number="2" title="Revisa el resumen y el resultado">
                  Confirma el líder IDEAR, las fechas de revisión, el rango, el radicado y la fecha
                  estimada de respuesta. Cuando exista una respuesta, consulta el tipo, la fecha y
                  la observación del resultado.
                </Step>
                {canPostulate ? (
                  <>
                    <Step number="3" title="Registra comunicaciones">
                      Añade comunicaciones recibidas o enviadas indicando fecha, canal, asunto y un
                      resumen para conservar el contexto institucional.
                    </Step>
                    <Step number="4" title="Gestiona solicitudes de información">
                      Registra la descripción, persona responsable y fecha límite. Cuando se atienda,
                      marca la solicitud como respondida.
                    </Step>
                    <Step number="5" title="Registra el resultado final">
                      Al conocer la respuesta, indica el tipo y la fecha del resultado, agrega una
                      observación y confirma el registro.
                    </Step>
                    <Tip tone="emerald" icon={Target}>
                      La línea de tiempo reúne comunicaciones, solicitudes y resultados para mostrar
                      la trazabilidad completa después del envío.
                    </Tip>
                  </>
                ) : (
                  <Tip tone="blue" icon={ShieldCheck}>
                    Esta sección es de consulta para tu perfil: puedes revisar el resultado,
                    comunicaciones, solicitudes de información y la línea de tiempo, pero no
                    modificarlas.
                  </Tip>
                )}
              </div>
            </section>
          )}

          {currentSection === "cierre" && (
            <section id="cierre" role="tabpanel" className={cardClass}>
              <SectionHeader
                icon={Archive}
                eyebrow={sectionEyebrow("cierre", "Cierre y archivo")}
                title={
                  canManageClosure
                    ? "Gestiona el ciclo de vida de la convocatoria"
                    : "Consulta convocatorias cerradas"
                }
                description="Identifica por qué terminó el proceso y conserva su trazabilidad."
                color="amber"
              />
              <div className="space-y-5 p-5 sm:p-6">
                <Step number="1" title="Comprueba el resultado">
                  El cierre puede provenir de una evaluación no viable, una decisión de no aprobar o
                  el resultado final del seguimiento.
                </Step>
                <Step number="2" title="Consulta el historial">
                  Revisa las decisiones y movimientos que explican cómo terminó la convocatoria.
                </Step>
                {canManageClosure ? (
                  <Step number="3" title="Archiva, restaura o cierra">
                    Usa la acción adecuada e indica el motivo cuando el sistema lo solicite.
                    Restaurar devuelve una convocatoria archivada a su estado cerrado anterior.
                  </Step>
                ) : (
                  <Tip tone="blue" icon={ShieldCheck}>
                    Tu perfil puede consultar el cierre, pero no archivar, restaurar ni modificar el
                    resultado.
                  </Tip>
                )}
              </div>
            </section>
          )}

          {currentSection === "exportar" && (
            <section id="exportar" role="tabpanel" className={cardClass}>
              <SectionHeader
                icon={FileSpreadsheet}
                eyebrow={sectionEyebrow("exportar", "Exportar a Excel")}
                title="Descarga la bandeja que estás consultando"
                description="Genera un archivo con los resultados visibles según la etapa y los filtros aplicados."
                color="cyan"
              />
              <div className="space-y-5 p-5 sm:p-6">
                <Step number="1" title="Selecciona la bandeja">
                  El archivo corresponde al proceso activo, como Registro, Aprobación o Cierre.
                </Step>
                <Step number="2" title="Aplica los filtros necesarios">
                  La descarga respeta la búsqueda, fuente, sector, estado, etapa, elegibilidad y
                  fecha de cierre seleccionados.
                </Step>
                <Step number="3" title="Presiona Descargar Excel">
                  El botón se habilita cuando la bandeja contiene resultados y termina de cargar.
                </Step>
              </div>
            </section>
          )}

          {currentSection === "recomendaciones" && (
            <section id="recomendaciones" role="tabpanel" className={cardClass}>
              <SectionHeader
                icon={Lightbulb}
                eyebrow={sectionEyebrow("recomendaciones", "Recomendaciones")}
                title="Trabaja con información clara y trazable"
                description="Estas prácticas facilitan las revisiones y evitan decisiones basadas en datos incompletos."
                color="amber"
              />
              <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
                <FeatureCard icon={FileCheck2} title="Usa la fuente original">
                  Contrasta fechas, montos y requisitos con la publicación del financiador.
                </FeatureCard>
                <FeatureCard icon={ListChecks} title="Explica cada decisión">
                  Registra observaciones concretas que permitan entender las evaluaciones
                  posteriores.
                </FeatureCard>
                <FeatureCard icon={Send} title="Conserva la evidencia">
                  Verifica los datos del envío a IDEAR y mantén actualizada la convocatoria durante el
                  seguimiento.
                </FeatureCard>
                <FeatureCard icon={ShieldCheck} title="Respeta tu alcance">
                  Las acciones disponibles dependen de los permisos asignados a tu rol.
                </FeatureCard>
                <div className="sm:col-span-2">
                  <Tip tone="blue" icon={ShieldCheck}>
                    Este manual oculta las etapas que tu perfil no puede consultar. Si necesitas una
                    función adicional, solicita la revisión de tus permisos a la persona
                    administradora.
                  </Tip>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
