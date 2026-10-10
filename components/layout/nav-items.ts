// Navigation structure (docs/01 §4, docs/06 §5). Section links point at the current country.
import type { MessageKey } from "@/lib/messages";

export type NavIcon = "mySites" | "map" | "clubs" | "whatsOn" | "gear";

export interface NavItem {
  /** Message key for the label. */
  label: MessageKey;
  /** Path below the country segment, or a global path when `global` is set. */
  path: string;
  global?: boolean;
  icon?: NavIcon;
}

/** Desktop top bar, left to right. */
export const desktopNav: NavItem[] = [
  { label: "nav.mySites", path: "/my-sites", global: true },
  { label: "nav.sites", path: "/sites" },
  { label: "nav.clubs", path: "/clubs" },
  { label: "nav.whatsOn", path: "/whats-on" },
  { label: "nav.gear", path: "/gear" },
  { label: "nav.newToFlying", path: "/new-to-flying" },
];

/** Phone bottom tab bar (D10): five tabs. New to flying is a pill in the phone top bar instead. */
export const phoneTabs: NavItem[] = [
  { label: "nav.mySites", path: "/my-sites", global: true, icon: "mySites" },
  { label: "nav.map", path: "/sites", icon: "map" },
  { label: "nav.clubs", path: "/clubs", icon: "clubs" },
  { label: "nav.whatsOn", path: "/whats-on", icon: "whatsOn" },
  { label: "nav.gear", path: "/gear", icon: "gear" },
];

/** Phone menu (docs/06 §5). Country and Settings join in M1 and M5. */
export const phoneMenu: NavItem[] = [
  { label: "footer.about", path: "/about", global: true },
  { label: "footer.sources", path: "/sources", global: true },
  { label: "footer.status", path: "/status", global: true },
  { label: "footer.feedback", path: "/feedback", global: true },
];

/** Footer links (docs/02 §5.1). */
export const footerNav: NavItem[] = [
  { label: "footer.about", path: "/about", global: true },
  { label: "footer.sources", path: "/sources", global: true },
  { label: "footer.status", path: "/status", global: true },
  { label: "footer.bot", path: "/bot", global: true },
  { label: "footer.takedown", path: "/takedown", global: true },
  { label: "footer.privacy", path: "/privacy", global: true },
  { label: "footer.disclaimer", path: "/disclaimer", global: true },
  { label: "footer.feedback", path: "/feedback", global: true },
];

/** Route path for a nav item in the given country, e.g. ("/clubs", "au") → "/au/clubs/". */
export function navHref(item: NavItem, country: string): string {
  return item.global ? `${item.path}/` : `/${country}${item.path}/`;
}

/** Whether pathname (without basePath) is within the item's section. */
export function isActive(item: NavItem, country: string, pathname: string): boolean {
  const href = navHref(item, country);
  const path = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return path === href || path.startsWith(href);
}
