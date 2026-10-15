import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  CalendarDays,
  FileCheck2,
  FileText,
  Plus,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import FeedbackToast from "@/components/ui/FeedbackToast";
import EnlargeablePhoto from "@/components/ui/enlargeable-photo";
import { Input } from "@/components/ui/input";
import {
  estimarPermiso,
  proponerRecuperacionPermiso,
  solicitarPermiso,
} from "@/services/asistencia/asistenciaService";

const EMPTY_LEAVE = { tipo: "", fechas: [], motivo: "", adjunto: null };
const emptyRecovery = () => ({ fecha: "", hora_inicio: "", hora_fin: "" });
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const FIELD_CLASS =
  "rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 shadow-none outline-none transition-colors focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-500/10";

function minutesBetween(row) {
  if (!row.fecha || !row.hora_inicio || !row.hora_fin) return 0;
  return Math.max(
    0,
    Math.round(
      (new Date(`${row.fecha}T${row.hora_fin}`) - new Date(`${row.fecha}T${row.hora_inicio}`)) /
        60000,
    ),
  );
}
function formatMinutes(value = 0) {
  const minutes = Number(value) || 0;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}
function formatFileSize(size) {
  return size < 1024 * 1024
    ? `${Math.ceil(size / 1024)} KB`
    : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
function dayAfter(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
function formatDate(value) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
function todayInLima() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export default function AsistenciaPermisoNuevo() {
  const navigate = useNavigate();
  const today = todayInLima();
  const attachmentInputRef = useRef(null);
  const [leave, setLeave] = useState(EMPTY_LEAVE);
  const [permissionDate, setPermissionDate] = useState("");
  const [recoveries, setRecoveries] = useState([emptyRecovery()]);
  const [requiredMinutes, setRequiredMinutes] = useState(null);
  const [automaticDays, setAutomaticDays] = useState("");
  const [organizationSchedule, setOrganizationSchedule] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const previewUrl = useMemo(
    () => (leave.adjunto ? URL.createObjectURL(leave.adjunto) : ""),
    [leave.adjunto],
  );
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const recoveryMinutes = recoveries.reduce((total, row) => total + minutesBetween(row), 0);
  const recoveryMatches = requiredMinutes !== null && recoveryMinutes === requiredMinutes;
  const lastPermissionDate = leave.fechas.at(-1) || "";
  const medicalCertificateMissing = leave.tipo === "medico" && !leave.adjunto;

  function updateLeave(key, value) {
    setLeave((current) => ({ ...current, [key]: value }));
  }

  function updatePermissionDates(dates) {
    setLeave((current) => ({ ...current, fechas: [...dates].sort() }));
    setRequiredMinutes(null);
    setOrganizationSchedule(null);
  }

  function addPermissionDate() {
    if (!permissionDate || permissionDate < today || leave.fechas.includes(permissionDate)) return;
    updatePermissionDates([...leave.fechas, permissionDate]);
    setPermissionDate("");
  }

  async function calculateLeave() {
    if (!leave.fechas.length) return;
    setCalculating(true);
    setError("");
    try {
      const minutes = await estimarPermiso(leave.fechas);
      setRequiredMinutes(minutes);
      setRecoveries(minutes ? (recoveries.length ? recoveries : [emptyRecovery()]) : []);
    } catch (cause) {
      setError(cause?.message || "No se pudieron calcular las horas de recuperación.");
    } finally {
      setCalculating(false);
    }
  }

  async function generateAutomaticPlan() {
    const days = Number(automaticDays);
    if (!leave.fechas.length || !Number.isInteger(days) || days < 1) return;
    setGenerating(true);
    setError("");
    try {
      const result = await proponerRecuperacionPermiso(leave.fechas, days);
      setRequiredMinutes(Number(result.minutos) || 0);
      setRecoveries(result.recuperaciones || []);
      setOrganizationSchedule(result.jornada || null);
    } catch (cause) {
      setError(cause?.message || "No se pudo generar un plan compatible con tus horarios.");
    } finally {
      setGenerating(false);
    }
  }

  function selectAttachment(file) {
    if (!file) return;
    if (!ACCEPTED_TYPES.has(file.type)) {
      setError("Selecciona una imagen JPG, PNG o WEBP, o un documento PDF.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("El archivo no debe superar los 5 MB.");
      return;
    }
    setError("");
    setLeave((current) => ({ ...current, adjunto: file }));
    if (attachmentInputRef.current) attachmentInputRef.current.value = "";
  }

  async function submit(event) {
    event.preventDefault();
    if (
      !leave.tipo ||
      !leave.fechas.length ||
      leave.fechas.some((date) => date < today) ||
      medicalCertificateMissing ||
      !recoveryMatches ||
      leave.motivo.trim().length < 5
    ) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("tipo", leave.tipo);
      leave.fechas.forEach((date, index) => form.append(`fechas[${index}]`, date));
      form.append("motivo", leave.motivo.trim());
      if (leave.adjunto) form.append("adjunto", leave.adjunto);
      recoveries.forEach((row, index) =>
        Object.entries(row).forEach(([key, value]) =>
          form.append(`recuperaciones[${index}][${key}]`, value),
        ),
      );
      await solicitarPermiso(form);
      navigate("/asistencia/solicitudes", {
        replace: true,
        state: { feedback: "Permiso enviado para revisión." },
      });
    } catch (cause) {
      setError(cause?.message || "No se pudo enviar la solicitud de permiso.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="module-page-enter mx-auto max-w-5xl space-y-5 pb-10">
      <Button asChild variant="ghost" className="w-fit gap-2 rounded-xl px-2 text-slate-600">
        <Link to="/asistencia/solicitudes">
          <ArrowLeft className="h-4 w-4" />
          Volver a solicitudes
        </Link>
      </Button>
      <FeedbackToast
        feedback={error ? { type: "error", message: error } : null}
        onClose={() => setError("")}
      />

      <form
        onSubmit={submit}
        className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm"
      >
        <header className="bg-gradient-to-r from-[#244B34] via-[#2D5A3D] to-[#39724D] p-6 text-white">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              <CalendarClock className="h-6 w-6" />
            </span>
            <div>
              <p className="text-[10px] font-bold tracking-[0.12em] text-emerald-100 uppercase">
                Nueva solicitud
              </p>
              <h1 className="mt-1 text-2xl font-extrabold">Solicitar permiso</h1>
              <p className="mt-1 text-sm text-emerald-50/80">
                Registra el permiso y organiza una recuperación sin cruces con tu horario.
              </p>
            </div>
          </div>
        </header>

        <div className="space-y-7 p-5 sm:p-7">
          <section>
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                1
              </span>
              <h2 className="font-bold text-slate-800">Datos del permiso</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-xs font-bold text-slate-700">
                  Tipo de permiso
                </span>
                <span className="relative block">
                  <FileCheck2 className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    value={leave.tipo}
                    onChange={(event) => updateLeave("tipo", event.target.value)}
                    required
                    className={`${FIELD_CLASS} h-12 w-full appearance-none pr-4 pl-10 text-sm font-medium focus:bg-white`}
                  >
                    <option value="" disabled>
                      Seleccione un tipo de permiso
                    </option>
                    <option value="personal">Personal</option>
                    <option value="medico">Médico</option>
                    <option value="vacaciones">Vacaciones</option>
                  </select>
                </span>
              </label>
              <div className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-bold text-slate-700">
                  Fechas exactas del permiso
                </span>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <span className="relative block flex-1">
                    <CalendarDays className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="date"
                      min={today}
                      value={permissionDate}
                      onChange={(event) => setPermissionDate(event.target.value)}
                      className={`${FIELD_CLASS} h-12 pl-10 focus:bg-white`}
                    />
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      !permissionDate ||
                      permissionDate < today ||
                      leave.fechas.includes(permissionDate)
                    }
                    onClick={addPermissionDate}
                    className="h-12 gap-2 rounded-xl"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar fecha
                  </Button>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Agrega únicamente cada día que necesitas; pueden ser fechas no consecutivas.
                </p>
                {leave.fechas.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {leave.fechas.map((date) => (
                      <span
                        key={date}
                        className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800"
                      >
                        {formatDate(date)}
                        <button
                          type="button"
                          aria-label={`Quitar ${formatDate(date)}`}
                          onClick={() => updatePermissionDates(leave.fechas.filter((item) => item !== date))}
                          className="rounded-full text-emerald-600 hover:text-rose-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="sm:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={calculating || !leave.fechas.length}
                  onClick={() => void calculateLeave()}
                >
                  {calculating ? "Calculando..." : "Calcular horas por recuperar"}
                </Button>
                {requiredMinutes !== null ? (
                  <span className="ml-3 text-sm font-bold text-emerald-700">
                    {formatMinutes(requiredMinutes)}
                  </span>
                ) : null}
              </div>
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-bold text-slate-700">Motivo</span>
                <textarea
                  value={leave.motivo}
                  onChange={(event) => updateLeave("motivo", event.target.value)}
                  required
                  minLength={5}
                  maxLength={2000}
                  rows={4}
                  placeholder="Explica brevemente el motivo de tu solicitud..."
                  className={`${FIELD_CLASS} w-full p-3 text-sm focus:bg-white`}
                />
              </label>
            </div>
          </section>

          <section className="border-t border-slate-100 pt-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                2
              </span>
              <div>
                <h2 className="font-bold text-slate-800">
                  {leave.tipo === "medico" ? "Certificado médico" : "Documento o imagen de sustento"}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {leave.tipo === "medico"
                    ? "Obligatorio para permisos médicos."
                    : "Opcional para los demás tipos de permiso."}
                </p>
              </div>
            </div>
            <input
              ref={attachmentInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
              className="sr-only"
              onChange={(event) => selectAttachment(event.target.files?.[0])}
            />
            {leave.adjunto ? (
              <div className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 sm:flex-row sm:items-center">
                <div className="flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white sm:w-28">
                  {leave.adjunto.type.startsWith("image/") ? (
                    <EnlargeablePhoto
                      src={previewUrl}
                      alt="Vista previa del sustento"
                      className="h-full w-full rounded-xl"
                    />
                  ) : (
                    <FileText className="h-10 w-10 text-rose-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">{leave.adjunto.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatFileSize(leave.adjunto.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLeave((current) => ({ ...current, adjunto: null }))}
                >
                  <X className="mr-1 h-4 w-4" />
                  Quitar
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => attachmentInputRef.current?.click()}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setDragging(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  selectAttachment(event.dataTransfer.files?.[0]);
                }}
                className={`flex w-full flex-col items-center rounded-2xl border-2 border-dashed p-7 text-center transition ${dragging ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-slate-50 hover:border-emerald-300"}`}
              >
                <UploadCloud className="h-8 w-8 text-emerald-600" />
                <span className="mt-2 text-sm font-bold text-slate-800">
                  Arrastra aquí una imagen o PDF
                </span>
                <span className="mt-1 text-xs text-slate-500">
                  o haz clic para seleccionar · máximo 5 MB
                </span>
              </button>
            )}
          </section>

          <section className="border-t border-slate-100 pt-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                3
              </span>
              <h2 className="font-bold text-slate-800">Plan de recuperación</h2>
            </div>
            <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-violet-900">Generar automáticamente</p>
                  <p className="mt-1 text-xs leading-5 text-violet-700">
                    Busca espacios dentro de la jornada institucional, fuera de tu horario y sin
                    cruzar recuperaciones existentes.
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={automaticDays}
                      onChange={(event) => setAutomaticDays(event.target.value)}
                      placeholder="¿En cuántos días?"
                      className={`${FIELD_CLASS} h-11 focus:bg-white sm:max-w-[210px]`}
                    />
                    <Button
                      type="button"
                      disabled={
                        generating ||
                        !leave.fechas.length ||
                        Number(automaticDays) < 1
                      }
                      onClick={() => void generateAutomaticPlan()}
                      className="gap-2 bg-violet-700 text-white hover:bg-violet-800"
                    >
                      <Sparkles className="h-4 w-4" />
                      {generating ? "Generando..." : "Generar plan"}
                    </Button>
                  </div>
                  {organizationSchedule ? (
                    <p className="mt-2 text-[11px] font-semibold text-violet-700">
                      Jornada considerada: {organizationSchedule.hora_inicio}–
                      {organizationSchedule.hora_fin}.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {recoveries.map((row, index) => (
                <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-700">
                      Día {index + 1} · {formatMinutes(minutesBetween(row))}
                    </p>
                    <button
                      type="button"
                      aria-label="Eliminar recuperación"
                      onClick={() =>
                        setRecoveries((items) => items.filter((_, rowIndex) => rowIndex !== index))
                      }
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label>
                      <span className="mb-1 block text-[11px] font-bold text-slate-600">Fecha</span>
                      <Input
                        type="date"
                        min={dayAfter(lastPermissionDate)}
                        value={row.fecha}
                        onChange={(event) =>
                          setRecoveries((items) =>
                            items.map((item, rowIndex) =>
                              rowIndex === index ? { ...item, fecha: event.target.value } : item,
                            ),
                          )
                        }
                        required
                        className={`${FIELD_CLASS} h-11 focus:bg-white`}
                      />
                    </label>
                    <label>
                      <span className="mb-1 block text-[11px] font-bold text-slate-600">
                        Hora de inicio
                      </span>
                      <Input
                        type="time"
                        value={row.hora_inicio}
                        onChange={(event) =>
                          setRecoveries((items) =>
                            items.map((item, rowIndex) =>
                              rowIndex === index
                                ? { ...item, hora_inicio: event.target.value }
                                : item,
                            ),
                          )
                        }
                        required
                        className={`${FIELD_CLASS} h-11 focus:bg-white`}
                      />
                    </label>
                    <label>
                      <span className="mb-1 block text-[11px] font-bold text-slate-600">
                        Hora de fin
                      </span>
                      <Input
                        type="time"
                        value={row.hora_fin}
                        onChange={(event) =>
                          setRecoveries((items) =>
                            items.map((item, rowIndex) =>
                              rowIndex === index ? { ...item, hora_fin: event.target.value } : item,
                            ),
                          )
                        }
                        required
                        className={`${FIELD_CLASS} h-11 focus:bg-white`}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
            {requiredMinutes !== 0 ? (
              <button
                type="button"
                onClick={() => setRecoveries((items) => [...items, emptyRecovery()])}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700"
              >
                <Plus className="h-4 w-4" />
                Agregar otro día manualmente
              </button>
            ) : null}
            {requiredMinutes !== null && !recoveryMatches ? (
              <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-700">
                Programado: {formatMinutes(recoveryMinutes)}. Debe coincidir exactamente con{" "}
                {formatMinutes(requiredMinutes)}.
              </p>
            ) : null}
          </section>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
          <Button asChild type="button" variant="outline" className="h-11 rounded-xl">
            <Link to="/asistencia/solicitudes">Cancelar</Link>
          </Button>
          <ActionButton
            action="send"
            type="submit"
            loading={busy}
            loadingText="Enviando..."
            disabled={
              !leave.tipo ||
              !leave.fechas.length ||
              leave.fechas.some((date) => date < today) ||
              medicalCertificateMissing ||
              !recoveryMatches ||
              leave.motivo.trim().length < 5
            }
            className="h-11"
          >
            Enviar solicitud
          </ActionButton>
        </footer>
      </form>
    </div>
  );
}
