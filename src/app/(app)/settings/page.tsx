import { asc } from "drizzle-orm";
import { db, users } from "@/db";
import { requireUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { userMeds } from "@/lib/data";
import { logout } from "@/app/actions/auth";
import { PageHeader } from "@/components/page-header";
import { AddMemberForm, MedicationsManager, PasswordForm, ProfileForm } from "./forms";

export default async function SettingsPage() {
  const user = await requireUser();
  const { t } = await getI18n();
  const timezones = Intl.supportedValuesOf("timeZone");
  if (!timezones.includes(user.timezone)) timezones.unshift(user.timezone);
  const meds = userMeds(user.id).map(({ id, name, dose, timesPerDay, active }) => ({ id, name, dose, timesPerDay, active }));
  const members = user.isAdmin
    ? db()
        .select({ id: users.id, username: users.username, displayName: users.displayName, isAdmin: users.isAdmin })
        .from(users)
        .orderBy(asc(users.createdAt))
        .all()
    : [];

  return (
    <>
      <PageHeader title={t("settings_title")} />
      <div className="space-y-5">
        <Section title={t("profile")}>
          <ProfileForm
            timezones={timezones}
            v={{
              displayName: user.displayName,
              locale: user.locale,
              timezone: user.timezone,
              heightCm: user.heightCm,
              goalWeightKg: user.goalWeightKg,
              tracksInjection: user.tracksInjection,
              injectionName: user.injectionName,
              injectionIntervalDays: user.injectionIntervalDays,
            }}
          />
        </Section>

        <Section title={t("medications")} id="meds">
          <MedicationsManager meds={meds} />
        </Section>

        {user.isAdmin && (
          <Section title={t("family")}>
            <p className="mb-3 text-sm text-muted">{t("family_hint")}</p>
            <ul className="mb-4 divide-y divide-line rounded-xl border border-line">
              {members.map((m) => (
                <li key={m.id} className="flex items-center justify-between px-3 py-2">
                  <span className="font-medium">{m.displayName}</span>
                  <span className="text-sm text-muted" dir="ltr">
                    {m.username}
                    {m.isAdmin && ` · ${t("admin_badge")}`}
                    {m.id === user.id && ` · ${t("you")}`}
                  </span>
                </li>
              ))}
            </ul>
            <AddMemberForm />
          </Section>
        )}

        <Section title={t("change_password")}>
          <PasswordForm />
        </Section>

        <Section title={t("export_data")}>
          <p className="mb-3 text-sm text-muted">{t("export_hint")}</p>
          <a href="/api/export" className="btn w-full" download>
            {t("export_data")}
          </a>
        </Section>

        <form action={logout}>
          <button className="btn-danger w-full">{t("logout")}</button>
        </form>
      </div>
    </>
  );
}

function Section({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="card scroll-mt-4">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}
