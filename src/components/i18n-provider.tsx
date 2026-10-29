"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { makeT, type Dict, type Locale, type TFunc } from "@/lib/i18n";

const I18nContext = createContext<{ locale: Locale; t: TFunc } | null>(null);

export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dict;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ locale, t: makeT(dict) }), [locale, dict]);
  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
