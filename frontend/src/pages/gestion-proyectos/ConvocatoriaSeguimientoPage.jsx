import {
  Activity,
  ArrowLeft,
  CalendarClock,
  ClipboardList,
  FileCheck2,
  Inbox,
  Mail,
  MessageSquareText,
  Plus,
  Send,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import FeedbackToast from "@/components/ui/FeedbackToast";
import { useAuth } from "@/contexts/AuthContext";
import {
  createComunicacion,
  createSolicitud,
  formatConvocatoriaOption,
  getConvocatoria,
  getPostulacionActiva,
  getSeguimiento,
  getSeguimientoDetalle,
  getUsuariosDisponibles,
  registrarResultadoSeguimiento,
  responderSolicitud,
  SEGUIMIENTO_ESTADOS,
} from "@/services/gestion-proyectos/convocatoriasService";
import { hasPermission, PERMISSIONS } from "@/utils/permissions";

const nameOf = (person) => [person?.nombres, person?.apellidos].filter(Boolean).join(" ");
const blankCommunication = {
  direccion: "recibida",
  canal: "correo",
  resumen: "",
  asunto: "",
  requiere_respuesta: false,
};

export default function ConvocatoriaSeguimientoPage({ embedded = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const cacheScope = profile?.cuenta_acceso_id || profile?.id || "default";
  const readOnly = !hasPermission(profile, PERMISSIONS.GP_CONVOCATORIAS_POSTULAR);
  const [convocatoria, setConvocatoria] = useState(null);
  const [postulacion, setPostulacion] = useState(null);
  const [detail, setDetail] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);
  const [communication, setCommunication] = useState(blankCommunication);
  const [request, setRequest] = useState({ descripcion: "", responsable_id: "", fecha_limite: "" });
  const [result, setResult] = useState({ tipo_resultado: "", fecha: "", observacion: "" });
  const load = useCallback(async () => {
    try {
      const [c, p, people] = await Promise.all([
        getConvocatoria(id, { cacheScope }),
        getPostulacionActiva(id),
        readOnly ? Promise.resolve([]) : getUsuariosDisponibles(),
      ]);
      if (!p || p.estado !== "enviada")
        throw new Error("El seguimiento solo está disponible después del envío al equipo IDEAR.");
      setConvocatoria(c);
      setPostulacion(p);
      setUsers(people);
      const s = await getSeguimiento(p.id);
      if (!s) throw new Error("No se encontró el seguimiento asociado al envío a IDEAR.");
      setDetail(await getSeguimientoDetalle(s.id));
    } catch (e) {
      setError(e.message);
    }
  }, [cacheScope, id, readOnly]);
  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);
  const run = async (work, message) => {
    setBusy(true);
    try {
      await work();
      setFeedback({ type: "success", message });
      await load();
    } catch (e) {
      setFeedback({ type: "error", message: e.message || "No se pudo completar la operación." });
    } finally {
      setBusy(false);
    }
  };
  if (error) return <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>;
  if (!convocatoria || !postulacion)
    return <p className="p-10 text-center">Cargando seguimiento...</p>;
  const seguimiento = detail?.seguimiento;
  const closed = seguimiento?.estado === "cerrado";
  return (
    <div className={embedded ? "module-section-enter" : "module-page-enter mx-auto max-w-6xl pb-10"}>
      {!embedded && (
        <>
          <button
            className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-slate-500 hover:bg-slate-100"
            onClick={() => navigate(`/gestion-proyectos/detecta/convocatorias/${id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a convocatoria
          </button>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold tracking-[.12em] text-emerald-700 uppercase">
              Gestión de Proyectos · Seguimiento
            </p>
            <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{convocatoria.nombre}</h1>
                <p className="mt-1 text-slate-500">{convocatoria.financiador_nombre}</p>
              </div>
              {seguimiento && (
                <Badge variant={closed ? "secondary" : "default"}>
                  {SEGUIMIENTO_ESTADOS[seguimiento.estado]}
                </Badge>
              )}
            </div>
            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
              <Info label="Identificación" value={postulacion.fecha_identificacion} />
              <Info
                label="Responsable"
                value={nameOf(postulacion.enviada?.persona) || "No disponible"}
              />
              <Info label="Líder IDEAR" value={postulacion.lider_idear_nombre || "-"} />
            </div>
          </section>
        </>
      )}
      {embedded && seguimiento && (
        <div className="flex justify-end">
          <Badge variant={closed ? "secondary" : "default"}>
            {SEGUIMIENTO_ESTADOS[seguimiento.estado]}
          </Badge>
        </div>
      )}
      {seguimiento && (
        <>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <Section
              title="Envío a equipo IDEAR"
              description="Responsable, revisiones y rango registrados para la postulación."
              icon={Send}
              tone="blue"
            >
              <Rows
                values={[
                  ["Líder IDEAR", postulacion.lider_idear_nombre],
                  ["Fecha de identificación", postulacion.fecha_identificacion],
                  ["Revisión de diseño", postulacion.fecha_revision_diseno],
                  ["Revisión de evidencias", postulacion.fecha_revision_evidencias],
                  ["Revisión de armado", postulacion.fecha_revision_armado],
                  ["Revisión de 1.ª réplica", postulacion.fecha_revision_primera_replica],
                  ["Rango de postulación", formatConvocatoriaOption(postulacion.rango_postulacion)],
                  ["Fecha de radicado", postulacion.fecha_envio],
                  ["Fecha estimada de respuesta", seguimiento.fecha_estimada_decision],
                ]}
              />
            </Section>
            <Section
              title="Resultado"
              description="Decisión final comunicada por la entidad financiadora."
              icon={FileCheck2}
              tone="emerald"
            >
              {seguimiento.tipo_resultado ? (
                <Rows
                  values={[
                    ["Tipo", seguimiento.tipo_resultado],
                    ["Fecha", seguimiento.fecha_resultado],
                    ["Observación", seguimiento.observacion_resultado],
                  ]}
                />
              ) : !readOnly && !closed ? (
                  <form
                    className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      run(
                        () => registrarResultadoSeguimiento(seguimiento.id, result),
                        "Resultado registrado.",
                      );
                    }}
                  >
                    <Field label="Tipo de resultado">
                      <input
                        required
                        className={fieldClass}
                        placeholder="Ej. Adjudicada"
                        value={result.tipo_resultado}
                        onChange={(e) => setResult({ ...result, tipo_resultado: e.target.value })}
                      />
                    </Field>
                    <Field label="Fecha del resultado">
                      <input
                        required
                        type="date"
                        className={fieldClass}
                        value={result.fecha}
                        onChange={(e) => setResult({ ...result, fecha: e.target.value })}
                      />
                    </Field>
                    <Field label="Observación">
                      <textarea
                        className={`${fieldClass} min-h-24 py-2.5`}
                        placeholder="Añade el contexto del resultado"
                        value={result.observacion}
                        onChange={(e) => setResult({ ...result, observacion: e.target.value })}
                      />
                    </Field>
                    <ActionButton action="confirm" icon={FileCheck2} disabled={busy} type="submit">
                      Registrar resultado
                    </ActionButton>
                  </form>
                ) : (
                  <EmptyState
                    icon={CalendarClock}
                    text="El resultado aún no ha sido registrado."
                  />
              )}
            </Section>
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Section
              title="Comunicaciones"
              description="Historial de mensajes enviados y recibidos."
              icon={MessageSquareText}
              count={detail.comunicaciones.length}
              tone="violet"
            >
              <div className="space-y-3">
                {detail.comunicaciones.map((item) => (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm" key={item.id}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-semibold text-slate-800">{item.asunto || "Sin asunto"}</p>
                      <Badge variant="secondary" className="capitalize">{item.direccion}</Badge>
                    </div>
                    <p className="mt-2 leading-6 text-slate-600">{item.resumen}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span>{new Date(item.fecha).toLocaleString("es-PE")}</span>
                      <span>·</span>
                      <span className="capitalize">{item.canal}</span>
                      {item.requiere_respuesta && (
                        <span className="font-medium text-amber-600">
                          · Respuesta hasta {item.fecha_limite || "sin plazo"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {!detail.comunicaciones.length && (
                  <EmptyState icon={Inbox} text="Aún no hay comunicaciones registradas." />
                )}
              </div>
              {!readOnly && !closed && (
                <form
                  className="mt-5 space-y-3 border-t border-slate-100 pt-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(
                      () => createComunicacion(seguimiento.id, communication),
                      "Comunicación registrada.",
                    );
                    setCommunication(blankCommunication);
                  }}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      aria-label="Dirección de la comunicación"
                      className={fieldClass}
                      value={communication.direccion}
                      onChange={(e) =>
                        setCommunication({ ...communication, direccion: e.target.value })
                      }
                    >
                      <option value="recibida">Recibida</option>
                      <option value="enviada">Enviada</option>
                    </select>
                    <input
                      className={fieldClass}
                      placeholder="Canal"
                      value={communication.canal}
                      onChange={(e) =>
                        setCommunication({ ...communication, canal: e.target.value })
                      }
                    />
                  </div>
                  <input
                    className={fieldClass}
                    placeholder="Asunto"
                    value={communication.asunto}
                    onChange={(e) => setCommunication({ ...communication, asunto: e.target.value })}
                  />
                  <textarea
                    required
                    className={`${fieldClass} min-h-24 py-2.5`}
                    placeholder="Resumen"
                    value={communication.resumen}
                    onChange={(e) =>
                      setCommunication({ ...communication, resumen: e.target.value })
                    }
                  />
                  <ActionButton action="confirm" icon={Mail} disabled={busy} type="submit">
                    Nueva comunicación
                  </ActionButton>
                </form>
              )}
            </Section>
            <Section
              title="Solicitudes de información"
              description="Requerimientos pendientes y respuestas del equipo."
              icon={ClipboardList}
              count={detail.solicitudes.length}
              tone="amber"
            >
              <div className="space-y-3">
                {detail.solicitudes.map((item) => (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm" key={item.id}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="leading-6 font-semibold text-slate-800">{item.descripcion}</p>
                      <Badge variant="secondary" className="shrink-0 capitalize">{item.estado}</Badge>
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                      <CalendarClock className="h-3.5 w-3.5" />
                      Responsable: {nameOf(item.responsable?.persona) || "Sin asignar"} · Plazo:{" "}
                      {item.fecha_limite || "Sin plazo"}
                    </p>
                    {item.respuesta && (
                      <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 leading-6 text-emerald-800">
                        <span className="font-semibold">Respuesta:</span> {item.respuesta}
                      </p>
                    )}
                    {item.estado === "pendiente" && !readOnly && !closed && (
                      <Button
                        className="mt-2"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const response = window.prompt("Respuesta de la solicitud:");
                          if (response)
                            run(
                              () => responderSolicitud(item.id, response),
                              "Solicitud respondida.",
                            );
                        }}
                      >
                        Responder
                      </Button>
                    )}
                  </div>
                ))}
                {!detail.solicitudes.length && (
                  <EmptyState icon={ClipboardList} text="No hay solicitudes de información." />
                )}
              </div>
              {!readOnly && !closed && (
                <form
                  className="mt-5 space-y-3 border-t border-slate-100 pt-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(() => createSolicitud(seguimiento.id, request), "Solicitud creada.");
                    setRequest({ descripcion: "", responsable_id: "", fecha_limite: "" });
                  }}
                >
                  <textarea
                    required
                    className={`${fieldClass} min-h-24 py-2.5`}
                    placeholder="Descripción de la solicitud"
                    value={request.descripcion}
                    onChange={(e) => setRequest({ ...request, descripcion: e.target.value })}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      aria-label="Responsable de la solicitud"
                      className={fieldClass}
                      value={request.responsable_id}
                      onChange={(e) => setRequest({ ...request, responsable_id: e.target.value })}
                    >
                      <option value="">Sin asignar</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {nameOf(user.persona) || user.id}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      aria-label="Fecha límite de la solicitud"
                      className={fieldClass}
                      value={request.fecha_limite}
                      onChange={(e) => setRequest({ ...request, fecha_limite: e.target.value })}
                    />
                  </div>
                  <ActionButton action="confirm" icon={Plus} disabled={busy} type="submit">
                    Nueva solicitud
                  </ActionButton>
                </form>
              )}
            </Section>
          </div>
          <Section
            title="Timeline de seguimiento"
            description="Secuencia cronológica de todas las acciones del proceso."
            icon={Activity}
            count={detail.eventos.length}
            className="mt-5"
          >
            <div className="relative space-y-0 before:absolute before:top-3 before:bottom-3 before:left-[7px] before:w-px before:bg-slate-200">
              {detail.eventos.map((event) => (
                <div className="relative pb-6 pl-8 text-sm last:pb-0" key={event.id}>
                  <span className="absolute top-1 left-0 z-10 h-3.5 w-3.5 rounded-full border-4 border-white bg-emerald-600 shadow-sm" />
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                    <p className="font-semibold capitalize text-slate-800">
                      {event.tipo.replaceAll("_", " ")}
                    </p>
                    {event.descripcion && (
                      <p className="mt-1 leading-6 text-slate-600">{event.descripcion}</p>
                    )}
                    <p className="mt-2 text-xs text-slate-400">
                      {new Date(event.fecha_evento).toLocaleString("es-PE")} ·{" "}
                      {nameOf(event.registrado?.persona) || "Usuario"}
                    </p>
                  </div>
                </div>
              ))}
              {!detail.eventos.length && (
                <EmptyState icon={Activity} text="Todavía no hay eventos de seguimiento." />
              )}
            </div>
          </Section>
        </>
      )}
      <FeedbackToast feedback={feedback} onClose={() => setFeedback(null)} />
    </div>
  );
}
const fieldClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

function Section({ title, description, icon: Icon, count, tone = "emerald", children, className = "" }) {
  const tones = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    violet: "border-violet-100 bg-violet-50 text-violet-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
  };

  return (
    <section className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${tones[tone]}`}>
              <Icon className="h-5 w-5" />
            </span>
          )}
          <div>
            <h2 className="font-semibold text-slate-900">{title}</h2>
            {description && <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p>}
          </div>
        </div>
        {typeof count === "number" && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
            {count}
          </span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-xs font-semibold text-slate-600">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm text-slate-500">{text}</p>
    </div>
  );
}
function Info({ label, value }) {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      <p className="font-medium">{value || "-"}</p>
    </div>
  );
}
function Rows({ values }) {
  return (
    <dl className="divide-y divide-slate-100">
      {values.map(([label, value]) => (
        <div className="grid gap-1 py-3 text-sm first:pt-0 last:pb-0 sm:grid-cols-[130px_1fr] sm:gap-4" key={label}>
          <dt className="text-slate-500">{label}</dt>
          <dd className="font-medium break-words text-slate-800">{value || "-"}</dd>
        </div>
      ))}
    </dl>
  );
}
