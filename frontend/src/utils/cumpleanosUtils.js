export function formatDateShort(value) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

export function formatUpdatedAt(value) {
  if (!value) {
    return "Datos en caché";
  }

  
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
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

export function getAgeAtBirthday(row) {
  const birth = new Date(row.fecha_nacimiento);
  const nextBirthday = new Date(row.cumpleanos);

  if (Number.isNaN(birth.getTime()) || Number.isNaN(nextBirthday.getTime())) {
    return null;
  }

  return nextBirthday.getFullYear() - birth.getFullYear();
}

export function getCountdownLabel(days) {
  if (days === 0) {
    return "Hoy";
  }

  if (days === 1) {
    return "Mañana";
  }

  return `En ${days} días`;
}

export function getToneClass(days) {
  if (days === 0) {
    return "bg-rose-50 text-rose-700 ring-rose-100";
  }

  if (days <= 3) {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }

  return "bg-slate-50 text-slate-600 ring-slate-200";
}

export function getMonthName(month) {
  return new Intl.DateTimeFormat("es-PE", {
    month: "long",
  }).format(new Date(2024, month, 1));
}

export function getMonthShort(month) {
  return new Intl.DateTimeFormat("es-PE", {
    month: "short",
  }).format(new Date(2024, month, 1));
}

export function getMonthDayKey(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return `${date.getMonth()}-${date.getDate()}`;
}

export function getCalendarDays(date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();

  const days = [];

  for (let index = startDay - 1; index >= 0; index -= 1) {
    days.push({
      date: new Date(year, month - 1, previousMonthDays - index),
      currentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({
      date: new Date(year, month, day),
      currentMonth: true,
    });
  }

  let nextDay = 1;

  while (days.length < 42) {
    days.push({
      date: new Date(year, month + 1, nextDay),
      currentMonth: false,
    });

    nextDay += 1;
  }

  return days;
}
