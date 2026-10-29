import { redirect } from "next/navigation";
import { hasAnyUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { LanguagePicker } from "@/components/auth-bits";
import { SetupForm } from "./setup-form";

export default async function SetupPage() {
  if (hasAnyUser()) redirect("/login");
  const { t } = await getI18n();
  const needsToken = !!process.env.SETUP_TOKEN || process.env.NODE_ENV === "production";
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t("setup_title")}</h1>
        <p className="mt-1 text-muted">{t("setup_intro")}</p>
      </div>
      <SetupForm needsToken={needsToken} />
      <LanguagePicker />
    </main>
  );
}
