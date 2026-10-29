import "server-only";
import crypto from "node:crypto";
import { promisify } from "node:util";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { db, sessions, users, type User } from "@/db";

const COOKIE = "ht_session";
const SESSION_DAYS = 90;
const scrypt = promisify(crypto.scrypt) as (
  pw: string,
  salt: Buffer,
  len: number,
) => Promise<Buffer>;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, saltHex, keyHex] = stored.split("$");
  if (algo !== "scrypt" || !saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export async function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  db().insert(sessions).values({ id: hashToken(token), userId, expiresAt }).run();
  // Secure whenever the request came over HTTPS (Fly's proxy sets this header).
  const secure = (await headers()).get("x-forwarded-proto") === "https";
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) db().delete(sessions).where(eq(sessions.id, hashToken(token))).run();
  jar.delete(COOKIE);
}

/** The signed-in user, or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const row = db()
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .get();
  return row?.user ?? null;
});

/** Use in every page and server action that touches user data. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (!user.isAdmin) redirect("/");
  return user;
}

export function hasAnyUser(): boolean {
  return !!db().select({ id: users.id }).from(users).limit(1).get();
}
