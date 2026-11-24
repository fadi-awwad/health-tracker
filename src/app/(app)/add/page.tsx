import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import { PageHeader } from "@/components/page-header";
import { DumbbellIcon, HeartIcon, ScaleIcon, SmileIcon, SyringeIcon, TapeIcon } from "@/components/icons";

export default async function AddPage() {
  const user = await requireUser();
  const { t } = await getI18n();
  const items = [
    ...(user.tracksInjection
      ? [{ href: "/add/injection", label: t("shot_title", { name: user.injectionName }), Icon: SyringeIcon }]
      : []),
    { href: "/add/weight", label: t("weight"), Icon: ScaleIcon },
    { href: "/add/bp", label: t("blood_pressure"), Icon: HeartIcon },
    { href: "/add/measurements", label: t("measurements"), Icon: TapeIcon },
    { href: "/add/workout", label: t("workout"), Icon: DumbbellIcon },
    { href: "/add/wellbeing", label: t("wellbeing"), Icon: SmileIcon },
  ];
  return (
    <>
      <PageHeader title={t("add_title")} />
      <ul className="space-y-3">
        {items.map(({ href, label, Icon }) => (
          <li key={href}>
            <Link href={href} className="card flex items-center gap-4 text-lg font-medium active:scale-[0.99]">
              <span className="flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent">
                <Icon />
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
