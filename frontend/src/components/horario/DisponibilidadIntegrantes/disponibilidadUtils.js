import { DIAS_SEMANA } from "@/services/integrantes-horarios/integrantesHorariosService";

export const TIMELINE_START = 8 * 60;
export const TIMELINE_END = 18 * 60;

export const TIMELINE_HOURS = Array.from({ length: 11 }, (_, index) => 8 + index);

export function toMinutes(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const [hours, minutes] = value.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

export function minutesToTime(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "--:--";
  }

  const hours = Math.floor(numericValue / 60);
  const minutes = numericValue % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("es-PE");
}

export function getDay(dayValue) {
  return DIAS_SEMANA.find((item) => Number(item.value) === Number(dayValue));
}

export function getDayLabel(dayValue) {
  const day = getDay(dayValue);

  return day?.label || day?.shortLabel || "Día";
}

export function getDayShortLabel(dayValue) {
  const day = getDay(dayValue);

  if (day?.shortLabel) {
    return day.shortLabel;
  }

  const label = day?.label || "Día";

  return label.slice(0, 3);
}

export function mergeIntervals(intervals) {
  if (!intervals.length) {
    return [];
  }

  const sorted = [...intervals].sort(
    (first, second) => first.start - second.start || first.end - second.end,
  );

  const merged = [
    {
      start: sorted[0].start,
      end: sorted[0].end,
    },
  ];

  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push({
        start: current.start,
        end: current.end,
      });
    }
  }

  return merged;
}

export function intersectIntervals(current, next) {
  const result = [];

  current.forEach((first) => {
    next.forEach((second) => {
      const start = Math.max(first.start, second.start);
      const end = Math.min(first.end, second.end);

      if (start < end) {
        result.push({
          start,
          end,
        });
      }
    });
  });

  return mergeIntervals(result);
}

/**
 * Calcula los horarios comunes entre todos los integrantes.
 */
export function calculateCommonAvailability(people) {
  if (people.length < 2) {
    return [];
  }

  const rawResult = DIAS_SEMANA.flatMap((day) => {
    let common = null;

    for (const person of people) {
      const intervals = (person.horarios || [])
        .filter((block) => Number(block.dia_semana) === Number(day.value))
        .map((block) => {
          const rawStart = toMinutes(block.hora_inicio);
          const rawEnd = toMinutes(block.hora_fin);

          if (rawStart === null || rawEnd === null || rawStart >= rawEnd) {
            return null;
          }

          return {
            start: Math.max(rawStart, TIMELINE_START),
            end: Math.min(rawEnd, TIMELINE_END),
          };
        })
        .filter((block) => block && block.start < block.end);

      const merged = mergeIntervals(intervals);

      if (!merged.length) {
        common = [];
        break;
      }

      common = common === null ? merged : intersectIntervals(common, merged);

      if (!common.length) {
        break;
      }
    }

    return (common || []).map((interval, index) => ({
      id: `${day.value}-${interval.start}-${interval.end}-${index}`,
      day: day.value,
      dayLabel: getDayLabel(day.value),
      start: interval.start,
      end: interval.end,
    }));
  });

  // Eliminar duplicados exactos (mismo día, start y end)
  const uniqueMap = new Map();
  rawResult.forEach((item) => {
    const key = `${item.day}-${item.start}-${item.end}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    }
  });

  return Array.from(uniqueMap.values());
}

export function getDurationLabel(start, end) {
  const duration = Math.max(0, end - start);

  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  if (hours && minutes) {
    return `${hours} h ${minutes} min`;
  }

  if (hours) {
    return `${hours} h`;
  }

  return `${minutes} min`;
}

export function getTotalDurationLabel(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours && minutes) {
    return `${hours} h ${minutes} min`;
  }

  if (hours) {
    return `${hours} h`;
  }

  if (minutes) {
    return `${minutes} min`;
  }

  return "0 min";
}
