import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  FileCheck2,
  FileText,
  UploadCloud,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import EnlargeablePhoto from "@/components/ui/enlargeable-photo";
import { ActionButton } from "@/components/ui/action-button";
import AsistenciaRecoveryPlanEditor from "@/components/asistencia/AsistenciaRecoveryPlanEditor";
import FeedbackToast from "@/components/ui/FeedbackToast";
import { crearJustificacion, getMiHistorial } from "@/services/asistencia/asistenciaService";
import { recoveryMinutes } from "@/utils/asistenciaRecoveryUtils";

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const FIELD_CLASS =
  "rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 shadow-none outline-none transition-colors focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 focus-visible:border-rose-500 focus-visible:ring-4 focus-visible:ring-rose-500/10";

function formatDate(value) {
  if (!value) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatFileSize(size) {
  return size < 1024 * 1024
    ? `${Math.ceil(size / 1024)} KB`
    : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AsistenciaJustificacionNueva() {
  const { asistenciaId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const attachmentInputRef = useRef(null);
  const initialAbsence = location.state?.absence;
  const [absence, setAbsence] = useState(
    initialAbsence && String(initialAbsence.id) === asistenciaId ? initialAbsence : null,
  );
  const [loading, setLoading] = useState(!absence);
  const [reason, setReason] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [recoveries, setRecoveries] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const requiredMinutes = Number(absence?.minutos_incumplidos || 0);
  const recoveryMatches = requiredMinutes > 0 && recoveryMinutes(recoveries) === requiredMinutes;

  const previewUrl = useMemo(
    () => (attachment?.type.startsWith("image/") ? URL.createObjectURL(attachment) : ""),
    [attachment],
  );

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  useEffect(() => {
    if (absence) return;

    let active = true;
    getMiHistorial()
      .then((history) => {
        if (!active) return;
        const selected = history.find((item) => String(item.id) === asistenciaId);
        setAbsence(selected || null);
        if (!selected) setError("No se encontró la falta que deseas justificar.");
      })
      .catch((cause) => {
        if (active) setError(cause?.message || "No se pudo cargar la falta seleccionada.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [absence, asistenciaId]);

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
    setAttachment(file);
    if (attachmentInputRef.current) attachmentInputRef.current.value = "";
  }

  async function submit(event) {
    event.preventDefault();
    if (!absence || reason.trim().length < 5 || !recoveryMatches) return;

    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("motivo", reason.trim());
      if (attachment) form.append("adjunto", attachment);
      recoveries.forEach((row, index) => {
        Object.entries(row).forEach(([key, value]) => {
          form.append(`recuperaciones[${index}][${key}]`, value);
        });
      });
      await crearJustificacion(absence.id, form);
      navigate("/asistencia/faltas", {
        replace: true,
        state: { feedback: "Justificación enviada para revisión." },
      });
    } catch (cause) {
      setError(cause?.message || "No se pudo enviar la justificación.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="module-page-enter mx-auto max-w-5xl space-y-5 pb-10">
      <Button asChild variant="ghost" className="w-fit gap-2 rounded-xl px-2 text-slate-600">
        <Link to="/asistencia/faltas">
          <ArrowLeft className="h-4 w-4" />
          Volver a faltas
        </Link>
      </Button>

      <FeedbackToast
        feedback={error ? { type: "error", message: error } : null}
        onClose={() => setError("")}
      />

      <form
        onSubmit={submit}
        className="overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-sm"
      >
        <header className="bg-gradient-to-r from-[#7F1D1D] via-[#991B1B] to-[#BE123C] p-6 text-white">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              <FileCheck2 className="h-6 w-6" />
            </span>
            <div>
              <p className="text-[10px] font-bold tracking-[0.12em] text-rose-100 uppercase">
                Nueva justificación
              </p>
              <h1 className="mt-1 text-2xl font-extrabold">Justificar falta</h1>
              <p className="mt-1 text-sm text-rose-50/80">
                Explica el motivo de tu inasistencia y adjunta un sustento si corresponde.
              </p>
            </div>
          </div>
        </header>

        <div className="space-y-7 p-5 sm:p-7">
          <section>
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-700">
                1
              </span>
              <h2 className="font-bold text-slate-800">Datos de la justificación</h2>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                Cargando la falta seleccionada...
              </div>
            ) : absence ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
                  <div className="flex items-start gap-3">
                    <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" />
                    <div>
                      <p className="text-[10px] font-bold tracking-[0.1em] text-rose-700 uppercase">
                        Falta seleccionada
                      </p>
                      <p className="mt-1 font-bold capitalize text-slate-900">
                        {formatDate(absence.fecha)}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Horario: {String(absence.hora_inicio_programada || "").slice(0, 5)} a{" "}
                        {String(absence.hora_fin_programada || "").slice(0, 5)}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="mb-1.5 block text-xs font-bold text-slate-700">
                    <label htmlFor="justification-reason">Motivo de la justificación</label>
                  </span>
                  <textarea
                    id="justification-reason"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    required
                    minLength={5}
                    maxLength={2000}
                    rows={5}
                    placeholder="Explica brevemente el motivo de tu inasistencia..."
                    className={`${FIELD_CLASS} w-full p-3 text-sm focus:bg-white`}
                  />
                  <span className="mt-1.5 block text-xs text-slate-500">
                    Escribe al menos 5 caracteres.
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                Regresa al registro de faltas y selecciona una falta disponible.
              </div>
            )}
          </section>

          <section className="border-t border-slate-100 pt-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-700">
                2
              </span>
              <div>
                <h2 className="font-bold text-slate-800">Sustento</h2>
                <p className="mt-0.5 text-xs text-slate-500">Opcional.</p>
              </div>
            </div>

            <input
              ref={attachmentInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
              className="sr-only"
              onChange={(event) => selectAttachment(event.target.files?.[0])}
            />

            {attachment ? (
              <div className="flex flex-col gap-4 rounded-2xl border border-rose-200 bg-rose-50/50 p-4 sm:flex-row sm:items-center">
                <div className="flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white sm:w-28">
                  {previewUrl ? (
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
                  <p className="truncate text-sm font-bold text-slate-800">{attachment.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatFileSize(attachment.size)}</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setAttachment(null)}>
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
                className={`flex w-full flex-col items-center rounded-2xl border-2 border-dashed p-7 text-center transition ${dragging ? "border-rose-500 bg-rose-50" : "border-slate-200 bg-slate-50 hover:border-rose-300"}`}
              >
                <UploadCloud className="h-8 w-8 text-rose-600" />
                <span className="mt-2 text-sm font-bold text-slate-800">
                  Arrastra aquí una imagen o PDF
                </span>
                <span className="mt-1 text-xs text-slate-500">
                  o haz clic para seleccionar · máximo 5 MB
                </span>
              </button>
            )}
          </section>

          {absence ? (
            <section className="border-t border-slate-100 pt-1">
              <AsistenciaRecoveryPlanEditor
                requiredMinutes={requiredMinutes}
                incidentDate={absence.fecha}
                recoveries={recoveries}
                setRecoveries={setRecoveries}
                busy={busy}
                onError={setError}
              />
            </section>
          ) : null}
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
          <Button asChild type="button" variant="outline" className="h-11 rounded-xl">
            <Link to="/asistencia/faltas">Cancelar</Link>
          </Button>
          <ActionButton
            action="send"
            tone="danger"
            type="submit"
            loading={busy}
            loadingText="Enviando..."
            disabled={!absence || reason.trim().length < 5 || !recoveryMatches}
            className="h-11"
          >
            Enviar justificación
          </ActionButton>
        </footer>
      </form>
    </div>
  );
}
