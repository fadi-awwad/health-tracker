export const USERNAME_RE = /^[a-z0-9._-]{3,32}$/;

/** Parse an optional decimal form field. Accepts "72,5" as well as "72.5". */
export function parseNum(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim().replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

export function inRange(n: number | null, min: number, max: number): boolean {
  return n === null || (n >= min && n <= max);
}

export function text(v: FormDataEntryValue | null, max = 1000): string | null {
  const s = String(v ?? "").trim().slice(0, max);
  return s || null;
}
