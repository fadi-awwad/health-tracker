import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { getDict, isLocale, makeT, type Locale } from ".";

export const LANG_COOKIE = "lang";

/** Signed-in user's language, else the `lang` cookie, else English. */
export const getLocale = cache(async (): Promise<Locale> => {
  const user = await getCurrentUser();
  if (user && isLocale(user.locale)) return user.locale;
  const c = (await cookies()).get(LANG_COOKIE)?.value;
  return isLocale(c) ? c : "en";
});

export async function getI18n() {
  const locale = await getLocale();
  const dict = getDict(locale);
  return { locale, dict, t: makeT(dict) };
}
