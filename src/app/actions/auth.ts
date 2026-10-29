"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import {
  createSession,
  destroySession,
  getCurrentUser,
  hasAnyUser,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { isLocale } from "@/lib/i18n";
import { LANG_COOKIE } from "@/lib/i18n/server";
import { isValidTimeZone } from "@/lib/time";
import { USERNAME_RE } from "@/lib/validation";
import type { FormState } from "./types";

async function rememberLang(locale: string) {
  (await cookies()).set(LANG_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}

export async function setLanguage(locale: string) {
  if (!isLocale(locale)) return;
  await rememberLang(locale);
  const user = await getCurrentUser();
  if (user) db().update(users).set({ locale }).where(eq(users.id, user.id)).run();
}

export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  const username = String(fd.get("username") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const tz = String(fd.get("tz") ?? "");

  const user = db().select().from(users).where(eq(users.username, username)).get();
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    await new Promise((r) => setTimeout(r, 700)); // slow down guessing
    return { error: "invalid_login" };
  }
  if (tz && isValidTimeZone(tz) && tz !== user.timezone) {
    db().update(users).set({ timezone: tz }).where(eq(users.id, user.id)).run();
  }
  await createSession(user.id);
  await rememberLang(user.locale);
  redirect("/");
}

export async function setup(_prev: FormState, fd: FormData): Promise<FormState> {
  if (hasAnyUser()) redirect("/login");

  const expected = process.env.SETUP_TOKEN;
  if (process.env.NODE_ENV === "production" && !expected) return { error: "setup_disabled" };
  if (expected && String(fd.get("token") ?? "") !== expected) {
    return { error: "setup_token_invalid" };
  }

  const username = String(fd.get("username") ?? "").trim().toLowerCase();
  const displayName = String(fd.get("displayName") ?? "").trim() || username;
  const password = String(fd.get("password") ?? "");
  const tz = String(fd.get("tz") ?? "");
  const locale = String(fd.get("locale") ?? "en");

  if (!USERNAME_RE.test(username)) return { error: "username_invalid" };
  if (password.length < 8) return { error: "password_too_short" };

  const created = db()
    .insert(users)
    .values({
      username,
      displayName,
      passwordHash: await hashPassword(password),
      isAdmin: true,
      tracksInjection: true,
      locale: isLocale(locale) ? locale : "en",
      timezone: isValidTimeZone(tz) ? tz : "Asia/Jerusalem",
    })
    .returning({ id: users.id })
    .get();
  await createSession(created.id);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
