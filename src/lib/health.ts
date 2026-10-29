import type { DictKey } from "./i18n";

export const SYMPTOMS = [
  "nausea",
  "vomiting",
  "constipation",
  "diarrhea",
  "heartburn",
  "bloating",
  "stomach_pain",
  "fatigue",
  "headache",
  "dizziness",
  "injection_site",
  "hair_loss",
] as const;
export type Symptom = (typeof SYMPTOMS)[number];

export type BpCategory = "normal" | "elevated" | "high1" | "high2";

/** ACC/AHA 2017 categories. */
export function bpCategory(sys: number, dia: number): BpCategory {
  if (sys >= 140 || dia >= 90) return "high2";
  if (sys >= 130 || dia >= 80) return "high1";
  if (sys >= 120) return "elevated";
  return "normal";
}

export const BP_LABEL: Record<BpCategory, DictKey> = {
  normal: "bp_normal",
  elevated: "bp_elevated",
  high1: "bp_high1",
  high2: "bp_high2",
};

export const BP_TONE: Record<BpCategory, string> = {
  normal: "text-good",
  elevated: "text-warn",
  high1: "text-warn",
  high2: "text-danger",
};

export function bmi(weightKg: number, heightCm: number | null): number | null {
  if (!heightCm) return null;
  const m = heightCm / 100;
  return weightKg / (m * m);
}
