"use client";

import { useOptimistic, useTransition } from "react";
import { setMedDay } from "@/app/actions/entries";
import { useI18n } from "./i18n-provider";
import { PillIcon } from "./icons";

export type CalendarDay = {
  key: string; // YYYY-MM-DD
  label: string; // day number, or "1 Nov" on the 1st
  count: number;
  future: boolean;
  /** before the medication was tracked: not a "miss" */
  beforeStart: boolean;
  today: boolean;
};

export function MedCalendar({
  id,
  name,
  dose,
  timesPerDay,
  adherence,
  weekdays,
  days,
}: {
  id: number;
  name: string;
  dose: string | null;
  timesPerDay: number;
  adherence: number | null;
  weekdays: string[];
  days: CalendarDay[];
}) {
  const { t } = useI18n();
  const [, start] = useTransition();
  const [cells, apply] = useOptimistic(days, (state, a: { key: string; taken: boolean }) =>
    state.map((d) => (d.key === a.key ? { ...d, count: a.taken ? timesPerDay : 0 } : d)),
  );

  return (
    <section className="card">
      <div className="mb-3 flex items-center gap-3">
        <span className="text-accent"><PillIcon /></span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold" dir="auto">{name}</h3>
          {dose && <p className="truncate text-sm text-muted" dir="auto">{dose}</p>}
        </div>
      </div>
      {adherence !== null && (
        <p className="mb-3 text-sm font-medium">{t("adherence", { pct: adherence })}</p>
      )}
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdays.map((w, i) => (
          <span key={i} className="pb-1 text-[11px] text-muted">{w}</span>
        ))}
        {cells.map((d) => {
          const full = d.count >= timesPerDay;
          const some = d.count > 0;
          const tone = d.future
            ? "text-muted/40"
            : full
              ? "bg-accent text-accent-ink font-semibold"
              : some
                ? "bg-accent-soft text-ink"
                : d.beforeStart
                  ? "text-muted/60"
                  : "border border-dashed border-line text-muted";
          return (
            <button
              key={d.key}
              type="button"
              disabled={d.future}
              aria-pressed={full}
              aria-label={`${d.key} ${d.count}/${timesPerDay}`}
              className={`flex aspect-square items-center justify-center rounded-lg text-xs ${tone} ${d.today ? "ring-2 ring-accent ring-offset-1 ring-offset-card" : ""}`}
              onClick={() =>
                start(async () => {
                  apply({ key: d.key, taken: !full });
                  await setMedDay(id, d.key, !full);
                })
              }
            >
              {d.label}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-accent" />{t("legend_taken")}</span>
        {timesPerDay > 1 && (
          <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-accent-soft" />{t("legend_partial")}</span>
        )}
        <span className="flex items-center gap-1.5"><span className="size-3 rounded border border-dashed border-line" />{t("legend_missed")}</span>
      </div>
    </section>
  );
}
