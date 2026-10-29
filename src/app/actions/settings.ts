"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, medications, users } from "@/db";
import { hashPassword, requireAdmin, requireUser, verifyPassword } from "@/lib/auth";
import { isLocale } from "@/lib/i18n";
import { LANG_COOKIE } from "@/lib/i18n/server";
import { isValidTimeZone } from "@/lib/time";
import { USERNAME_RE, inRange, parseNum, text } from "@/lib/validation";
import type { FormState } from "./types";

export async function updateProfile(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const locale = String(fd.get("locale") ?? "");
  const tz = String(fd.get("timezone") ?? "");
  const height = parseNum(fd.get("heightCm"));
  const goal = parseNum(fd.get("goalWeightKg"));
  const interval = parseNum(fd.get("injectionIntervalDays"));
  if (Number.isNaN(height) || Number.isNaN(goal) || !inRange(height, 80, 250) || !inRange(goal, 20, 400)) {
    return { error: "invalid_number" };
  }
  if (interval === null || !inRange(interval, 1, 60)) return { error: "invalid_number" };

  db()
    .update(users)
    .set({
      displayName: text(fd.get("displayName"), 60) ?? user.displayName,
      locale: isLocale(locale) ? locale : user.locale,
      timezone: isValidTimeZone(tz) ? tz : user.timezone,
      heightCm: height,
      goalWeightKg: goal,
      tracksInjection: fd.get("tracksInjection") === "on",
      injectionName: text(fd.get("injectionName"), 40) ?? user.injectionName,
      injectionIntervalDays: Math.round(interval),
    })
    .where(eq(users.id, user.id))
    .run();
  if (isLocale(locale)) {
    (await cookies()).set(LANG_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  revalidatePath("/", "layout");
  return { ok: "saved" };
}

export async function changePassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  if (!(await verifyPassword(current, user.passwordHash))) return { error: "wrong_password" };
  if (next.length < 8) return { error: "password_too_short" };
  db().update(users).set({ passwordHash: await hashPassword(next) }).where(eq(users.id, user.id)).run();
  return { ok: "password_changed" };
}

export async function addMedication(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const name = text(fd.get("name"), 60);
  const times = parseNum(fd.get("timesPerDay")) ?? 1;
  if (!name) return null;
  if (!inRange(times, 1, 4)) return { error: "invalid_number" };
  db()
    .insert(medications)
    .values({ userId: user.id, name, dose: text(fd.get("dose"), 60), timesPerDay: Math.round(times) })
    .run();
  revalidatePath("/", "layout");
  return { ok: "saved" };
}

export async function setMedicationActive(id: number, active: boolean) {
  const user = await requireUser();
  db()
    .update(medications)
    .set({ active })
    .where(and(eq(medications.id, id), eq(medications.userId, user.id)))
    .run();
  revalidatePath("/", "layout");
}

export async function deleteMedication(id: number) {
  const user = await requireUser();
  db().delete(medications).where(and(eq(medications.id, id), eq(medications.userId, user.id))).run();
  revalidatePath("/", "layout");
}

export async function addMember(_prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const username = String(fd.get("username") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!USERNAME_RE.test(username)) return { error: "username_invalid" };
  if (password.length < 8) return { error: "password_too_short" };
  if (db().select({ id: users.id }).from(users).where(eq(users.username, username)).get()) {
    return { error: "username_taken" };
  }
  db()
    .insert(users)
    .values({
      username,
      displayName: text(fd.get("displayName"), 60) ?? username,
      passwordHash: await hashPassword(password),
      tracksInjection: fd.get("tracksInjection") === "on",
      locale: admin.locale,
      timezone: admin.timezone,
    })
    .run();
  revalidatePath("/settings");
  return { ok: "member_added" };
}
