"use client";

import { useOptimistic, useTransition } from "react";
import { setMedDay, toggleMedDose } from "@/app/actions/entries";
import { useI18n } from "./i18n-provider";
import { CheckIcon, PillIcon } from "./icons";

export type MedRow = {
  id: number;
  name: string;
  dose: string | null;
  timesPerDay: number;
  /** slot -> formatted time taken today */
  taken: Record<number, string>;
  /** oldest -> newest, last 7 local days incl. today: doses taken that day */
  week: { key: string; label: string; count: number }[];
};

const GRID_COLS: Record<number, string> = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3" };

type Change =
  | { type: "slot"; id: number; slot: number }
  | { type: "day"; id: number; key: string; taken: boolean };

/** Optimistic version of what the server will store; the last week entry is today. */
function applyChange(m: MedRow, a: Change): MedRow {
  const todayKey = m.week.at(-1)?.key;
  if (a.type === "slot") {
    const taken = { ...m.taken };
    if (a.slot in taken) delete taken[a.slot];
    else taken[a.slot] = "…";
    const count = Object.keys(taken).length;
    return { ...m, taken, week: m.week.map((d) => (d.key === todayKey ? { ...d, count } : d)) };
  }
  const week = m.week.map((d) => (d.key === a.key ? { ...d, count: a.taken ? m.timesPerDay : 0 } : d));
  if (a.key !== todayKey) return { ...m, week };
  const taken: Record<number, string> = {};
  if (a.taken) for (let i = 0; i < m.timesPerDay; i++) taken[i] = m.taken[i] ?? "…";
  return { ...m, week, taken };
}

export function MedChecklist({ meds }: { meds: MedRow[] }) {
  const { t } = useI18n();
  const [, start] = useTransition();
  const [optimistic, apply] = useOptimistic(meds, (state, a: Change) =>
    state.map((m) => (m.id === a.id ? applyChange(m, a) : m)),
  );

  return (
    <ul className="space-y-3">
      {optimistic.map((m) => {
        const allTaken = Object.keys(m.taken).length >= m.timesPerDay;
        return (
          <li key={m.id} className="card">
            <div className="flex items-center gap-3">
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${allTaken ? "bg-accent-soft text-accent" : "bg-bg text-muted"}`}>
                <PillIcon />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold" dir="auto">{m.name}</p>
                {m.dose && <p className="truncate text-sm text-muted" dir="auto">{m.dose}</p>}
              </div>
            </div>
            <div className={`mt-3 grid gap-2 ${GRID_COLS[Math.min(m.timesPerDay, 3)]}`}>
              {Array.from({ length: m.timesPerDay }, (_, slot) => {
                const time = m.taken[slot];
                const done = time !== undefined;
                return (
                  <button
                    key={slot}
                    type="button"
                    aria-pressed={done}
                    onClick={() =>
                      start(async () => {
                        apply({ type: "slot", id: m.id, slot });
                        await toggleMedDose(m.id, slot);
                      })
                    }
                    className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border text-base font-medium transition ${
                      done ? "border-transparent bg-accent text-accent-ink" : "border-dashed border-line text-muted"
                    }`}
                  >
                    {done ? <CheckIcon /> : null}
                    {m.timesPerDay > 1 && <span>{t("dose_n", { n: slot + 1 })}</span>}
                    <span className={m.timesPerDay > 1 ? "text-sm opacity-80" : ""}>
                      {done ? t("taken_at", { time }) : t("tap_to_mark")}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between gap-1" aria-label={t("last_7_days")}>
              {m.week.map((d) => {
                const full = d.count >= m.timesPerDay;
                const some = d.count > 0;
                return (
                  <button
                    key={d.key}
                    type="button"
                    aria-pressed={full}
                    aria-label={`${d.label} ${d.count}/${m.timesPerDay}`}
                    className="flex flex-1 flex-col items-center gap-1 rounded-lg py-1 active:bg-bg"
                    onClick={() =>
                      start(async () => {
                        apply({ type: "day", id: m.id, key: d.key, taken: !full });
                        await setMedDay(m.id, d.key, !full);
                      })
                    }
                  >
                    <span
                      className={`size-3.5 rounded-full ${full ? "bg-accent" : some ? "bg-accent/40" : "border border-line"}`}
                    />
                    <span className="text-[10px] text-muted">{d.label}</span>
                  </button>
                );
              })}
            </div>
          </li>
        );
      })}
      <li className="text-center text-xs text-muted">{t("tap_day_hint")}</li>
    </ul>
  );
}
