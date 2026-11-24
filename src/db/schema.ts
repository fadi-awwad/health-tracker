import { sql } from "drizzle-orm";
import {
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";

const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`);

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  locale: text("locale").notNull().default("en"),
  timezone: text("timezone").notNull().default("Asia/Jerusalem"),
  heightCm: real("height_cm"),
  goalWeightKg: real("goal_weight_kg"),
  tracksInjection: integer("tracks_injection", { mode: "boolean" })
    .notNull()
    .default(false),
  injectionName: text("injection_name").notNull().default("Mounjaro"),
  injectionIntervalDays: integer("injection_interval_days").notNull().default(7),
  createdAt: createdAt(),
});

export const sessions = sqliteTable("sessions", {
  // SHA-256 of the cookie token, so a leaked DB doesn't leak live sessions.
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
});

export const injections = sqliteTable(
  "injections",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    takenAt: integer("taken_at", { mode: "timestamp_ms" }).notNull(),
    doseMg: real("dose_mg").notNull(),
    site: text("site"),
    notes: text("notes"),
  },
  (t) => [index("injections_user_time").on(t.userId, t.takenAt)],
);

export const weights = sqliteTable(
  "weights",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    measuredAt: integer("measured_at", { mode: "timestamp_ms" }).notNull(),
    weightKg: real("weight_kg").notNull(),
    notes: text("notes"),
  },
  (t) => [index("weights_user_time").on(t.userId, t.measuredAt)],
);

export const bloodPressures = sqliteTable(
  "blood_pressures",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    measuredAt: integer("measured_at", { mode: "timestamp_ms" }).notNull(),
    systolic: integer("systolic").notNull(),
    diastolic: integer("diastolic").notNull(),
    pulse: integer("pulse"),
    notes: text("notes"),
  },
  (t) => [index("bp_user_time").on(t.userId, t.measuredAt)],
);

export const measurements = sqliteTable(
  "measurements",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    measuredAt: integer("measured_at", { mode: "timestamp_ms" }).notNull(),
    waistCm: real("waist_cm"),
    hipsCm: real("hips_cm"),
    chestCm: real("chest_cm"),
    neckCm: real("neck_cm"),
    armCm: real("arm_cm"),
    thighCm: real("thigh_cm"),
    notes: text("notes"),
  },
  (t) => [index("measurements_user_time").on(t.userId, t.measuredAt)],
);

export const wellbeing = sqliteTable(
  "wellbeing",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recordedAt: integer("recorded_at", { mode: "timestamp_ms" }).notNull(),
    overall: integer("overall").notNull(), // 1..5
    energy: integer("energy"), // 1..5
    appetite: integer("appetite"), // 1..5
    // JSON object: symptom key -> severity 1..3
    symptoms: text("symptoms", { mode: "json" })
      .$type<Record<string, number>>()
      .notNull()
      .default(sql`'{}'`),
    notes: text("notes"),
  },
  (t) => [index("wellbeing_user_time").on(t.userId, t.recordedAt)],
);

export const workouts = sqliteTable(
  "workouts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    performedAt: integer("performed_at", { mode: "timestamp_ms" }).notNull(),
    kind: text("kind").notNull(), // see WORKOUT_KINDS
    durationMin: integer("duration_min"),
    effort: integer("effort"), // 1..5
    notes: text("notes"),
  },
  (t) => [index("workouts_user_time").on(t.userId, t.performedAt)],
);

export const medications = sqliteTable("medications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  dose: text("dose"),
  timesPerDay: integer("times_per_day").notNull().default(1),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
});

export const medLogs = sqliteTable(
  "med_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    medicationId: integer("medication_id")
      .notNull()
      .references(() => medications.id, { onDelete: "cascade" }),
    // Local calendar day in the user's timezone, YYYY-MM-DD.
    date: text("date").notNull(),
    slot: integer("slot").notNull().default(0),
    takenAt: integer("taken_at", { mode: "timestamp_ms" }).notNull(),
    // Ticked afterwards for a past day, so takenAt is only approximate.
    loggedLater: integer("logged_later", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [uniqueIndex("med_logs_unique").on(t.medicationId, t.date, t.slot)],
);

export type User = typeof users.$inferSelect;
export type Medication = typeof medications.$inferSelect;
