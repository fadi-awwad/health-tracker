import { eq } from "drizzle-orm";
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
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const d = db();
  const body = {
    exportedAt: new Date().toISOString(),
    profile: {
      username: user.username,
      displayName: user.displayName,
      timezone: user.timezone,
      heightCm: user.heightCm,
      goalWeightKg: user.goalWeightKg,
      injectionName: user.injectionName,
    },
    injections: d.select().from(injections).where(eq(injections.userId, user.id)).all(),
    weights: d.select().from(weights).where(eq(weights.userId, user.id)).all(),
    bloodPressures: d.select().from(bloodPressures).where(eq(bloodPressures.userId, user.id)).all(),
    measurements: d.select().from(measurements).where(eq(measurements.userId, user.id)).all(),
    wellbeing: d.select().from(wellbeing).where(eq(wellbeing.userId, user.id)).all(),
    workouts: d.select().from(workouts).where(eq(workouts.userId, user.id)).all(),
    medications: d.select().from(medications).where(eq(medications.userId, user.id)).all(),
    medicationLog: d.select().from(medLogs).where(eq(medLogs.userId, user.id)).all(),
  };
  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="health-${user.username}-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
