import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { fmtDate, fmtNumber, fmtTime, type DictKey } from "@/lib/i18n";
import { allInjectionsAsc, history, type HistoryItem } from "@/lib/data";
import { BP_LABEL, BP_TONE, bpCategory } from "@/lib/health";
import { calendarDaysBetween, localDateKey } from "@/lib/time";
import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/delete-button";
import { DumbbellIcon, HeartIcon, PillIcon, ScaleIcon, SmileIcon, SyringeIcon, TapeIcon } from "@/components/icons";

const PAGE = 60;
const ICONS = {
  injection: SyringeIcon,
  weight: ScaleIcon,
  bp: HeartIcon,
  measurements: TapeIcon,
  wellbeing: SmileIcon,
  workout: DumbbellIcon,
  med: PillIcon,
};

export default async function HistoryPage({ searchParams }: PageProps<"/history">) {
  const user = await requireUser();
  const { t, locale } = await getI18n();
  const tz = user.timezone;
  const sp = await searchParams;
  const beforeMs = Number(sp.before);
  const before = Number.isFinite(beforeMs) && beforeMs > 0 ? new Date(beforeMs) : new Date(new Date().getTime() + 86_400_000);

  const items = history(user.id, before, PAGE);
  const shots = allInjectionsAsc(user.id);

  const dayAfterShot = (at: Date) => {
    let last: Date | null = null;
    for (const s of shots) if (s.takenAt <= at) last = s.takenAt;
    if (!last) return null;
    const n = calendarDaysBetween(last, at, tz);
    return n === 0 ? t("shot_day") : t("day_after_shot", { n });
  };

  const groups = new Map<string, HistoryItem[]>();
  for (const it of items) {
    const k = localDateKey(it.at, tz);
    groups.set(k, [...(groups.get(k) ?? []), it]);
  }

  const n = (v: number) => fmtNumber(locale, v);

  function describe(it: HistoryItem): { title: string; detail?: React.ReactNode } {
    switch (it.kind) {
      case "injection":
        return {
          title: `${user.injectionName} · ${n(it.doseMg)} ${t("mg")}`,
          detail: it.site ? t(`site_${it.site}` as DictKey) : undefined,
        };
      case "weight":
        return { title: `${n(it.weightKg)} ${t("kg")}` };
      case "bp": {
        const cat = bpCategory(it.systolic, it.diastolic);
        return {
          title: `${it.systolic}/${it.diastolic}${it.pulse ? ` · ${it.pulse} ${t("bpm")}` : ""}`,
          detail: <span className={BP_TONE[cat]}>{t(BP_LABEL[cat])}</span>,
        };
      }
      case "measurements":
        return {
          title: Object.entries(it.values)
            .map(([k, v]) => `${t(k as DictKey)} ${n(v!)}`)
            .join(" · ") + ` ${t("cm")}`,
        };
      case "med":
        return {
          title: it.timesPerDay > 1 ? `${it.name} · ${t("dose_n", { n: it.slot + 1 })}` : it.name,
          detail: [it.dose, it.loggedLater && t("logged_later")].filter(Boolean).join(" · ") || undefined,
        };
      case "workout":
        return {
          title: [
            t(`workout_${it.workoutKind}` as DictKey),
            it.durationMin ? `${n(it.durationMin)} ${t("min")}` : null,
          ].filter(Boolean).join(" · "),
          detail: it.effort ? `${t("effort")}: ${t(`effort_${it.effort}` as DictKey)}` : undefined,
        };
      case "wellbeing": {
        const sym = Object.entries(it.symptoms)
          .map(([k, v]) => `${t(`sym_${k}` as DictKey)} (${t(`sev_${v}` as DictKey)})`)
          .join(", ");
        const day = user.tracksInjection ? dayAfterShot(it.at) : null;
        return {
          title: `${t("overall")}: ${t(`scale_${it.overall}` as DictKey)}${
            it.energy ? ` · ${t("energy")}: ${t(`scale_${it.energy}` as DictKey)}` : ""
          }${it.appetite ? ` · ${t("appetite")}: ${t(`appetite_${it.appetite}` as DictKey)}` : ""}`,
          detail: [day, sym].filter(Boolean).join(" — ") || undefined,
        };
      }
    }
  }

  const oldest = items.at(-1);
  return (
    <>
      <PageHeader title={t("history_title")} />
      {items.length === 0 && <p className="card text-muted">{t("no_entries")}</p>}
      <div className="space-y-5">
        {[...groups.entries()].map(([key, list]) => (
          <section key={key}>
            <h2 className="section-title">
              {fmtDate(locale, list[0].at, tz, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </h2>
            <ul className="card divide-y divide-line p-0">
              {list.map((it) => {
                const Icon = ICONS[it.kind];
                const d = describe(it);
                return (
                  <li key={`${it.kind}-${it.id}`} className="flex items-start gap-3 px-4 py-3">
                    <span className="mt-0.5 text-accent"><Icon width={20} height={20} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium" dir="auto">{d.title}</p>
                      {d.detail && <p className="text-sm text-muted">{d.detail}</p>}
                      {it.notes && <p dir="auto" className="mt-1 text-sm whitespace-pre-line">{it.notes}</p>}
                      {!(it.kind === "med" && it.loggedLater) && (
                        <p className="text-xs text-muted">{fmtTime(locale, it.at, tz)}</p>
                      )}
                    </div>
                    <DeleteButton kind={it.kind} id={it.id} />
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
      {items.length === PAGE && oldest && (
        <Link href={`/history?before=${oldest.at.getTime()}`} className="btn mt-5 w-full">
          {t("load_more")}
        </Link>
      )}
    </>
  );
}
