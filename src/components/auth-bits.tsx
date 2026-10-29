"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLanguage } from "@/app/actions/auth";
import { LOCALES, LOCALE_NAMES } from "@/lib/i18n";
import { useI18n } from "./i18n-provider";

/** Hidden input carrying the browser's timezone, so the server knows "today". */
export function TzInput() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }, []);
  return <input ref={ref} type="hidden" name="tz" defaultValue="" />;
}

export function LanguagePicker() {
  const { locale } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="flex justify-center gap-2" aria-busy={pending}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          className="chip"
          aria-pressed={l === locale}
          onClick={() =>
            start(async () => {
              await setLanguage(l);
              router.refresh();
            })
          }
        >
          {LOCALE_NAMES[l]}
        </button>
      ))}
    </div>
  );
}

export function FormMessage({ error, ok }: { error?: string; ok?: string }) {
  if (error) return <p role="alert" className="text-sm font-medium text-danger">{error}</p>;
  if (ok) return <p role="status" className="text-sm font-medium text-good">{ok}</p>;
  return null;
}
