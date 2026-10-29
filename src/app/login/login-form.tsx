"use client";

import { useForm } from "@/components/use-form";
import { login } from "@/app/actions/auth";
import { FormMessage, TzInput } from "@/components/auth-bits";
import { useI18n } from "@/components/i18n-provider";

export function LoginForm() {
  const { t } = useI18n();
  const [state, onSubmit, pending] = useForm(login);
  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <TzInput />
      <div>
        <label className="label" htmlFor="username">{t("username")}</label>
        <input id="username" name="username" className="input" autoComplete="username"
          autoCapitalize="none" autoCorrect="off" required dir="ltr" />
      </div>
      <div>
        <label className="label" htmlFor="password">{t("password")}</label>
        <input id="password" name="password" type="password" className="input"
          autoComplete="current-password" required dir="ltr" />
      </div>
      <FormMessage error={state?.error && t(state.error)} />
      <button className="btn-primary w-full" disabled={pending}>{t("sign_in")}</button>
    </form>
  );
}
