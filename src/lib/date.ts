export function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function dateOnly(date: Date) {
  return startOfDay(date);
}

export function shortWeekday(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

// Parses a "YYYY-MM-DD" string (e.g. from a <input type="date">) as local
// midnight. Using `new Date(str)` instead would parse it as UTC midnight,
// which silently shifts to the previous local day in timezones ahead of UTC
// (like IST) once combined with local startOfDay/endOfDay logic.
export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Formats a Date as "YYYY-MM-DD" using its local Y/M/D — the counterpart to
// parseDateOnly. Using `date.toISOString().slice(0, 10)` instead converts
// through UTC first, which rolls local midnight back a day in timezones
// ahead of UTC.
export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
