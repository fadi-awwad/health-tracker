"use client";

import { useForm } from "@/components/use-form";
import { useRef, useEffect, useTransition } from "react";
import {
  addMedication,
  addMember,
  changePassword,
  deleteMedication,
  setMedicationActive,
  updateProfile,
} from "@/app/actions/settings";
import { FormMessage } from "@/components/auth-bits";
import { useI18n } from "@/components/i18n-provider";
import { TrashIcon } from "@/components/icons";
import { LOCALES, LOCALE_NAMES } from "@/lib/i18n";
import type { FormState } from "@/app/actions/types";

function Msg({ state }: { state: FormState }) {
  const { t } = useI18n();
  return <FormMessage error={state?.error && t(state.error)} ok={state?.ok && t(state.ok)} />;
}

/** Clears the form after a successful submit. */
function useResetOnOk(state: FormState) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return ref;
}

export type ProfileValues = {
  displayName: string;
  locale: string;
  timezone: string;
  heightCm: number | null;
  goalWeightKg: number | null;
  tracksInjection: boolean;
  injectionName: string;
  injectionIntervalDays: number;
};

export function ProfileForm({ v, timezones }: { v: ProfileValues; timezones: string[] }) {
  const { t } = useI18n();
  const [state, onSubmit, pending] = useForm(updateProfile);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="displayName">{t("display_name")}</label>
        <input id="displayName" name="displayName" className="input" defaultValue={v.displayName} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="locale">{t("language")}</label>
          <select id="locale" name="locale" className="input" defaultValue={v.locale}>
            {LOCALES.map((l) => <option key={l} value={l}>{LOCALE_NAMES[l]}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="timezone">{t("timezone")}</label>
          <select id="timezone" name="timezone" className="input" defaultValue={v.timezone} dir="ltr">
            {timezones.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="heightCm">{t("height_cm")}</label>
          <input id="heightCm" name="heightCm" inputMode="decimal" className="input" dir="ltr" defaultValue={v.heightCm ?? ""} />
        </div>
        <div>
          <label className="label" htmlFor="goalWeightKg">{t("goal_weight_kg")}</label>
          <input id="goalWeightKg" name="goalWeightKg" inputMode="decimal" className="input" dir="ltr" defaultValue={v.goalWeightKg ?? ""} />
        </div>
      </div>

      <fieldset className="space-y-3 rounded-xl border border-line p-3">
        <legend className="px-1 text-sm font-semibold">{t("treatment")}</legend>
        <label className="flex items-center gap-3">
          <input type="checkbox" name="tracksInjection" defaultChecked={v.tracksInjection} className="size-5 accent-[var(--accent)]" />
          {t("tracks_injection")}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="injectionName">{t("injection_name")}</label>
            <input id="injectionName" name="injectionName" className="input" defaultValue={v.injectionName} />
          </div>
          <div>
            <label className="label" htmlFor="injectionIntervalDays">{t("injection_interval")}</label>
            <input id="injectionIntervalDays" name="injectionIntervalDays" inputMode="numeric" className="input" dir="ltr" defaultValue={v.injectionIntervalDays} />
          </div>
        </div>
      </fieldset>
      <Msg state={state} />
      <button className="btn-primary w-full" disabled={pending}>{t("save")}</button>
    </form>
  );
}

export type MedItem = { id: number; name: string; dose: string | null; timesPerDay: number; active: boolean };

export function MedicationsManager({ meds }: { meds: MedItem[] }) {
  const { t } = useI18n();
  const [state, onSubmit, pending] = useForm(addMedication);
  const ref = useResetOnOk(state);
  const [busy, start] = useTransition();
  return (
    <div className="space-y-4">
      {meds.length > 0 && (
        <ul className="divide-y divide-line rounded-xl border border-line" aria-busy={busy}>
          {meds.map((m) => (
            <li key={m.id} className="flex items-center gap-2 px-3 py-2">
              <div className={`min-w-0 flex-1 ${m.active ? "" : "opacity-50"}`}>
                <p className="truncate font-medium" dir="auto">
                  {m.name} {!m.active && <span className="text-xs text-muted">({t("inactive")})</span>}
                </p>
                <p className="truncate text-sm text-muted" dir="auto">
                  {[m.dose, m.timesPerDay > 1 ? `${m.timesPerDay}×` : null].filter(Boolean).join(" · ")}
                </p>
              </div>
              <button type="button" className="chip" onClick={() => start(() => setMedicationActive(m.id, !m.active))}>
                {m.active ? t("deactivate") : t("activate")}
              </button>
              <button
                type="button"
                aria-label={t("delete")}
                className="p-2 text-muted hover:text-danger"
                onClick={() => confirm(t("confirm_delete")) && start(() => deleteMedication(m.id))}
              >
                <TrashIcon width={18} height={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form ref={ref} onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label" htmlFor="med-name">{t("med_name")}</label>
            <input id="med-name" name="name" className="input" required placeholder="Allopurinol" />
          </div>
          <div>
            <label className="label" htmlFor="med-dose">{t("med_dose")}</label>
            <input id="med-dose" name="dose" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="med-times">{t("times_per_day")}</label>
            <select id="med-times" name="timesPerDay" className="input" defaultValue="1">
              {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <Msg state={state} />
        <button className="btn w-full" disabled={pending}>+ {t("add_medication")}</button>
      </form>
    </div>
  );
}

export function PasswordForm() {
  const { t } = useI18n();
  const [state, onSubmit, pending] = useForm(changePassword);
  const ref = useResetOnOk(state);
  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="label" htmlFor="current">{t("current_password")}</label>
        <input id="current" name="current" type="password" className="input" dir="ltr" required autoComplete="current-password" />
      </div>
      <div>
        <label className="label" htmlFor="next">{t("new_password")}</label>
        <input id="next" name="next" type="password" className="input" dir="ltr" required minLength={8} autoComplete="new-password" />
      </div>
      <Msg state={state} />
      <button className="btn w-full" disabled={pending}>{t("change_password")}</button>
    </form>
  );
}

export function AddMemberForm() {
  const { t } = useI18n();
  const [state, onSubmit, pending] = useForm(addMember);
  const ref = useResetOnOk(state);
  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label" htmlFor="m-name">{t("display_name")}</label>
          <input id="m-name" name="displayName" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="m-user">{t("username")}</label>
          <input id="m-user" name="username" className="input" dir="ltr" required autoCapitalize="none" autoCorrect="off" autoComplete="off" />
        </div>
        <div>
          <label className="label" htmlFor="m-pass">{t("password")}</label>
          <input id="m-pass" name="password" className="input" dir="ltr" required minLength={8} autoComplete="new-password" />
        </div>
      </div>
      <label className="flex items-center gap-3">
        <input type="checkbox" name="tracksInjection" className="size-5 accent-[var(--accent)]" />
        {t("tracks_injection")}
      </label>
      <Msg state={state} />
      <button className="btn w-full" disabled={pending}>+ {t("add_member")}</button>
    </form>
  );
}
