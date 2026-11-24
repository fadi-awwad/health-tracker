"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
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
import { requireUser } from "@/lib/auth";
import { DOSES, SITES } from "@/lib/injection";
import { SYMPTOMS } from "@/lib/health";
import { isWorkoutKind } from "@/lib/workout";
import { MEASURE_KEYS } from "@/lib/data";
import { addDaysToKey, fromLocalInput, localDateKey } from "@/lib/time";
import { inRange, parseNum, text } from "@/lib/validation";
import type { FormState } from "./types";

function when(fd: FormData, tz: string): Date {
  const parsed = fromLocalInput(String(fd.get("at") ?? ""), tz);
  return parsed ?? new Date();
}

function done(): never {
  revalidatePath("/", "layout");
  redirect("/");
}

export async function addInjection(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const dose = parseNum(fd.get("dose"));
  const site = String(fd.get("site") ?? "");
  if (dose === null || !DOSES.includes(dose)) return { error: "invalid_number" };
  db()
    .insert(injections)
    .values({
      userId: user.id,
      takenAt: when(fd, user.timezone),
      doseMg: dose,
      site: (SITES as readonly string[]).includes(site) ? site : null,
      notes: text(fd.get("notes")),
    })
    .run();
  done();
}

export async function addWeight(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const kg = parseNum(fd.get("weight"));
  if (kg === null || !inRange(kg, 20, 400)) return { error: "invalid_number" };
  db()
    .insert(weights)
    .values({ userId: user.id, measuredAt: when(fd, user.timezone), weightKg: kg, notes: text(fd.get("notes")) })
    .run();
  done();
}

export async function addBloodPressure(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const sys = parseNum(fd.get("systolic"));
  const dia = parseNum(fd.get("diastolic"));
  const pulse = parseNum(fd.get("pulse"));
  if (sys === null || dia === null || !inRange(sys, 50, 260) || !inRange(dia, 30, 180) || !inRange(pulse, 25, 250)) {
    return { error: "invalid_number" };
  }
  if (sys <= dia) return { error: "bp_invalid" };
  db()
    .insert(bloodPressures)
    .values({
      userId: user.id,
      measuredAt: when(fd, user.timezone),
      systolic: Math.round(sys),
      diastolic: Math.round(dia),
      pulse: pulse === null ? null : Math.round(pulse),
      notes: text(fd.get("notes")),
    })
    .run();
  done();
}

export async function addMeasurements(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const values: Record<string, number | null> = {};
  for (const k of MEASURE_KEYS) {
    const v = parseNum(fd.get(k));
    if (!inRange(v, 10, 300) || Number.isNaN(v)) return { error: "invalid_number" };
    values[`${k}Cm`] = v;
  }
  if (Object.values(values).every((v) => v === null)) return { error: "measurements_empty" };
  db()
    .insert(measurements)
    .values({ userId: user.id, measuredAt: when(fd, user.timezone), notes: text(fd.get("notes")), ...values })
    .run();
  done();
}

export async function addWellbeing(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const scale = (name: string) => {
    const n = parseNum(fd.get(name));
    return n !== null && n >= 1 && n <= 5 ? Math.round(n) : null;
  };
  const overall = scale("overall");
  if (overall === null) return { error: "invalid_number" };
  const symptoms: Record<string, number> = {};
  for (const s of SYMPTOMS) {
    const sev = parseNum(fd.get(`sym_${s}`));
    if (sev && sev >= 1 && sev <= 3) symptoms[s] = Math.round(sev);
  }
  db()
    .insert(wellbeing)
    .values({
      userId: user.id,
      recordedAt: when(fd, user.timezone),
      overall,
      energy: scale("energy"),
      appetite: scale("appetite"),
      symptoms,
      notes: text(fd.get("notes")),
    })
    .run();
  done();
}

export async function addWorkout(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const kind = String(fd.get("kind") ?? "");
  if (!isWorkoutKind(kind)) return { error: "workout_kind_required" };
  const minutes = parseNum(fd.get("duration"));
  if (Number.isNaN(minutes) || !inRange(minutes, 1, 600)) return { error: "invalid_number" };
  const effort = parseNum(fd.get("effort"));
  db()
    .insert(workouts)
    .values({
      userId: user.id,
      performedAt: when(fd, user.timezone),
      kind,
      durationMin: minutes === null ? null : Math.round(minutes),
      effort: effort !== null && effort >= 1 && effort <= 5 ? Math.round(effort) : null,
      notes: text(fd.get("notes")),
    })
    .run();
  done();
}

const TABLES = {
  injection: injections,
  weight: weights,
  bp: bloodPressures,
  measurements,
  wellbeing,
  workout: workouts,
  med: medLogs,
} as const;

export async function deleteEntry(kind: keyof typeof TABLES, id: number) {
  const user = await requireUser();
  const table = TABLES[kind];
  if (!table) return;
  db().delete(table).where(and(eq(table.id, id), eq(table.userId, user.id))).run();
  revalidatePath("/", "layout");
}

/** Mark/unmark a daily medication dose for today (in the user's timezone). */
export async function toggleMedDose(medicationId: number, slot: number) {
  const user = await requireUser();
  const med = db()
    .select()
    .from(medications)
    .where(and(eq(medications.id, medicationId), eq(medications.userId, user.id)))
    .get();
  if (!med || slot < 0 || slot >= med.timesPerDay) return;
  const date = localDateKey(new Date(), user.timezone);
  const where = and(eq(medLogs.medicationId, med.id), eq(medLogs.date, date), eq(medLogs.slot, slot));
  const existing = db().select().from(medLogs).where(where).get();
  if (existing) db().delete(medLogs).where(where).run();
  else db().insert(medLogs).values({ userId: user.id, medicationId: med.id, date, slot, takenAt: new Date() }).run();
  revalidatePath("/");
}

/** How far back a forgotten day can still be ticked. */
const BACKFILL_DAYS = 60;

/**
 * Mark a whole day as taken (every dose slot) or not taken, for today or a
 * past day the user forgot to log.
 */
export async function setMedDay(medicationId: number, date: string, taken: boolean) {
  const user = await requireUser();
  const med = db()
    .select()
    .from(medications)
    .where(and(eq(medications.id, medicationId), eq(medications.userId, user.id)))
    .get();
  const today = localDateKey(new Date(), user.timezone);
  if (!med || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  if (date > today || date < addDaysToKey(today, -BACKFILL_DAYS)) return;

  const sameDay = and(eq(medLogs.medicationId, med.id), eq(medLogs.date, date));
  if (!taken) {
    db().delete(medLogs).where(sameDay).run();
  } else {
    const isToday = date === today;
    // Past days have no real time; noon local keeps it on the right day.
    const takenAt = isToday ? new Date() : (fromLocalInput(`${date}T12:00`, user.timezone) ?? new Date());
    for (let slot = 0; slot < med.timesPerDay; slot++) {
      db()
        .insert(medLogs)
        .values({ userId: user.id, medicationId: med.id, date, slot, takenAt, loggedLater: !isToday })
        .onConflictDoNothing()
        .run();
    }
  }
  revalidatePath("/", "layout");
}
