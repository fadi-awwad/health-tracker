import en, { type Dict, type DictKey } from "./en";
import he from "./he";
import ar from "./ar";

export type { Dict, DictKey };

export const LOCALES = ["en", "he", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  he: "עברית",
  ar: "العربية",
};

const dicts: Record<Locale, Dict> = { en, he, ar };

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

export function getDict(locale: Locale): Dict {
  return dicts[locale];
}

export function isRtl(locale: Locale): boolean {
  return locale === "he" || locale === "ar";
}

/** BCP-47 tag for Intl. Arabic keeps Latin digits to match what people type. */
export function intlLocale(locale: Locale): string {
  return { en: "en-GB", he: "he-IL", ar: "ar-u-nu-latn" }[locale];
}

export type TFunc = (key: DictKey, vars?: Record<string, string | number>) => string;

export function makeT(dict: Dict): TFunc {
  return (key, vars) => {
    let s = dict[key] ?? en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
  };
}

// ---- formatting (usable on server and client) ----

export function fmtNumber(locale: Locale, n: number, maxDigits = 1): string {
  return new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: maxDigits }).format(n);
}

export function fmtDate(
  locale: Locale,
  date: Date,
  tz: string,
  opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" },
): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { timeZone: tz, ...opts }).format(date);
}

export function fmtTime(locale: Locale, date: Date, tz: string): string {
  return fmtDate(locale, date, tz, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
}

export function fmtDateTime(locale: Locale, date: Date, tz: string): string {
  return fmtDate(locale, date, tz, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

export function fmtDuration(t: TFunc, ms: number): string {
  const totalMin = Math.max(0, Math.round(Math.abs(ms) / 60_000));
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  return d > 0 ? t("dur_days_hours", { d, h }) : t("dur_hours_minutes", { h, m });
}
