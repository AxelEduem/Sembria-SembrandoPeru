import { START_MINUTES, END_MINUTES, SLOT_MINUTES, SLOT_HEIGHT, PERSON_COLORS } from "./constants";

export function minutesToLabel(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function toMinutes(time) {
  if (!time || typeof time !== "string") return null;
  const [hours, mins] = time.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(mins)) return null;
  return hours * 60 + mins;
}

export function formatTime(value) {
  if (!value) return "-";
  return String(value).slice(0, 5);
}

export function getInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts.slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("es-PE");
}

export function getPersonColor(person) {
  const source = String(person.id || person.nombre || "persona");
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash << 5) - hash + source.charCodeAt(index);
    hash |= 0;
  }
  return PERSON_COLORS[Math.abs(hash) % PERSON_COLORS.length];
}

export function getTypeStyles(type) {
  if (type === "practicante") {
    return { dot: "bg-blue-500", text: "text-blue-700" };
  }
  if (type === "gerente") {
    return { dot: "bg-violet-500", text: "text-violet-700" };
  }
  return { dot: "bg-amber-500", text: "text-amber-700" };
}

export function getTypeLabel(type) {
  if (type === "practicante") return "Practicante";
  if (type === "gerente") return "Gerente";
  return "Voluntario";
}

export function getGroupsForDay(rows, dayValue) {
  const groups = new Map();

  rows.forEach((row) => {
    (row.horarios || [])
      .filter((block) => Number(block.dia_semana) === Number(dayValue))
      .forEach((block, index) => {
        const startMinutes = toMinutes(block.hora_inicio);
        const endMinutes = toMinutes(block.hora_fin);

        if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) return;

        const start = formatTime(block.hora_inicio);
        const end = formatTime(block.hora_fin);
        const key = [Number(dayValue), start, end].join("|");

        if (!groups.has(key)) {
          groups.set(key, {
            id: key,
            day: Number(dayValue),
            hora_inicio: block.hora_inicio,
            hora_fin: block.hora_fin,
            startMinutes,
            endMinutes,
            people: [],
          });
        }

        const personId = row.id || row.persona_id || `${row.nombre}-${index}`;
        const alreadyExists = groups.get(key).people.some((person) => String(person.id) === String(personId));

        if (!alreadyExists) {
          groups.get(key).people.push({
            id: personId,
            nombre: row.nombre || "Sin nombre",
            tipo_integrante: row.tipo_integrante,
            avatar_path: row.avatar_path || null,
            avatar_url: row.avatar_url || null,
            initials: getInitials(row.nombre),
          });
        }
      });
  });

  return [...groups.values()].sort(
    (first, second) => first.startMinutes - second.startMinutes || first.endMinutes - second.endMinutes
  );
}

export function createOverlapClusters(groups) {
  if (!groups.length) return [];

  const sorted = [...groups].sort(
    (first, second) => first.startMinutes - second.startMinutes || first.endMinutes - second.endMinutes
  );
  const clusters = [];
  let current = [];
  let currentEnd = null;

  sorted.forEach((group) => {
    if (current.length === 0 || group.startMinutes < currentEnd) {
      current.push(group);
      currentEnd = current.length === 1 ? group.endMinutes : Math.max(currentEnd, group.endMinutes);
      return;
    }
    clusters.push(current);
    current = [group];
    currentEnd = group.endMinutes;
  });

  if (current.length) clusters.push(current);
  return clusters;
}

export function assignLanes(groups) {
  const clusters = createOverlapClusters(groups);
  const result = [];

  clusters.forEach((cluster) => {
    const lanes = [];
    const clusterResults = [];
    const sorted = [...cluster].sort(
      (first, second) => first.startMinutes - second.startMinutes || first.endMinutes - second.endMinutes
    );

    sorted.forEach((group) => {
      let laneIndex = 0;
      while (laneIndex < lanes.length && lanes[laneIndex] > group.startMinutes) {
        laneIndex += 1;
      }
      lanes[laneIndex] = group.endMinutes;
      clusterResults.push({ ...group, laneIndex });
    });

    const totalLanes = Math.max(1, ...clusterResults.map((group) => group.laneIndex + 1));

    clusterResults.forEach((group) => {
      result.push({ ...group, totalLanes });
    });
  });

  return result;
}

export function getDayWidth(groups) {
  const maxLanes = Math.max(1, ...groups.map((group) => group.totalLanes || 1));
  const minimumWidth = 600;
  const laneWidth = 220;
  const gap = 12;
  return Math.max(minimumWidth, maxLanes * laneWidth + (maxLanes - 1) * gap + 30);
}

export function getBlockPosition(group) {
  const safeStart = Math.max(START_MINUTES, group.startMinutes);
  const safeEnd = Math.min(END_MINUTES, group.endMinutes);
  const top = ((safeStart - START_MINUTES) / SLOT_MINUTES) * SLOT_HEIGHT;
  const height = Math.max(92, ((safeEnd - safeStart) / SLOT_MINUTES) * SLOT_HEIGHT);

  const laneCount = Math.max(1, group.totalLanes || 1);

  // Si solo hay una tarjeta, ocupa todo el ancho con margen simétrico
  if (laneCount === 1) {
    return {
      top,
      height,
      width: "calc(100% - 20px)",
      left: "10px",
    };
  }

  // Si hay varias tarjetas, se dividen en columnas con márgenes simétricos
  const gap = 12;
  const width = `calc((100% - 20px - ${(laneCount - 1) * gap}px) / ${laneCount})`;
  const left = `calc(10px + ${group.laneIndex} * (${width} + ${gap}px))`;

  return { top, height, width, left };
}
