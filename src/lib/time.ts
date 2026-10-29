// Timezone helpers. The server runs in UTC on Fly, so every "today" or
// "local time" calculation must go through the user's IANA timezone.

const DAY_MS = 86_400_000;

function partsIn(date: Date, tz: string) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const p = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, min: +p.minute };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** YYYY-MM-DD of `date` as seen in `tz`. */
export function localDateKey(date: Date, tz: string): string {
  const p = partsIn(date, tz);
  return `${p.y}-${pad(p.m)}-${pad(p.d)}`;
}

/** Value for an <input type="datetime-local"> showing `date` in `tz`. */
export function toLocalInput(date: Date, tz: string): string {
  const p = partsIn(date, tz);
  return `${p.y}-${pad(p.m)}-${pad(p.d)}T${pad(p.h)}:${pad(p.min)}`;
}

function offsetMs(ts: number, tz: string): number {
  const p = partsIn(new Date(ts), tz);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.min) - Math.floor(ts / 60_000) * 60_000;
}

/** Parse a datetime-local string that was entered in `tz` into a real instant. */
export function fromLocalInput(value: string, tz: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!m) return null;
  const asUtc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  // Two passes handle DST transitions.
  let ts = asUtc - offsetMs(asUtc, tz);
  ts = asUtc - offsetMs(ts, tz);
  return new Date(ts);
}

/** Shift a YYYY-MM-DD key by whole days. */
export function addDaysToKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d) + days * DAY_MS);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/** Whole local days between two instants (b - a), counted by calendar date. */
export function calendarDaysBetween(a: Date, b: Date, tz: string): number {
  const ka = localDateKey(a, tz);
  const kb = localDateKey(b, tz);
  const [y1, m1, d1] = ka.split("-").map(Number);
  const [y2, m2, d2] = kb.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / DAY_MS);
}

export function localHour(date: Date, tz: string): number {
  return partsIn(date, tz).h;
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export { DAY_MS };
