import "server-only";
import { and, asc, desc, eq, gte, lt, lte } from "drizzle-orm";
import {
  bloodPressures,
  db,
  injections,
  measurements,
  medications,
  medLogs,
  weights,
  wellbeing,
  workouts,
} from "@/db";

// Every query here is scoped by userId; callers get the id from requireUser().

export function recentInjections(userId: number, limit = 12) {
  return db()
    .select()
    .from(injections)
    .where(eq(injections.userId, userId))
    .orderBy(desc(injections.takenAt))
    .limit(limit)
    .all();
}

export function weightsFrom(userId: number, since?: Date) {
  return db()
    .select()
    .from(weights)
    .where(and(eq(weights.userId, userId), since ? gte(weights.measuredAt, since) : undefined))
    .orderBy(asc(weights.measuredAt))
    .all();
}

export function firstWeight(userId: number) {
  return db()
    .select()
    .from(weights)
    .where(eq(weights.userId, userId))
    .orderBy(asc(weights.measuredAt))
    .limit(1)
    .get();
}

export function latestWeight(userId: number) {
  return db()
    .select()
    .from(weights)
    .where(eq(weights.userId, userId))
    .orderBy(desc(weights.measuredAt))
    .limit(1)
    .get();
}

export function latestBp(userId: number) {
  return db()
    .select()
    .from(bloodPressures)
    .where(eq(bloodPressures.userId, userId))
    .orderBy(desc(bloodPressures.measuredAt))
    .limit(1)
    .get();
}

export function latestWaist(userId: number) {
  return db()
    .select()
    .from(measurements)
    .where(eq(measurements.userId, userId))
    .orderBy(desc(measurements.measuredAt))
    .all()
    .find((m) => m.waistCm != null);
}

export function bpFrom(userId: number, since?: Date) {
  return db()
    .select()
    .from(bloodPressures)
    .where(
      and(eq(bloodPressures.userId, userId), since ? gte(bloodPressures.measuredAt, since) : undefined),
    )
    .orderBy(asc(bloodPressures.measuredAt))
    .all();
}

export function measurementsFrom(userId: number, since?: Date) {
  return db()
    .select()
    .from(measurements)
    .where(
      and(eq(measurements.userId, userId), since ? gte(measurements.measuredAt, since) : undefined),
    )
    .orderBy(asc(measurements.measuredAt))
    .all();
}

export function allInjectionsAsc(userId: number) {
  return db()
    .select()
    .from(injections)
    .where(eq(injections.userId, userId))
    .orderBy(asc(injections.takenAt))
    .all();
}

export function userMeds(userId: number) {
  return db()
    .select()
    .from(medications)
    .where(eq(medications.userId, userId))
    .orderBy(desc(medications.active), asc(medications.name))
    .all();
}

export function medLogsBetween(userId: number, fromKey: string, toKey: string) {
  return db()
    .select()
    .from(medLogs)
    .where(and(eq(medLogs.userId, userId), gte(medLogs.date, fromKey), lte(medLogs.date, toKey)))
    .all();
}

export function latestWorkout(userId: number) {
  return db()
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId))
    .orderBy(desc(workouts.performedAt))
    .limit(1)
    .get();
}

export function workoutsFrom(userId: number, since: Date) {
  return db()
    .select()
    .from(workouts)
    .where(and(eq(workouts.userId, userId), gte(workouts.performedAt, since)))
    .orderBy(asc(workouts.performedAt))
    .all();
}

export type HistoryItem =
  | { kind: "injection"; id: number; at: Date; doseMg: number; site: string | null; notes: string | null }
  | { kind: "weight"; id: number; at: Date; weightKg: number; notes: string | null }
  | { kind: "bp"; id: number; at: Date; systolic: number; diastolic: number; pulse: number | null; notes: string | null }
  | { kind: "measurements"; id: number; at: Date; values: Partial<Record<MeasureKey, number>>; notes: string | null }
  | { kind: "med"; id: number; at: Date; name: string; dose: string | null; slot: number; timesPerDay: number; loggedLater: boolean; notes: null }
  | { kind: "workout"; id: number; at: Date; workoutKind: string; durationMin: number | null; effort: number | null; notes: string | null }
  | { kind: "wellbeing"; id: number; at: Date; overall: number; energy: number | null; appetite: number | null; symptoms: Record<string, number>; notes: string | null };

export const MEASURE_KEYS = ["waist", "hips", "chest", "neck", "arm", "thigh"] as const;
export type MeasureKey = (typeof MEASURE_KEYS)[number];

/** Newest-first merged timeline of every entry type, older than `before`. */
export function history(userId: number, before: Date, limit: number): HistoryItem[] {
  const d = db();
  const items: HistoryItem[] = [
    ...d.select().from(injections)
      .where(and(eq(injections.userId, userId), lt(injections.takenAt, before)))
      .orderBy(desc(injections.takenAt)).limit(limit).all()
      .map((r) => ({ kind: "injection" as const, id: r.id, at: r.takenAt, doseMg: r.doseMg, site: r.site, notes: r.notes })),
    ...d.select().from(weights)
      .where(and(eq(weights.userId, userId), lt(weights.measuredAt, before)))
      .orderBy(desc(weights.measuredAt)).limit(limit).all()
      .map((r) => ({ kind: "weight" as const, id: r.id, at: r.measuredAt, weightKg: r.weightKg, notes: r.notes })),
    ...d.select().from(bloodPressures)
      .where(and(eq(bloodPressures.userId, userId), lt(bloodPressures.measuredAt, before)))
      .orderBy(desc(bloodPressures.measuredAt)).limit(limit).all()
      .map((r) => ({ kind: "bp" as const, id: r.id, at: r.measuredAt, systolic: r.systolic, diastolic: r.diastolic, pulse: r.pulse, notes: r.notes })),
    ...d.select().from(measurements)
      .where(and(eq(measurements.userId, userId), lt(measurements.measuredAt, before)))
      .orderBy(desc(measurements.measuredAt)).limit(limit).all()
      .map((r) => ({
        kind: "measurements" as const,
        id: r.id,
        at: r.measuredAt,
        notes: r.notes,
        values: Object.fromEntries(
          MEASURE_KEYS.map((k) => [k, r[`${k}Cm` as const]]).filter(([, v]) => v != null),
        ) as Partial<Record<MeasureKey, number>>,
      })),
    ...d.select().from(wellbeing)
      .where(and(eq(wellbeing.userId, userId), lt(wellbeing.recordedAt, before)))
      .orderBy(desc(wellbeing.recordedAt)).limit(limit).all()
      .map((r) => ({ kind: "wellbeing" as const, id: r.id, at: r.recordedAt, overall: r.overall, energy: r.energy, appetite: r.appetite, symptoms: r.symptoms, notes: r.notes })),
    ...d.select().from(workouts)
      .where(and(eq(workouts.userId, userId), lt(workouts.performedAt, before)))
      .orderBy(desc(workouts.performedAt)).limit(limit).all()
      .map((r) => ({ kind: "workout" as const, id: r.id, at: r.performedAt, workoutKind: r.kind, durationMin: r.durationMin, effort: r.effort, notes: r.notes })),
    ...d.select({ log: medLogs, med: medications }).from(medLogs)
      .innerJoin(medications, eq(medications.id, medLogs.medicationId))
      .where(and(eq(medLogs.userId, userId), lt(medLogs.takenAt, before)))
      .orderBy(desc(medLogs.takenAt)).limit(limit).all()
      .map(({ log, med }) => ({
        kind: "med" as const,
        id: log.id,
        at: log.takenAt,
        name: med.name,
        dose: med.dose,
        slot: log.slot,
        timesPerDay: med.timesPerDay,
        loggedLater: log.loggedLater,
        notes: null,
      })),
  ];
  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}
