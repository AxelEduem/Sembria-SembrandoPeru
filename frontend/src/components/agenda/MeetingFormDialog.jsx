import { CalendarPlus, Clock3, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";

import {
  minutesToTime,
  toMinutes,
} from "@/components/horario/DisponibilidadIntegrantes/disponibilidadUtils";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const fieldClass =
  "h-11 w-full rounded-none border-0 border-b-2 border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-emerald-50/30";
const LIMA_TIME_ZONE = "America/Lima";

function getCurrentLimaDateTime() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: LIMA_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

function toLocalDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getAllowedDates(isoDay, count = 16) {
  const targetDay = Number(isoDay);
  if (!Number.isInteger(targetDay) || targetDay < 1 || targetDay > 7) return [];

  const first = new Date();
  first.setHours(12, 0, 0, 0);
  const currentIsoDay = first.getDay() || 7;
  first.setDate(first.getDate() + ((targetDay - currentIsoDay + 7) % 7));

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(first);
    date.setDate(first.getDate() + index * 7);
    return {
      value: toLocalDateValue(date),
      label: new Intl.DateTimeFormat("es-PE", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(date),
    };
  });
}

function getTimeOptions(start, end, { includeStart = true, includeEnd = true } = {}) {
  const first = Number(start);
  const last = Number(end);
  if (!Number.isFinite(first) || !Number.isFinite(last) || first >= last) return [];

  const options = [];
  let current = includeStart ? first : first + 15;

  while (current < last) {
    options.push(minutesToTime(current));
    current += 15;
  }

  if (includeEnd && (!options.length || options.at(-1) !== minutesToTime(last))) {
    options.push(minutesToTime(last));
  }

  return options;
}

function createInitialForm(availability, people, currentAccountId) {
  const start = availability?.start ?? 0;
  const end = availability?.end ?? start;

  return {
    titulo: "",
    descripcion: "",
    fecha: "",
    horaInicio: minutesToTime(start),
    horaFin: minutesToTime(end),
    modalidad: "virtual",
    ubicacion: "",
    enlace: "",
    participantes: people
      .map((person) => person.id)
      .filter((id) => String(id) !== String(currentAccountId)),
  };
}

function MeetingFormDialog({
  open,
  onOpenChange,
  availability,
  people = [],
  currentAccountId,
  saving,
  onSubmit,
}) {
  const allowedDates = useMemo(() => getAllowedDates(availability?.day), [availability?.day]);
  const [form, setForm] = useState(() => {
    const initial = createInitialForm(availability, people, currentAccountId);
    return { ...initial, fecha: allowedDates[0]?.value || "" };
  });
  const [validation, setValidation] = useState("");

  const rangeStart = minutesToTime(availability?.start);
  const rangeEnd = minutesToTime(availability?.end);
  const selectedEnd = toMinutes(form.horaFin) ?? availability.end;
  const selectedStart = toMinutes(form.horaInicio) ?? availability.start;
  const startOptions = useMemo(
    () =>
      getTimeOptions(availability.start, Math.min(selectedEnd, availability.end), {
        includeEnd: false,
      }),
    [availability.end, availability.start, selectedEnd],
  );
  const endOptions = useMemo(
    () =>
      getTimeOptions(Math.max(selectedStart, availability.start), availability.end, {
        includeStart: false,
      }),
    [availability.end, availability.start, selectedStart],
  );
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleOpenChange = (nextOpen) => {
    if (!saving) onOpenChange(nextOpen);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.titulo.trim() || !form.fecha || !form.horaInicio || !form.horaFin) {
      setValidation("Completa el título, la fecha y las horas de la reunión.");
      return;
    }
    if (form.titulo.trim().length < 3) {
      setValidation("El título debe tener al menos 3 caracteres.");
      return;
    }
    if (!allowedDates.some((item) => item.value === form.fecha)) {
      setValidation(
        `La fecha debe corresponder a un ${availability?.dayLabel || "día disponible"}.`,
      );
      return;
    }

    const start = toMinutes(form.horaInicio);
    const end = toMinutes(form.horaFin);
    if (start === null || end === null || end <= start) {
      setValidation("La hora final debe ser posterior a la hora de inicio.");
      return;
    }
    const currentLimaDateTime = getCurrentLimaDateTime();
    if (form.fecha === currentLimaDateTime.date && start <= currentLimaDateTime.minutes) {
      setValidation("La reunión debe programarse para una hora posterior a la hora actual.");
      return;
    }
    if (start < availability.start || end > availability.end) {
      setValidation(`La reunión debe mantenerse dentro del rango ${rangeStart} - ${rangeEnd}.`);
      return;
    }
    if (!form.participantes.length) {
      setValidation("Selecciona al menos un participante.");
      return;
    }

    setValidation("");
    const result = await onSubmit(form);
    if (result === true) {
      handleOpenChange(false);
    } else if (typeof result === "string") {
      setValidation(result);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-2rem)] overflow-hidden border-0 bg-slate-100 p-0 shadow-2xl sm:max-w-[720px] sm:rounded-lg">
        <DialogHeader className="relative overflow-hidden bg-slate-900 px-6 py-6 text-white">
          <div className="absolute top-0 left-0 h-full w-1.5 bg-emerald-500" />

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center border border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
              <CalendarPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-white">Nueva reunión</DialogTitle>
              <DialogDescription className="mt-1 text-slate-300">
                Programa la reunión dentro del momento disponible seleccionado.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="max-h-[calc(92vh-100px)] space-y-4 overflow-y-auto px-6 py-5"
        >
          <div className="grid border-l-4 border-emerald-500 bg-white shadow-sm sm:grid-cols-[180px_1fr]">
            <div className="flex flex-col justify-center bg-emerald-50 px-4 py-4">
              <span className="text-[9px] font-extrabold tracking-[0.16em] text-emerald-600 uppercase">
                Bloque elegido
              </span>
              <div className="mt-1.5 flex items-center gap-2 text-sm font-extrabold text-emerald-900">
                <Clock3 className="h-4 w-4" />
                {rangeStart} - {rangeEnd}
              </div>
              <p className="mt-1 text-[11px] font-semibold text-emerald-700">
                {availability.dayLabel}
              </p>
            </div>
            <div className="flex flex-wrap content-center gap-2 p-4">
              {people.map((person) => (
                <span
                  key={person.id}
                  className="inline-flex items-center gap-1.5 border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600"
                >
                  <UsersRound className="h-3 w-3 text-emerald-600" />
                  {person.nombre}
                  {String(person.id) === String(currentAccountId) ? " (Tú)" : ""}
                </span>
              ))}
            </div>
          </div>

          <div className="border border-slate-200 bg-white p-4 shadow-sm">
            <label className="mb-2 block text-[10px] font-extrabold tracking-[0.12em] text-slate-500 uppercase">
              Título de la reunión *
            </label>
            <input
              className={fieldClass}
              maxLength={120}
              value={form.titulo}
              onChange={(event) => update("titulo", event.target.value)}
              placeholder="Ej. Revisión del plan de trabajo"
            />
          </div>

          <div className="grid gap-4 border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Fecha *</label>
              <select
                className={fieldClass}
                value={form.fecha}
                onChange={(event) => update("fecha", event.target.value)}
              >
                {allowedDates.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Inicio *</label>
              <select
                className={fieldClass}
                value={form.horaInicio}
                onChange={(event) => update("horaInicio", event.target.value)}
              >
                {startOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Fin *</label>
              <select
                className={fieldClass}
                value={form.horaFin}
                onChange={(event) => update("horaFin", event.target.value)}
              >
                {endOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="px-1 text-[10px] text-slate-500">
            Solo puedes elegir fechas de {availability.dayLabel} y horas entre {rangeStart} y{" "}
            {rangeEnd}.
          </p>

          <div className="grid gap-4 border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Modalidad</label>
              <select
                className={fieldClass}
                value={form.modalidad}
                onChange={(event) => update("modalidad", event.target.value)}
              >
                <option value="virtual">Virtual</option>
                <option value="presencial">Presencial</option>
                <option value="hibrida">Híbrida</option>
              </select>
            </div>
            {form.modalidad !== "virtual" && (
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">Lugar</label>
                <input
                  className={fieldClass}
                  value={form.ubicacion}
                  onChange={(event) => update("ubicacion", event.target.value)}
                  placeholder="Sala o dirección (opcional)"
                />
              </div>
            )}
          </div>

          {form.modalidad !== "presencial" && (
            <div className="border border-slate-200 bg-white p-4 shadow-sm">
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Enlace <span className="font-normal text-slate-400">(opcional)</span>
              </label>
              <input
                className={fieldClass}
                value={form.enlace}
                onChange={(event) => update("enlace", event.target.value)}
                placeholder="https://meet..."
              />
            </div>
          )}

          <div className="border border-slate-200 bg-white p-4 shadow-sm">
            <label className="mb-2 block text-[10px] font-extrabold tracking-[0.12em] text-slate-500 uppercase">
              Descripción{" "}
              <span className="font-medium tracking-normal text-slate-400 normal-case">
                (opcional)
              </span>
            </label>
            <textarea
              className="min-h-24 w-full resize-none rounded-none border-0 border-b-2 border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 transition outline-none focus:border-emerald-500 focus:bg-emerald-50/30"
              value={form.descripcion}
              onChange={(event) => update("descripcion", event.target.value)}
              placeholder="Tema, acuerdos previos o indicaciones..."
            />
          </div>

          {validation && (
            <p className="border-l-4 border-red-500 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
              {validation}
            </p>
          )}

          <DialogFooter className="">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <ActionButton
              action="send"
              type="submit"
              loading={saving}
              loadingText="Enviando..."
            >
              Enviar solicitud
            </ActionButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default MeetingFormDialog;
