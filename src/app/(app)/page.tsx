import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { fmtDate, fmtDateTime, fmtDuration, fmtNumber, fmtTime } from "@/lib/i18n";
import {
  firstWeight,
  latestBp,
  latestWaist,
  latestWeight,
  medLogsBetween,
  recentInjections,
  userMeds,
  workoutsFrom,
} from "@/lib/data";
import { STRENGTH_KINDS } from "@/lib/workout";
import { shotStatus } from "@/lib/injection";
import { BP_LABEL, BP_TONE, bpCategory } from "@/lib/health";
import { addDaysToKey, fromLocalInput, localDateKey, localHour } from "@/lib/time";
import { MedChecklist, type MedRow } from "@/components/med-checklist";
import { DumbbellIcon, HeartIcon, ScaleIcon, SmileIcon, SyringeIcon, TapeIcon } from "@/components/icons";

export default async function TodayPage() {
  const user = await requireUser();
  const { t, locale } = await getI18n();
  const tz = user.timezone;
  const now = new Date();
  const hour = localHour(now, tz);
  const greeting = hour < 12 ? "greeting_morning" : hour < 18 ? "greeting_afternoon" : "greeting_evening";

  // Medications: today's ticks + last 7 days.
  const todayKey = localDateKey(now, tz);
  const weekKeys = Array.from({ length: 7 }, (_, i) => addDaysToKey(todayKey, i - 6));
  const meds = userMeds(user.id).filter((m) => m.active);
  const logs = medLogsBetween(user.id, weekKeys[0], todayKey);
  const medRows: MedRow[] = meds.map((m) => {
    const mine = logs.filter((l) => l.medicationId === m.id);
    return {
      id: m.id,
      name: m.name,
      dose: m.dose,
      timesPerDay: m.timesPerDay,
      taken: Object.fromEntries(
        mine.filter((l) => l.date === todayKey).map((l) => [l.slot, fmtTime(locale, l.takenAt, tz)]),
      ),
      week: weekKeys.map((k) => ({
        key: k,
        // noon UTC keeps the weekday stable in every timezone
        label: fmtDate(locale, new Date(`${k}T12:00:00Z`), "UTC", { weekday: "narrow" }),
        count: mine.filter((l) => l.date === k).length,
      })),
    };
  });

  const shots = user.tracksInjection ? recentInjections(user.id, 1) : [];
  const last = shots[0];
  const status = shotStatus(last?.takenAt ?? null, user.injectionIntervalDays, now);

  const start = firstWeight(user.id);
  const current = latestWeight(user.id);
  const bp = latestBp(user.id);
  const waist = latestWaist(user.id);
  // Workouts over the same 7 local days as the medication strip.
  const weekStart = fromLocalInput(`${weekKeys[0]}T00:00`, tz) ?? new Date(now.getTime() - 7 * 86_400_000);
  const weekWorkouts = workoutsFrom(user.id, weekStart);
  const strength = weekWorkouts.filter((w) => STRENGTH_KINDS.includes(w.kind)).length;
  const cardio = weekWorkouts.length - strength;

  const diff = start && current ? current.weightKg - start.weightKg : null;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted">
          {fmtDate(locale, now, tz, { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="text-2xl font-bold">{t(greeting, { name: user.displayName })}</h1>
      </header>

      {user.tracksInjection && (
        <section className="card space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent">
              <SyringeIcon />
            </span>
            <div className="flex-1">
              <h2 className="font-semibold">{t("shot_title", { name: user.injectionName })}</h2>
              {last && (
                <p className="text-sm text-muted">
                  {t("last_shot")}: {fmtDateTime(locale, last.takenAt, tz)} · {fmtNumber(locale, last.doseMg)} {t("mg")}
                </p>
              )}
            </div>
          </div>

          {status.state === "none" ? (
            <p className="text-muted">{t("no_shots")}</p>
          ) : (
            <div>
              <p className="text-sm text-muted">
                {t("next_shot")}: {fmtDateTime(locale, status.dueAt, tz)}
              </p>
              <p
                className={`text-xl font-bold ${
                  status.state === "upcoming" ? "text-ink" : status.state === "late" ? "text-warn" : "text-danger"
                }`}
              >
                {status.state === "upcoming"
                  ? localDateKey(status.dueAt, tz) === todayKey
                    ? t("due_today_at", { time: fmtTime(locale, status.dueAt, tz) })
                    : t("due_in", { time: fmtDuration(t, status.msUntil) })
                  : t("late_by", { time: fmtDuration(t, status.msUntil) })}
              </p>
              {status.state === "late" && <p className="mt-1 text-sm text-muted">{t("late_window")}</p>}
              {status.state === "missed" && <p className="mt-1 text-sm text-muted">{t("missed_window")}</p>}
            </div>
          )}
          <Link href="/add/injection" className="btn-primary w-full">
            {t("log_shot")}
          </Link>
        </section>
      )}

      <section>
        <h2 className="section-title">{t("today_meds")}</h2>
        {medRows.length ? (
          <MedChecklist meds={medRows} />
        ) : (
          <p className="card text-muted">
            {t("no_meds")}{" "}
            <Link href="/settings#meds" className="font-medium text-accent underline">
              {t("add_meds_link")}
            </Link>
          </p>
        )}
      </section>

      <section>
        <h2 className="section-title">{t("summary")}</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/progress" className="card">
            <p className="text-sm text-muted">{t("weight")}</p>
            <p className="text-2xl font-bold">
              {current ? `${fmtNumber(locale, current.weightKg)}` : "—"}
              <span className="ms-1 text-sm font-normal text-muted">{t("kg")}</span>
            </p>
            {diff !== null && diff !== 0 && (
              <p className="text-sm text-muted">
                {diff < 0 ? t("lost") : t("gained")} {fmtNumber(locale, Math.abs(diff))} {t("kg")}
              </p>
            )}
          </Link>
          <Link href="/progress" className="card">
            <p className="text-sm text-muted">{t("blood_pressure")}</p>
            <p className="text-2xl font-bold" dir="ltr">
              {bp ? `${bp.systolic}/${bp.diastolic}` : "—"}
            </p>
            {bp && (
              <p className={`text-sm font-medium ${BP_TONE[bpCategory(bp.systolic, bp.diastolic)]}`}>
                {t(BP_LABEL[bpCategory(bp.systolic, bp.diastolic)])}
              </p>
            )}
          </Link>
          <Link href="/progress" className="card col-span-2 flex items-baseline justify-between">
            <p className="text-sm text-muted">{t("waist")}</p>
            <p className="text-xl font-bold">
              {waist?.waistCm ? fmtNumber(locale, waist.waistCm) : "—"}
              <span className="ms-1 text-sm font-normal text-muted">{t("cm")}</span>
            </p>
          </Link>
          <Link href="/add/workout" className="card col-span-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted">{t("workouts_7d")}</p>
              <p className="text-sm text-muted">
                {t("strength")} {fmtNumber(locale, strength)} · {t("workout_cardio")} {fmtNumber(locale, cardio)}
              </p>
            </div>
            <p className="text-2xl font-bold">{fmtNumber(locale, weekWorkouts.length)}</p>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="section-title">{t("quick_add")}</h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickAdd href="/add/weight" label={t("weight")} Icon={ScaleIcon} />
          <QuickAdd href="/add/bp" label={t("blood_pressure")} Icon={HeartIcon} />
          <QuickAdd href="/add/measurements" label={t("measurements")} Icon={TapeIcon} />
          <QuickAdd href="/add/wellbeing" label={t("wellbeing")} Icon={SmileIcon} />
          <QuickAdd href="/add/workout" label={t("workout")} Icon={DumbbellIcon} wide />
        </div>
      </section>
    </div>
  );
}

function QuickAdd({ href, label, Icon, wide }: { href: string; label: string; Icon: typeof ScaleIcon; wide?: boolean }) {
  return (
    <Link href={href} className={`card flex items-center gap-3 font-medium active:scale-[0.98] ${wide ? "col-span-2" : ""}`}>
      <span className="text-accent">
        <Icon />
      </span>
      {label}
    </Link>
  );
}
