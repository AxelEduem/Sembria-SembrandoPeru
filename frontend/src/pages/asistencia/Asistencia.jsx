/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";

import { AlertCircle, CalendarDays, CalendarOff, ClipboardList, ShieldAlert, WifiOff } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import FeedbackToast from "@/components/ui/FeedbackToast";
import ManualButton from "@/components/ui/ManualButton";
import { useAuth } from "@/contexts/AuthContext";

import {
  getBloquesHoy,
  getCalendarioAsistencia,
  iniciarAsistenciaConMotivo,
  iniciarRecuperacion,
  terminarAsistenciaAnticipada,
  terminarAsistencia,
  sincronizarAsistenciaPendiente,
} from "@/services/asistencia/asistenciaService";

import { getLimaMinutesNow, getTimeMinutes } from "@/utils/asistenciaDateUtils";

import AsistenciaStyles from "@/components/asistencia/AsistenciaStyles";
import AsistenciaHero from "@/components/asistencia/AsistenciaHero";
import AsistenciaToday from "@/components/asistencia/AsistenciaToday";

import AsistenciaLateEntryModal from "@/components/asistencia/modals/AsistenciaLateEntryModal";
import AsistenciaEarlyFinishModal from "@/components/asistencia/modals/AsistenciaEarlyFinishModal";
import AsistenciaFinishModal from "@/components/asistencia/modals/AsistenciaFinishModal";
import { recoveryMinutes } from "@/utils/asistenciaRecoveryUtils";

export default function Asistencia() {
  const { profile } = useAuth();

  const requiereAsistencia = profile?.tipo_integrante !== "gerente";

  const [blocks, setBlocks] = useState([]);
  const [todayHoliday, setTodayHoliday] = useState(null);

  const [loading, setLoading] = useState(true);

  const [busy, setBusy] = useState(false);

  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [online, setOnline] = useState(() => navigator.onLine);
  const [lastSynced, setLastSynced] = useState(null);

  const [lateEntryBlock, setLateEntryBlock] = useState(null);

  const [lateEntryMinutes, setLateEntryMinutes] = useState(0);
  const [lateEntryOccurredAt, setLateEntryOccurredAt] = useState(null);

  const [lateEntryReason, setLateEntryReason] = useState("");
  const [lateEntryRecoveries, setLateEntryRecoveries] = useState([]);

  const [earlyFinishBlock, setEarlyFinishBlock] = useState(null);

  const [earlyFinishDescription, setEarlyFinishDescription] = useState("");
  const [earlyFinishReason, setEarlyFinishReason] = useState("");
  const [earlyFinishAttachment, setEarlyFinishAttachment] = useState(null);
  const [earlyFinishRecoveries, setEarlyFinishRecoveries] = useState([]);
  const [earlyFinishMinutes, setEarlyFinishMinutes] = useState(0);
  const [earlyFinishOccurredAt, setEarlyFinishOccurredAt] = useState(null);

  const [finishModalBlock, setFinishModalBlock] = useState(null);

  const [finishDescription, setFinishDescription] = useState("");

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");

    try {
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Lima",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
      const [result, holidays] = await Promise.all([
        getBloquesHoy({ force: silent }),
        getCalendarioAsistencia(today, today, { force: silent }),
      ]);

      setBlocks(result || []);
      setTodayHoliday((holidays || [])[0] || null);
      setLastSynced(new Date());
    } catch (cause) {
      setError(cause?.message || "No se pudo cargar la información de asistencia.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      void sincronizarAsistenciaPendiente().then(({ synchronized }) => {
        if (synchronized > 0) setFeedback(`${synchronized} registro(s) offline sincronizado(s).`);
        void load({ silent: true });
      });
    };
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [load]);

  useEffect(() => {
    if (!requiereAsistencia) return;
    void load();

    const interval = window.setInterval(() => {
      void load({ silent: true });
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [load, requiereAsistencia]);

  const reconcile = useCallback((payload) => {
    const eventType = payload?.eventType || "UPDATE";

    const item = eventType === "DELETE" ? payload?.old : payload?.new;

    const id = Number(item?.id);

    if (!Number.isInteger(id) || id <= 0) {
      return;
    }

    setBlocks((current) => {
      if (eventType === "DELETE") {
        return current.map((block) =>
          Number(block.id) === id
            ? {
                ...block,
                id: null,
                hora_entrada: null,
                hora_salida: null,
                minutos_realizados: 0,
                minutos_tardanza: 0,
                minutos_salida_anticipada: 0,
                minutos_incumplidos: 0,
                asistencia_incidencias: [],
                estado: "pendiente",
              }
            : block,
        );
      }

      return current.map((block) => {
        const sameAttendance = Number(block.id) === id;

        const sameSchedule =
          String(block.fecha) === String(item.fecha) &&
          Number(block.horario_id) === Number(item.horario_id) &&
          Number(block.integrante_id || item.integrante_id) === Number(item.integrante_id);

        if (!sameAttendance && !sameSchedule) {
          return block;
        }

        return {
          ...block,
          ...item,
        };
      });
    });
  }, []);

  const run = useCallback(
    async (operation, successMessage) => {
      setBusy(true);
      setError("");
      setFeedback("");

      try {
        const result = await operation();

        if (result?.horario_id) {
          reconcile({
            eventType: "UPDATE",
            new: result,
          });
        }
        if (result?.tipo_bloque === "recuperacion") {
          await load({ silent: true });
        }
        setFeedback(
          result?.queued
            ? "Registro guardado en este dispositivo. Se enviará al recuperar conexión."
            : successMessage || "Operación registrada correctamente.",
        );

        return result;
      } catch (cause) {
        setError(cause?.message || "No se pudo completar la operación de asistencia.");

        return null;
      } finally {
        setBusy(false);
      }
    },
    [load, reconcile],
  );

  const openLateEntryModal = useCallback((block, minutesLate, occurredAt) => {
    setLateEntryBlock(block);
    setLateEntryMinutes(minutesLate);
    setLateEntryOccurredAt(occurredAt);
    setLateEntryReason("");
    setLateEntryRecoveries([]);
  }, []);

  const closeLateEntryModal = useCallback(() => {
    if (busy) return;

    setLateEntryBlock(null);
    setLateEntryMinutes(0);
    setLateEntryOccurredAt(null);
    setLateEntryReason("");
    setLateEntryRecoveries([]);
  }, [busy]);

  const confirmLateEntry = useCallback(async () => {
    if (!lateEntryBlock) return;

    const reason = lateEntryReason.trim();

    if (reason.length < 5 || recoveryMinutes(lateEntryRecoveries) !== lateEntryMinutes) return;

    const result = await run(
      () => lateEntryBlock.tipo_bloque === "recuperacion"
        ? iniciarRecuperacion(
            lateEntryBlock.recuperacion_id,
            reason,
            lateEntryRecoveries,
            lateEntryOccurredAt,
          )
        : iniciarAsistenciaConMotivo(
            lateEntryBlock.horario_id,
            reason,
            lateEntryRecoveries,
            lateEntryOccurredAt,
          ),
      "Entrada registrada correctamente.",
    );

    if (result) {
      closeLateEntryModal();
    }
  }, [lateEntryBlock, lateEntryReason, lateEntryRecoveries, lateEntryMinutes, lateEntryOccurredAt, run, closeLateEntryModal]);

  const startBlock = useCallback(
    (block) => {
      const occurredAt = new Date();
      const currentMinutes = getLimaMinutesNow(occurredAt);

      const startMinutes = getTimeMinutes(block.hora_inicio_programada);

      if (startMinutes === null) {
        setError("No se pudo determinar la hora de inicio del bloque.");

        return;
      }

      const minutesLate = currentMinutes - startMinutes;

      if (minutesLate < -5) {
        setError(
          `Este bloque se habilita 5 minutos antes de su inicio (${String(
            block.hora_inicio_programada,
          ).slice(0, 5)}).`,
        );

        return;
      }

      if (minutesLate > 10) {
        openLateEntryModal(block, minutesLate, occurredAt.toISOString());

        return;
      }

      void run(
        () => block.tipo_bloque === "recuperacion"
          ? iniciarRecuperacion(block.recuperacion_id)
          : iniciarAsistenciaConMotivo(block.horario_id, ""),
        "Entrada registrada correctamente.",
      );
    },
    [openLateEntryModal, run],
  );

  const openFinishModal = useCallback((block) => {
    if (!block?.id) return;

    setFinishModalBlock(block);
    setFinishDescription("");
  }, []);

  const closeFinishModal = useCallback(() => {
    if (busy) return;

    setFinishModalBlock(null);
    setFinishDescription("");
  }, [busy]);

  const confirmFinish = useCallback(async () => {
    const description = finishDescription.trim();

    if (!finishModalBlock?.id || description.length < 5) {
      return;
    }

    const result = await run(
      () =>
        terminarAsistencia(finishModalBlock.id, {
          descripcion: description,
        }),
      "Jornada finalizada correctamente.",
    );

    if (result) closeFinishModal();
  }, [finishDescription, finishModalBlock, run, closeFinishModal]);

  const openEarlyFinishModal = useCallback((block) => {
    const occurredAt = new Date();
    const scheduledEnd = new Date(`${block.fecha}T${String(block.hora_fin_programada).slice(0, 5)}:00-05:00`);
    setEarlyFinishBlock(block);
    setEarlyFinishDescription("");
    setEarlyFinishReason("");
    setEarlyFinishAttachment(null);
    setEarlyFinishRecoveries([]);
    setEarlyFinishMinutes(Math.max(1, Math.floor((scheduledEnd - occurredAt) / 60000)));
    setEarlyFinishOccurredAt(occurredAt.toISOString());
  }, []);

  const closeEarlyFinishModal = useCallback(() => {
    if (busy) return;

    setEarlyFinishBlock(null);
    setEarlyFinishDescription("");
    setEarlyFinishReason("");
    setEarlyFinishAttachment(null);
    setEarlyFinishRecoveries([]);
    setEarlyFinishMinutes(0);
    setEarlyFinishOccurredAt(null);
  }, [busy]);

  const confirmEarlyFinish = useCallback(async () => {
    if (!earlyFinishBlock) return;

    const description = earlyFinishDescription.trim();
    const reason = earlyFinishReason.trim();

    if (description.length < 5 || reason.length < 5 || recoveryMinutes(earlyFinishRecoveries) !== earlyFinishMinutes) {
      return;
    }

    const result = await run(
      () =>
        terminarAsistenciaAnticipada(earlyFinishBlock.id, {
          descripcion: description,
          motivo_salida: reason,
          ocurrido_en: earlyFinishOccurredAt,
          adjunto: earlyFinishAttachment,
          recuperaciones: earlyFinishRecoveries,
        }),
      "Jornada finalizada. Tu solicitud de salida anticipada quedó pendiente de revisión.",
    );

    if (result) {
      closeEarlyFinishModal();
    }
  }, [earlyFinishBlock, earlyFinishDescription, earlyFinishReason, earlyFinishAttachment, earlyFinishRecoveries, earlyFinishMinutes, earlyFinishOccurredAt, run, closeEarlyFinishModal]);

  if (!requiereAsistencia) {
    return (
      <div className="module-page-enter space-y-5 pb-8">
        <AsistenciaStyles />

        <div className="flex justify-end">
          <ManualButton to="/asistencia/manual" />
        </div>

        <section className="asistencia-section-enter rounded-2xl border border-emerald-100 bg-emerald-50 px-6 py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <AlertCircle className="h-6 w-6 text-emerald-700" strokeWidth={1.8} />
          </div>

          <h2 className="mt-4 text-lg font-bold text-emerald-900">
            Tu rol no requiere marcar asistencia
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-emerald-800">
            Como gerente, tu horario se usa solo para agendar reuniones. No necesitas registrar
            entrada ni salida.
          </p>

          <p className="mt-4 text-xs text-emerald-700">
            Si necesitas consultar tu disponibilidad, ve a{" "}
            <Link to="/mi-horario" className="font-semibold underline">
              Mi horario
            </Link>
            .
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="module-page-enter space-y-5 pb-8">
      <AsistenciaStyles />

      <div className="module-section-enter flex flex-wrap justify-end gap-2">
        <ManualButton to="/asistencia/manual" />
        <Button
          asChild
          variant="outline"
          className="h-10 gap-2 rounded-xl border-rose-200 bg-white px-4 text-rose-700 shadow-none hover:bg-rose-50 hover:text-rose-800"
        >
          <Link to="/asistencia/faltas">
            <ShieldAlert className="h-4 w-4" />
            Faltas
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-10 gap-2 rounded-xl border-emerald-200 bg-white px-4 text-emerald-700 shadow-none hover:bg-emerald-50 hover:text-emerald-800"
        >
          <Link to="/asistencia/solicitudes">
            <ClipboardList className="h-4 w-4" />
            Solicitudes
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-10 gap-2 rounded-xl border-slate-300 bg-white px-4 text-slate-700 shadow-none hover:bg-slate-100 hover:text-slate-900"
        >
          <Link to="/asistencia/historial">
            <CalendarDays className="h-4 w-4" strokeWidth={1.8} />
            Calendario
          </Link>
        </Button>
      </div>

      <AsistenciaHero profile={profile} realtimeStatus={online ? "synced" : "offline"} />

      {todayHoliday ? (
        <div className={`flex items-start gap-3 rounded-2xl border px-4 py-4 ${todayHoliday.requiere_asistencia ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>
          <CalendarOff className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-bold">{todayHoliday.nombre}</p>
            <p className="mt-1 text-xs leading-5">
              {todayHoliday.requiere_asistencia
                ? "Es un feriado oficial, pero la organización ha establecido jornada laboral para hoy."
                : "Hoy no se requiere registrar asistencia y no se generarán faltas ni recordatorios."}
            </p>
          </div>
        </div>
      ) : null}

      {!online ? (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="flex gap-2">
            <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
            Sin conexión. No se enviarán registros hasta reconectarte.
          </span>
          <button type="button" onClick={() => void load()} className="font-bold underline">
            Reintentar
          </button>
        </div>
      ) : lastSynced ? (
        <p className="text-right text-[10px] text-slate-400">
          Actualizado a las{" "}
          {lastSynced.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
        </p>
      ) : null}

      <FeedbackToast
        feedback={
          error
            ? { type: "error", message: error }
            : feedback
              ? { type: "success", message: feedback }
              : null
        }
        onClose={() => {
          setError("");
          setFeedback("");
        }}
      />

      <AsistenciaToday
        blocks={blocks}
        loading={loading}
        busy={busy}
        onStart={startBlock}
        onFinish={openFinishModal}
        onEarlyFinish={openEarlyFinishModal}
      />

      <AsistenciaLateEntryModal
        block={lateEntryBlock}
        lateMinutes={lateEntryMinutes}
        occurredAt={lateEntryOccurredAt}
        reason={lateEntryReason}
        setReason={setLateEntryReason}
        recoveries={lateEntryRecoveries}
        setRecoveries={setLateEntryRecoveries}
        onError={setError}
        busy={busy}
        onCancel={closeLateEntryModal}
        onConfirm={confirmLateEntry}
      />

      <AsistenciaEarlyFinishModal
        block={earlyFinishBlock}
        description={earlyFinishDescription}
        setDescription={setEarlyFinishDescription}
        reason={earlyFinishReason}
        setReason={setEarlyFinishReason}
        attachment={earlyFinishAttachment}
        setAttachment={setEarlyFinishAttachment}
        recoveries={earlyFinishRecoveries}
        setRecoveries={setEarlyFinishRecoveries}
        requiredMinutes={earlyFinishMinutes}
        onError={setError}
        busy={busy}
        onCancel={closeEarlyFinishModal}
        onConfirm={confirmEarlyFinish}
      />

      <AsistenciaFinishModal
        block={finishModalBlock}
        description={finishDescription}
        setDescription={setFinishDescription}
        busy={busy}
        onCancel={closeFinishModal}
        onConfirm={confirmFinish}
      />
    </div>
  );
}
