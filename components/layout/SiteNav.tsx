"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { CalendarDays, Compass, Map as MapIcon, Menu, Search, Star, Wrench, X } from "lucide-react";
import { t } from "@/lib/messages";
import { cn } from "@/lib/utils";
import { desktopNav, isActive, navHref, phoneMenu, phoneTabs, type NavIcon } from "./nav-items";
import { useCurrentCountry } from "./useCurrentCountry";

/** Desktop top-bar links: active item in `action` on `action-tint` (docs/06 §5). */
export function DesktopNav() {
  const { pathname, country } = useCurrentCountry();
  return (
    <nav aria-label={t("nav.label")} className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {desktopNav.map((item) => {
          const active = isActive(item, country, pathname);
          return (
            <li key={item.label}>
              <Link
                href={navHref(item, country)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-[10px] px-3 text-[0.9375rem] font-semibold",
                  active
                    ? "bg-action-tint text-action hover:text-action"
                    : "text-ink hover:bg-ground hover:text-ink",
                )}
              >
                {t(item.label)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SearchLink({ className }: { className?: string }) {
  return (
    <Link
      href="/search/"
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-border-strong bg-surface px-3 text-[0.9375rem] font-medium text-muted hover:text-ink",
        className,
      )}
    >
      <Search className="size-5" aria-hidden="true" />
      <span>{t("nav.search")}</span>
    </Link>
  );
}

/** Phone top bar: search and the menu. New to flying is a bottom tab (D32). */
export function PhoneTopActions() {
  const { country, pathname } = useCurrentCountry();
  const menuRef = useRef<HTMLDetailsElement>(null);

  // Close the menu after navigating (the layout persists between pages).
  useEffect(() => {
    if (menuRef.current) menuRef.current.open = false;
  }, [pathname]);

  return (
    <div className="flex items-center gap-2 lg:hidden">
      <Link
        href="/search/"
        aria-label={t("nav.search")}
        className="flex size-11 items-center justify-center rounded-[12px] border border-border-strong bg-surface text-ink hover:text-ink"
      >
        <Search className="size-5" aria-hidden="true" />
      </Link>
      <details ref={menuRef} className="group relative">
        <summary
          className="flex size-11 cursor-pointer list-none items-center justify-center rounded-[12px] border border-border-strong bg-surface [&::-webkit-details-marker]:hidden"
          aria-label={t("nav.menu")}
        >
          <Menu className="size-5 group-open:hidden" aria-hidden="true" />
          <X className="hidden size-5 group-open:block" aria-hidden="true" />
        </summary>
        <ul className="absolute right-0 z-30 mt-2 w-56 rounded-[12px] border border-border bg-surface p-2 shadow-lg">
          {phoneMenu.map((item) => (
            <li key={item.label}>
              <Link
                href={navHref(item, country)}
                className="flex min-h-11 items-center rounded-[10px] px-3 font-medium text-ink hover:bg-ground hover:text-ink"
              >
                {t(item.label)}
              </Link>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

const tabIcons: Record<NavIcon, typeof Star> = {
  mySites: Star,
  sites: MapIcon,
  whatsOn: CalendarDays,
  gear: Wrench,
  newToFlying: Compass,
};

/** Phone bottom tab bar (D32): five tabs, icons above labels, tabs ≥ 56 px tall. */
export function BottomTabBar() {
  const { pathname, country } = useCurrentCountry();
  return (
    <nav
      aria-label={t("nav.phoneTabs")}
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {phoneTabs.map((item) => {
          const active = isActive(item, country, pathname);
          const Icon = tabIcons[item.icon ?? "mySites"];
          return (
            <li key={item.label}>
              <Link
                href={navHref(item, country)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-center text-[0.75rem] leading-tight font-semibold",
                  active ? "text-action hover:text-action" : "text-muted hover:text-ink",
                )}
              >
                <Icon className="size-6" aria-hidden="true" />
                {t(item.label)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
