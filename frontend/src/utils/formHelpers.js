export function sanitizeName(value) {
  return String(value || "")
    .replace(/[^\p{L} ]/gu, "")
    .toLocaleUpperCase();
}

export function randomPassword(length = 10) {
  const lowercase = "abcdefghijkmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const numbers = "23456789";
  const symbols = "!@#$%&*";

  let password =
    uppercase[Math.floor(Math.random() * uppercase.length)] +
    lowercase[Math.floor(Math.random() * lowercase.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    symbols[Math.floor(Math.random() * symbols.length)];

  const pool = lowercase + uppercase + numbers + symbols;

  for (let i = password.length; i < length; i++) {
    password += pool[Math.floor(Math.random() * pool.length)];
  }

  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

export async function copyToClipboard(value) {
  if (!value) return false;
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(value);
      return true;
    }

    const textArea = document.createElement("textarea");
    textArea.value = value;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    textArea.style.pointerEvents = "none";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const copied = document.execCommand("copy");
    textArea.remove();
    return copied;
  } catch {
    return false;
  }
}

export function addMonthsToDate(dateString, months) {
  if (!dateString) return "";
  const date = new Date(`${dateString}T00:00:00`);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

/**
 * Genera un correo corporativo a partir del primer nombre y primer apellido.
 * Normaliza sin acentos, minúsculas, separado por punto.
 * Ejemplo: "AXEL EDUARDO" + "ESCRIBANO MEZA" → "axel.escribano"
 */
export function buildCorreoSugerido(nombres, apellidos) {
  const strip = (s) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .trim();

  const first = strip(nombres).split(/\s+/)[0];
  const last = strip(apellidos).split(/\s+/)[0];

  if (!first || !last) return "";
  return `${first}.${last}`;
}

export function normalizeId(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function calculatePeriodMonths(start, end) {
  if (!start || !end || end < start) return 0;
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const months =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    endDate.getMonth() -
    startDate.getMonth();
  return Math.max(1, months + (endDate.getDate() > startDate.getDate() ? 1 : 0));
}
