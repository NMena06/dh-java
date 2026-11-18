// Utilidades de fechas sin zona horaria: se trabaja con fechas locales "YYYY-MM-DD".

export const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
  'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

export function today() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function toISO(date) {
  if (!date) return '';
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

export function fromISO(value) {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const addDays = (date, n) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
export const addMonths = (date, n) => new Date(date.getFullYear(), date.getMonth() + n, 1);
export const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
export const sameDay = (a, b) => Boolean(a && b) && toISO(a) === toISO(b);
export const nightsBetween = (a, b) => Math.round((b - a) / 86400000);

/** "12 dic" */
export function formatShort(date) {
  if (!date) return '';
  return `${date.getDate()} ${MONTHS[date.getMonth()].slice(0, 3)}`;
}

/** "12 de diciembre de 2026" */
export function formatLong(date) {
  if (!date) return '';
  return `${date.getDate()} de ${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
}

/** Conjunto de dias ocupados ("YYYY-MM-DD") a partir de rangos {start, end} con end = dia de salida (exclusivo). */
export function bookedDaySet(ranges = []) {
  const set = new Set();
  ranges.forEach(({ start, end }) => {
    for (let d = fromISO(start); d < fromISO(end); d = addDays(d, 1)) set.add(toISO(d));
  });
  return set;
}
