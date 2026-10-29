"use client";

import { useForm } from "@/components/use-form";
import { setup } from "@/app/actions/auth";
import { FormMessage, TzInput } from "@/components/auth-bits";
import { useI18n } from "@/components/i18n-provider";

export function SetupForm({ needsToken }: { needsToken: boolean }) {
  const { t, locale } = useI18n();
  const [state, onSubmit, pending] = useForm(setup);
  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <TzInput />
      <input type="hidden" name="locale" value={locale} />
      {needsToken && (
        <div>
          <label className="label" htmlFor="token">{t("setup_token")}</label>
          <input id="token" name="token" className="input" required dir="ltr" autoComplete="off" />
          <p className="mt-1 text-xs text-muted">{t("setup_token_hint")}</p>
        </div>
      )}
      <div>
        <label className="label" htmlFor="displayName">{t("display_name")}</label>
        <input id="displayName" name="displayName" className="input" required autoComplete="name" />
      </div>
      <div>
        <label className="label" htmlFor="username">{t("username")}</label>
        <input id="username" name="username" className="input" required dir="ltr"
          autoCapitalize="none" autoCorrect="off" autoComplete="username" />
      </div>
      <div>
        <label className="label" htmlFor="password">{t("password")}</label>
        <input id="password" name="password" type="password" className="input" required
          minLength={8} dir="ltr" autoComplete="new-password" />
      </div>
      <FormMessage error={state?.error && t(state.error)} />
      <button className="btn-primary w-full" disabled={pending}>{t("create_account")}</button>
    </form>
  );
}
