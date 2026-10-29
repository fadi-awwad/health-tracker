import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser, hasAnyUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { LanguagePicker } from "@/components/auth-bits";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (!hasAnyUser()) redirect("/setup");
  if (await getCurrentUser()) redirect("/");
  const { t } = await getI18n();
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <div className="text-center">
        <Image src="/app-icon/192" alt="" width={64} height={64} unoptimized className="mx-auto mb-3 rounded-2xl" />
        <h1 className="text-2xl font-bold">{t("app_name")}</h1>
        <p className="text-muted">{t("login_title")}</p>
      </div>
      <LoginForm />
      <LanguagePicker />
    </main>
  );
}
