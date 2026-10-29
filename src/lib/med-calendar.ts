import "server-only";
import { fmtDate, type Locale } from "./i18n";
import { addDaysToKey, localDateKey } from "./time";
import type { CalendarDay } from "@/components/med-calendar";
import type { Medication } from "@/db";

const WEEKS = 5;

// Israel's week starts on Sunday; the English UI uses Monday.
const weekStartsOn = (locale: Locale) => (locale === "en" ? 1 : 0);
const dayOfWeek = (key: string) => new Date(`${key}T12:00:00Z`).getUTCDay();

/** Keys of the visible grid: WEEKS full weeks ending with the current week. */
export function calendarRange(todayKey: string, locale: Locale) {
  const ws = weekStartsOn(locale);
  const lastKey = addDaysToKey(todayKey, (ws + 6 - dayOfWeek(todayKey) + 7) % 7);
  const firstKey = addDaysToKey(lastKey, -(WEEKS * 7 - 1));
  return { firstKey, lastKey };
}

export function weekdayLabels(locale: Locale): string[] {
  const ws = weekStartsOn(locale);
  // 2024-01-07 was a Sunday.
  return Array.from({ length: 7 }, (_, i) =>
    fmtDate(locale, new Date(Date.UTC(2024, 0, 7 + ws + i, 12)), "UTC", { weekday: "narrow" }),
  );
}

export function buildMedCalendar(
  med: Medication,
  counts: Map<string, number>, // date -> doses logged
  todayKey: string,
  tz: string,
  locale: Locale,
): { days: CalendarDay[]; adherence: number | null } {
  const { firstKey } = calendarRange(todayKey, locale);
  // Tracking starts when the medication was added, or at the earliest back-filled day.
  const firstLogged = [...counts.keys()].sort()[0];
  const created = localDateKey(med.createdAt, tz);
  const trackedFrom = firstLogged && firstLogged < created ? firstLogged : created;

  const days: CalendarDay[] = Array.from({ length: WEEKS * 7 }, (_, i) => {
    const key = addDaysToKey(firstKey, i);
    const date = new Date(`${key}T12:00:00Z`);
    return {
      key,
      label: key.endsWith("-01") ? fmtDate(locale, date, "UTC", { day: "numeric", month: "short" }) : String(date.getUTCDate()),
      count: counts.get(key) ?? 0,
      future: key > todayKey,
      beforeStart: key < trackedFrom,
      today: key === todayKey,
    };
  });

  // Adherence over the last 30 days, counted from when tracking started.
  // Today only counts once it's complete, so the morning doesn't look like a miss.
  let from = trackedFrom;
  const windowStart = addDaysToKey(todayKey, -29);
  if (from < windowStart) from = windowStart;
  let eligible = 0;
  let taken = 0;
  for (let k = from; k <= todayKey; k = addDaysToKey(k, 1)) {
    const full = (counts.get(k) ?? 0) >= med.timesPerDay;
    if (k === todayKey && !full) continue;
    eligible++;
    if (full) taken++;
  }
  return { days, adherence: eligible ? Math.round((taken / eligible) * 100) : null };
}
