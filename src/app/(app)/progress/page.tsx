import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { fmtDate, fmtNumber, type DictKey } from "@/lib/i18n";
import { allInjectionsAsc, bpFrom, measurementsFrom, medLogsBetween, userMeds, weightsFrom } from "@/lib/data";
import { bmi } from "@/lib/health";
import { addDaysToKey, DAY_MS, localDateKey } from "@/lib/time";
import { buildMedCalendar, calendarRange, weekdayLabels } from "@/lib/med-calendar";
import { PageHeader } from "@/components/page-header";
import { TimeChart } from "@/components/charts";
import { MedCalendar } from "@/components/med-calendar";

const RANGES = { "1m": 30, "3m": 91, "6m": 182, all: null } as const;
type Range = keyof typeof RANGES;

export default async function ProgressPage({ searchParams }: PageProps<"/progress">) {
  const user = await requireUser();
  const { t, locale } = await getI18n();
  const tz = user.timezone;
  const sp = await searchParams;
  const range: Range = typeof sp.range === "string" && sp.range in RANGES ? (sp.range as Range) : "3m";
  const days = RANGES[range];
  const since = days ? new Date(new Date().getTime() - days * DAY_MS) : undefined;
  const n = (v: number, d = 1) => fmtNumber(locale, v, d);

  // Stats always use the full history; charts use the selected range.
  const allWeights = weightsFrom(user.id);
  const first = allWeights[0];
  const last = allWeights.at(-1);
  const lost = first && last ? first.weightKg - last.weightKg : null;
  const weeks = first && last ? (last.measuredAt.getTime() - first.measuredAt.getTime()) / (7 * DAY_MS) : 0;
  const currentBmi = last ? bmi(last.weightKg, user.heightCm) : null;
  const toGoal = last && user.goalWeightKg ? last.weightKg - user.goalWeightKg : null;

  // Weight rows with a trailing 7-day average.
  const ws = since ? allWeights.filter((w) => w.measuredAt >= since) : allWeights;
  const weightRows = ws.map((w) => {
    const ts = w.measuredAt.getTime();
    const window = allWeights.filter((x) => {
      const xt = x.measuredAt.getTime();
      return xt <= ts && xt > ts - 7 * DAY_MS;
    });
    const avg = window.reduce((s, x) => s + x.weightKg, 0) / window.length;
    return { t: ts, weight: w.weightKg, avg: Math.round(avg * 10) / 10 };
  });

  // Dose changes become markers on the weight chart and a list below.
  const shots = allInjectionsAsc(user.id);
  const doseSteps: { at: Date; dose: number; count: number }[] = [];
  for (const s of shots) {
    const cur = doseSteps.at(-1);
    if (cur && cur.dose === s.doseMg) cur.count++;
    else doseSteps.push({ at: s.takenAt, dose: s.doseMg, count: 1 });
  }
  const markers = weightRows.length
    ? doseSteps
        .filter((d) => d.at.getTime() >= weightRows[0].t && d.at.getTime() <= weightRows.at(-1)!.t)
        .map((d) => ({ t: d.at.getTime(), label: `${n(d.dose)}${t("mg")}` }))
    : [];

  const waistRows = measurementsFrom(user.id, since)
    .filter((m) => m.waistCm != null)
    .map((m) => ({ t: m.measuredAt.getTime(), waist: m.waistCm }));
  const bpRows = bpFrom(user.id, since).map((b) => ({ t: b.measuredAt.getTime(), sys: b.systolic, dia: b.diastolic }));
  const lastWaist = waistRows.at(-1)?.waist;

  // Medication calendars: the visible grid plus 30 days back for adherence.
  const todayKey = localDateKey(new Date(), tz);
  const { firstKey } = calendarRange(todayKey, locale);
  const thirtyAgo = addDaysToKey(todayKey, -29);
  const logs = medLogsBetween(user.id, firstKey < thirtyAgo ? firstKey : thirtyAgo, todayKey);
  const weekdays = weekdayLabels(locale);
  const medCalendars = userMeds(user.id)
    .filter((m) => m.active)
    .map((m) => {
      const counts = new Map<string, number>();
      for (const l of logs) if (l.medicationId === m.id) counts.set(l.date, (counts.get(l.date) ?? 0) + 1);
      return { med: m, ...buildMedCalendar(m, counts, todayKey, tz, locale) };
    });

  const tiles: { label: string; value: string }[] = [];
  if (first) tiles.push({ label: t("start_weight"), value: `${n(first.weightKg)} ${t("kg")}` });
  if (last) tiles.push({ label: t("current_weight"), value: `${n(last.weightKg)} ${t("kg")}` });
  if (lost !== null)
    tiles.push({ label: lost >= 0 ? t("lost") : t("gained"), value: `${n(Math.abs(lost))} ${t("kg")}` });
  if (lost !== null && first) tiles.push({ label: t("lost_pct"), value: `${n((lost / first.weightKg) * 100)}%` });
  if (lost !== null && weeks >= 1) tiles.push({ label: t("per_week"), value: `${n(lost / weeks, 2)} ${t("kg")}` });
  if (currentBmi) tiles.push({ label: t("bmi"), value: n(currentBmi) });
  if (toGoal !== null)
    tiles.push({ label: t("to_goal"), value: toGoal <= 0 ? t("goal_reached") : `${n(toGoal)} ${t("kg")}` });
  if (lastWaist && user.heightCm) tiles.push({ label: t("waist_to_height"), value: n(lastWaist / user.heightCm, 2) });

  return (
    <>
      <PageHeader title={t("progress_title")} />

      {tiles.length > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-3">
          {tiles.map((x) => (
            <div key={x.label} className="card py-3">
              <p className="text-xs text-muted">{x.label}</p>
              <p className="text-xl font-bold">{x.value}</p>
            </div>
          ))}
        </div>
      )}

      <nav className="mb-4 grid grid-cols-4 gap-2" aria-label="Range">
        {(Object.keys(RANGES) as Range[]).map((r) => (
          <Link key={r} href={`/progress?range=${r}`} className="chip" aria-pressed={r === range} replace>
            {t(`range_${r}` as DictKey)}
          </Link>
        ))}
      </nav>

      <div className="space-y-5">
        <ChartCard title={t("weight_trend")} empty={weightRows.length < 2} emptyText={t("not_enough_data")}>
          <TimeChart
            data={weightRows}
            tz={tz}
            unit={t("kg")}
            markers={markers}
            refs={user.goalWeightKg ? [{ y: user.goalWeightKg, label: t("goal_weight") }] : []}
            series={[
              { key: "weight", label: t("readings"), slot: 1, dots: true, line: false },
              { key: "avg", label: t("avg_7d"), slot: 1 },
            ]}
          />
        </ChartCard>

        <ChartCard title={t("waist_trend")} empty={waistRows.length < 2} emptyText={t("not_enough_data")}>
          <TimeChart data={waistRows} tz={tz} unit={t("cm")} series={[{ key: "waist", label: t("waist"), slot: 1, dots: true }]} />
        </ChartCard>

        <ChartCard title={t("bp_trend")} empty={bpRows.length < 2} emptyText={t("not_enough_data")}>
          <TimeChart
            data={bpRows}
            tz={tz}
            unit="mmHg"
            digits={0}
            refs={[{ y: 130, label: "130" }, { y: 80, label: "80" }]}
            series={[
              { key: "sys", label: t("systolic"), slot: 1, dots: true },
              { key: "dia", label: t("diastolic"), slot: 2, dots: true },
            ]}
          />
        </ChartCard>

        {medCalendars.length > 0 && (
          <div className="space-y-3">
            <h2 className="section-title mt-2">{t("medications")}</h2>
            {medCalendars.map(({ med, days, adherence }) => (
              <MedCalendar
                key={med.id}
                id={med.id}
                name={med.name}
                dose={med.dose}
                timesPerDay={med.timesPerDay}
                adherence={adherence}
                weekdays={weekdays}
                days={days}
              />
            ))}
            <p className="text-center text-xs text-muted">{t("tap_day_hint")}</p>
          </div>
        )}

        {doseSteps.length > 0 && (
          <section className="card">
            <h2 className="mb-2 font-semibold">{t("dose_timeline")}</h2>
            <ol className="space-y-2">
              {[...doseSteps].reverse().map((d) => (
                <li key={d.at.getTime()} className="flex justify-between gap-3 text-sm">
                  <span className="font-semibold">{n(d.dose)} {t("mg")}</span>
                  <span className="text-muted">
                    {t("since", { date: fmtDate(locale, d.at, tz, { day: "numeric", month: "short", year: "numeric" }) })} · ×{d.count}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </>
  );
}

function ChartCard({
  title,
  empty,
  emptyText,
  children,
}: {
  title: string;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card">
      <h2 className="mb-2 font-semibold">{title}</h2>
      {empty ? <p className="py-6 text-center text-sm text-muted">{emptyText}</p> : children}
    </section>
  );
}
