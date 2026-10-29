"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "./i18n-provider";
import { ChartIcon, GearIcon, HomeIcon, ListIcon, PlusIcon } from "./icons";

const ITEMS = [
  { href: "/", key: "nav_today", Icon: HomeIcon },
  { href: "/progress", key: "nav_progress", Icon: ChartIcon },
  { href: "/add", key: "nav_add", Icon: PlusIcon, primary: true },
  { href: "/history", key: "nav_history", Icon: ListIcon },
  { href: "/settings", key: "nav_settings", Icon: GearIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {ITEMS.map(({ href, key, Icon, ...rest }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          const primary = "primary" in rest;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${active ? "text-accent font-semibold" : "text-muted"}`}
              >
                {primary ? (
                  <span className="-mt-1 flex size-9 items-center justify-center rounded-full bg-accent text-accent-ink">
                    <Icon width={22} height={22} />
                  </span>
                ) : (
                  <Icon />
                )}
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
