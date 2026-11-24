import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { latestWeight, latestWorkout, recentInjections } from "@/lib/data";
import { isWorkoutKind } from "@/lib/workout";
import { suggestSite } from "@/lib/injection";
import { calendarDaysBetween, toLocalInput } from "@/lib/time";
import { PageHeader } from "@/components/page-header";
import { BloodPressureForm, InjectionForm, MeasurementsForm, WeightForm, WellbeingForm, WorkoutForm } from "./forms";

export default async function AddEntryPage({ params }: PageProps<"/add/[type]">) {
  const { type } = await params;
  const user = await requireUser();
  const { t } = await getI18n();
  const now = new Date();
  const nowLocal = toLocalInput(now, user.timezone);

  switch (type) {
    case "injection": {
      const shots = recentInjections(user.id, 12);
      const last = shots[0];
      return (
        <>
          <PageHeader title={t("log_shot")} back="/add" />
          <InjectionForm
            nowLocal={nowLocal}
            defaultDose={last?.doseMg ?? 2.5}
            suggestedSite={suggestSite(shots)}
            hoursSinceLast={last ? (now.getTime() - last.takenAt.getTime()) / 3_600_000 : null}
          />
        </>
      );
    }
    case "weight":
      return (
        <>
          <PageHeader title={t("log_weight")} back="/add" />
          <WeightForm nowLocal={nowLocal} last={latestWeight(user.id)?.weightKg} />
        </>
      );
    case "bp":
      return (
        <>
          <PageHeader title={t("log_bp")} back="/add" />
          <BloodPressureForm nowLocal={nowLocal} />
        </>
      );
    case "measurements":
      return (
        <>
          <PageHeader title={t("log_measurements")} back="/add" />
          <MeasurementsForm nowLocal={nowLocal} />
        </>
      );
    case "wellbeing": {
      const last = user.tracksInjection ? recentInjections(user.id, 1)[0] : undefined;
      const n = last ? calendarDaysBetween(last.takenAt, now, user.timezone) : null;
      const dayLabel = n === null ? null : n === 0 ? t("shot_day") : t("day_after_shot", { n });
      return (
        <>
          <PageHeader title={t("log_wellbeing")} back="/add" />
          <WellbeingForm nowLocal={nowLocal} dayLabel={dayLabel} />
        </>
      );
    }
    case "workout": {
      const lastKind = latestWorkout(user.id)?.kind ?? "";
      return (
        <>
          <PageHeader title={t("log_workout")} back="/add" />
          <WorkoutForm nowLocal={nowLocal} lastKind={isWorkoutKind(lastKind) ? lastKind : null} />
        </>
      );
    }
    default:
      notFound();
  }
}
