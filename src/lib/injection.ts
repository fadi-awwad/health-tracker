import { DAY_MS } from "./time";

export const SITES = [
  "abdomen_left",
  "abdomen_right",
  "thigh_left",
  "thigh_right",
  "arm_left",
  "arm_right",
] as const;
export type Site = (typeof SITES)[number];

// Mounjaro (tirzepatide) pen strengths.
export const DOSES = [2.5, 5, 7.5, 10, 12.5, 15];

// From the Mounjaro label: a missed dose may be taken within 4 days (96 h);
// doses must be at least 3 days (72 h) apart.
export const LATE_WINDOW_MS = 4 * DAY_MS;
export const MIN_GAP_MS = 3 * DAY_MS;

/** The site used longest ago (never-used sites first, in rotation order). */
export function suggestSite(recent: { site: string | null; takenAt: Date }[]): Site {
  const lastUse = new Map<string, number>();
  for (const r of recent) {
    if (r.site && !lastUse.has(r.site)) lastUse.set(r.site, r.takenAt.getTime());
  }
  let best: Site = SITES[0];
  let bestTs = Infinity;
  for (const s of SITES) {
    const ts = lastUse.get(s) ?? -Infinity;
    if (ts < bestTs) {
      best = s;
      bestTs = ts;
    }
  }
  return best;
}

export type ShotStatus =
  | { state: "none" }
  | { state: "upcoming" | "late" | "missed"; dueAt: Date; msUntil: number };

export function shotStatus(last: Date | null, intervalDays: number, now: Date): ShotStatus {
  if (!last) return { state: "none" };
  const dueAt = new Date(last.getTime() + intervalDays * DAY_MS);
  const msUntil = dueAt.getTime() - now.getTime();
  if (msUntil > 0) return { state: "upcoming", dueAt, msUntil };
  if (-msUntil <= LATE_WINDOW_MS) return { state: "late", dueAt, msUntil };
  return { state: "missed", dueAt, msUntil };
}
