// Workout types. Stored as plain text so adding one later is just a new
// entry here plus its `workout_<kind>` translations — no migration needed.
export const WORKOUT_KINDS = ["full_body", "upper", "lower", "cardio"] as const;
export type WorkoutKind = (typeof WORKOUT_KINDS)[number];

/** Kinds that count as resistance / strength training in summaries. */
export const STRENGTH_KINDS: readonly string[] = ["full_body", "upper", "lower"];

export const isWorkoutKind = (v: string): v is WorkoutKind => (WORKOUT_KINDS as readonly string[]).includes(v);
