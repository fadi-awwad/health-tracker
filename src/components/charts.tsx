"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useI18n } from "./i18n-provider";
import { fmtDate, fmtNumber } from "@/lib/i18n";

type Colors = { s1: string; s2: string; grid: string; muted: string; card: string; ink: string; line: string };

/** Chart colors come from CSS tokens so light/dark mode stay in sync with the app. */
function useColors(): Colors | null {
  const [c, setC] = useState<Colors | null>(null);
  useEffect(() => {
    const read = () => {
      const s = getComputedStyle(document.documentElement);
      const v = (n: string) => s.getPropertyValue(n).trim();
      setC({ s1: v("--series-1"), s2: v("--series-2"), grid: v("--grid"), muted: v("--muted"), card: v("--card"), ink: v("--ink"), line: v("--line") });
    };
    read();
    const mq = matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, []);
  return c;
}

export type Series = { key: string; label: string; slot: 1 | 2; dots?: boolean; line?: boolean };
export type Marker = { t: number; label: string };

export function TimeChart({
  data,
  series,
  unit,
  tz,
  markers = [],
  refs = [],
  digits = 1,
}: {
  data: Record<string, number | null>[]; // each row has `t` (ms) + series keys
  series: Series[];
  unit: string;
  tz: string;
  markers?: Marker[];
  refs?: { y: number; label: string }[];
  digits?: number;
}) {
  const { locale } = useI18n();
  const c = useColors();
  if (!c) return <div className="h-56" />;

  const tick = { fill: c.muted, fontSize: 11 };
  const dateFmt = (t: number) => fmtDate(locale, new Date(t), tz);

  return (
    // Time always runs left-to-right, even in Hebrew/Arabic.
    <div dir="ltr">
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid stroke={c.grid} vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={dateFmt}
              tick={tick}
              stroke={c.line}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={tick}
              stroke="transparent"
              tickFormatter={(v: number) => fmtNumber(locale, v, 0)}
              width={44}
              allowDecimals={false}
            />
            {markers.map((m) => (
              <ReferenceLine
                key={m.t}
                x={m.t}
                stroke={c.line}
                label={{ value: m.label, position: "insideTopLeft", fill: c.muted, fontSize: 10 }}
              />
            ))}
            {refs.map((r) => (
              <ReferenceLine
                key={r.y}
                y={r.y}
                stroke={c.muted}
                strokeOpacity={0.5}
                label={{ value: r.label, position: "insideBottomRight", fill: c.muted, fontSize: 10 }}
              />
            ))}
            <Tooltip
              cursor={{ stroke: c.muted, strokeWidth: 1 }}
              contentStyle={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: 12, color: c.ink }}
              labelFormatter={(t) => fmtDate(locale, new Date(Number(t)), tz, { day: "numeric", month: "short", year: "numeric" })}
              formatter={(v, name) => [`${fmtNumber(locale, Number(v), digits)} ${unit}`, name]}
            />
            {series.map((s) => {
              const color = s.slot === 1 ? c.s1 : c.s2;
              const showLine = s.line !== false;
              return (
                <Line
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  type="monotone"
                  stroke={showLine ? color : "none"}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  connectNulls
                  isAnimationActive={false}
                  dot={s.dots ? { r: showLine ? 4 : 3, fill: color, stroke: c.card, strokeWidth: 2, fillOpacity: showLine ? 1 : 0.45 } : false}
                  activeDot={{ r: 5, fill: color, stroke: c.card, strokeWidth: 2 }}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {series.length > 1 && (
        <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted">
          {series.map((s) => {
            const color = s.slot === 1 ? c.s1 : c.s2;
            return (
              <li key={s.key} className="flex items-center gap-1.5">
                {s.line === false ? (
                  <span className="size-2 rounded-full" style={{ background: color, opacity: 0.45 }} />
                ) : (
                  <span className="h-0.5 w-3.5 rounded-full" style={{ background: color }} />
                )}
                {s.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
