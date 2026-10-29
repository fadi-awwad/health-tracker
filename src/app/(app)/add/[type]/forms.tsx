"use client";

import { useForm } from "@/components/use-form";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  addBloodPressure,
  addInjection,
  addMeasurements,
  addWeight,
  addWellbeing,
} from "@/app/actions/entries";
import type { FormState } from "@/app/actions/types";
import { useI18n } from "@/components/i18n-provider";
import { FormMessage } from "@/components/auth-bits";
import { DOSES, SITES } from "@/lib/injection";
import { SYMPTOMS } from "@/lib/health";
import { fmtNumber, type DictKey } from "@/lib/i18n";

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

function EntryForm({ action, nowLocal, children }: { action: Action; nowLocal: string; children: ReactNode }) {
  const { t } = useI18n();
  const [state, onSubmit, pending] = useForm(action);
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {children}
      <div>
        <label className="label" htmlFor="at">{t("date_time")}</label>
        <input id="at" name="at" type="datetime-local" defaultValue={nowLocal} className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="notes">
          {t("notes")} <span className="font-normal">({t("optional")})</span>
        </label>
        <textarea id="notes" name="notes" rows={2} className="input" placeholder={t("notes_placeholder")} />
      </div>
      <FormMessage error={state?.error && t(state.error)} />
      <div className="flex gap-3">
        <Link href="/" className="btn flex-1">{t("cancel")}</Link>
        <button className="btn-primary flex-[2]" disabled={pending}>{t("save")}</button>
      </div>
    </form>
  );
}

function NumberField({
  name,
  label,
  unit,
  required,
  autoFocus,
  defaultValue,
  integer,
}: {
  name: string;
  label: string;
  unit?: string;
  required?: boolean;
  autoFocus?: boolean;
  defaultValue?: number;
  integer?: boolean;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type="text"
          inputMode={integer ? "numeric" : "decimal"}
          pattern={integer ? "[0-9]*" : "[0-9]*[.,]?[0-9]*"}
          className="input pe-14 text-lg"
          required={required}
          autoFocus={autoFocus}
          defaultValue={defaultValue}
          dir="ltr"
        />
        {unit && (
          <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-muted">{unit}</span>
        )}
      </div>
    </div>
  );
}

/** Row of toggle chips that writes the selected value into a hidden input. */
function ChoiceChips<T extends string | number>({
  name,
  options,
  value,
  onChange,
  cols = 3,
}: {
  name: string;
  options: { value: T; label: ReactNode }[];
  value: T | null;
  onChange: (v: T) => void;
  cols?: 2 | 3 | 5;
}) {
  const grid = { 2: "grid-cols-2", 3: "grid-cols-3", 5: "grid-cols-5" }[cols];
  return (
    <div className={`grid gap-2 ${grid}`}>
      <input type="hidden" name={name} value={value ?? ""} />
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          className="chip"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function InjectionForm({
  nowLocal,
  defaultDose,
  suggestedSite,
  hoursSinceLast,
}: {
  nowLocal: string;
  defaultDose: number;
  suggestedSite: string;
  hoursSinceLast: number | null;
}) {
  const { t, locale } = useI18n();
  const [dose, setDose] = useState(defaultDose);
  const [site, setSite] = useState(suggestedSite);
  return (
    <EntryForm action={addInjection} nowLocal={nowLocal}>
      {hoursSinceLast !== null && hoursSinceLast < 72 && (
        <p role="alert" className="rounded-xl border border-warn/40 bg-warn/10 p-3 text-sm text-warn">
          {t("too_soon_warning", { hours: Math.floor(hoursSinceLast) })}
        </p>
      )}
      <div>
        <span className="label">{t("dose")} ({t("mg")})</span>
        <ChoiceChips
          name="dose"
          value={dose}
          onChange={setDose}
          options={DOSES.map((d) => ({ value: d, label: fmtNumber(locale, d) }))}
        />
      </div>
      <div>
        <span className="label">{t("site")}</span>
        <ChoiceChips
          name="site"
          cols={2}
          value={site}
          onChange={setSite}
          options={SITES.map((s) => ({
            value: s,
            label: (
              <span>
                {t(`site_${s}` as DictKey)}
                {s === suggestedSite && <span className="ms-1 text-xs text-accent">★ {t("suggested")}</span>}
              </span>
            ),
          }))}
        />
      </div>
    </EntryForm>
  );
}

export function WeightForm({ nowLocal, last }: { nowLocal: string; last?: number }) {
  const { t } = useI18n();
  return (
    <EntryForm action={addWeight} nowLocal={nowLocal}>
      <NumberField name="weight" label={t("weight")} unit={t("kg")} required autoFocus defaultValue={last} />
    </EntryForm>
  );
}

export function BloodPressureForm({ nowLocal }: { nowLocal: string }) {
  const { t } = useI18n();
  return (
    <EntryForm action={addBloodPressure} nowLocal={nowLocal}>
      <div className="grid grid-cols-2 gap-3">
        <NumberField name="systolic" label={t("systolic")} required autoFocus integer />
        <NumberField name="diastolic" label={t("diastolic")} required integer />
      </div>
      <NumberField name="pulse" label={`${t("pulse")} (${t("optional")})`} unit={t("bpm")} integer />
    </EntryForm>
  );
}

export function MeasurementsForm({ nowLocal }: { nowLocal: string }) {
  const { t } = useI18n();
  const fields = ["waist", "hips", "chest", "neck", "arm", "thigh"] as const;
  return (
    <EntryForm action={addMeasurements} nowLocal={nowLocal}>
      <div className="grid grid-cols-2 gap-3">
        {fields.map((f, i) => (
          <NumberField key={f} name={f} label={t(f)} unit={t("cm")} autoFocus={i === 0} />
        ))}
      </div>
    </EntryForm>
  );
}

const FACES = ["😣", "🙁", "😐", "🙂", "😄"];

export function WellbeingForm({ nowLocal, dayLabel }: { nowLocal: string; dayLabel: string | null }) {
  const { t } = useI18n();
  const [overall, setOverall] = useState<number | null>(3);
  const [energy, setEnergy] = useState<number | null>(null);
  const [appetite, setAppetite] = useState<number | null>(null);
  const [sev, setSev] = useState<Record<string, number>>({});

  const scale = (prefix: "scale" | "appetite") =>
    [1, 2, 3, 4, 5].map((v) => ({
      value: v,
      label: (
        <span className="flex flex-col items-center leading-tight">
          {prefix === "scale" && <span className="text-xl">{FACES[v - 1]}</span>}
          <span className="text-[11px]">{t(`${prefix}_${v}` as DictKey)}</span>
        </span>
      ),
    }));

  return (
    <EntryForm action={addWellbeing} nowLocal={nowLocal}>
      {dayLabel && <p className="text-sm font-medium text-accent">{dayLabel}</p>}
      <div>
        <span className="label">{t("overall")}</span>
        <ChoiceChips name="overall" cols={5} value={overall} onChange={setOverall} options={scale("scale")} />
      </div>
      <div>
        <span className="label">{t("energy")}</span>
        <ChoiceChips name="energy" cols={5} value={energy} onChange={setEnergy} options={scale("scale")} />
      </div>
      <div>
        <span className="label">{t("appetite")}</span>
        <ChoiceChips name="appetite" cols={5} value={appetite} onChange={setAppetite} options={scale("appetite")} />
      </div>
      <div>
        <span className="label">{t("symptoms")}</span>
        <p className="mb-2 text-xs text-muted">{t("symptoms_hint")}</p>
        <div className="flex flex-wrap gap-2">
          {SYMPTOMS.map((s) => {
            const v = sev[s] ?? 0;
            return (
              <button
                key={s}
                type="button"
                className={`chip ${v === 2 ? "border-warn bg-warn/10" : v === 3 ? "border-danger bg-danger/10" : ""}`}
                aria-pressed={v > 0}
                onClick={() => setSev({ ...sev, [s]: (v + 1) % 4 })}
              >
                <input type="hidden" name={`sym_${s}`} value={v || ""} />
                {t(`sym_${s}` as DictKey)}
                {v > 0 && <span className="ms-1 text-xs opacity-80">· {t(`sev_${v}` as DictKey)}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </EntryForm>
  );
}
