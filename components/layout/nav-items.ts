// Navigation structure (docs/01 §4, docs/06 §5, as changed by D31–D32). Section links point at
// the current country. Clubs is not a top-level section: stewards (usually clubs) are reached
// from each site page, so the navigation works in countries where clubs don't manage sites.
import type { MessageKey } from "@/lib/messages";

export type NavIcon =
  "mySites" | "sites" | "whatsOn" | "gear" | "newToFlying" | "rules" | "destinations";

export interface NavItem {
  /** Message key for the label. */
  label: MessageKey;
  /** Path below the country segment, or a global path when `global` is set. */
  path: string;
  global?: boolean;
  icon?: NavIcon;
  /** The matching section on a one-page country (D93), e.g. "map" for /fr/#map. */
  anchor?: string;
}

/** Desktop top bar, left to right (D93). */
export const desktopNav: NavItem[] = [
  { label: "nav.mySites", path: "/my-sites", global: true },
  { label: "nav.sites", path: "/sites", anchor: "map" },
  { label: "nav.beforeYouFly", path: "/visiting-pilots", anchor: "rules" },
  { label: "nav.flyWithSomeone", path: "/new-to-flying", anchor: "learn" },
  { label: "nav.gear", path: "/gear", anchor: "gear" },
  { label: "nav.whatsOn", path: "/whats-on", anchor: "events" },
  { label: "nav.visiting", path: "/visiting", global: true },
];

/** Phone bottom tab bar (D32, D93): five tabs for travelling and local pilots alike. */
export const phoneTabs: NavItem[] = [
  { label: "nav.mySites", path: "/my-sites", global: true, icon: "mySites" },
  { label: "nav.map", path: "/sites", anchor: "map", icon: "sites" },
  { label: "nav.beforeYouFly", path: "/visiting-pilots", anchor: "rules", icon: "rules" },
  { label: "nav.flyWithSomeone", path: "/new-to-flying", anchor: "learn", icon: "newToFlying" },
  { label: "nav.visiting", path: "/visiting", global: true, icon: "destinations" },
];

/** Phone menu (docs/06 §5). Country and Settings join in M1 and M5. */
export const phoneMenu: NavItem[] = [
  { label: "nav.gear", path: "/gear", anchor: "gear" },
  { label: "nav.whatsOn", path: "/whats-on", anchor: "events" },
  { label: "footer.tools", path: "/tools", global: true },
  { label: "footer.about", path: "/about", global: true },
  { label: "footer.sources", path: "/sources", global: true },
  { label: "footer.status", path: "/status", global: true },
  { label: "footer.feedback", path: "/feedback", global: true },
];

/** Footer links (docs/02 §5.1). */
export const footerNav: NavItem[] = [
  { label: "footer.tools", path: "/tools", global: true },
  { label: "footer.about", path: "/about", global: true },
  { label: "footer.sources", path: "/sources", global: true },
  { label: "footer.status", path: "/status", global: true },
  { label: "footer.bot", path: "/bot", global: true },
  { label: "footer.takedown", path: "/takedown", global: true },
  { label: "footer.privacy", path: "/privacy", global: true },
  { label: "footer.disclaimer", path: "/disclaimer", global: true },
  { label: "footer.feedback", path: "/feedback", global: true },
];

/**
 * Route path for a nav item in the given country, e.g. ("/clubs", "au") → "/au/clubs/". Countries
 * without section pages (D93) go to the matching section of their one page, e.g. "/fr/#map".
 */
export function navHref(item: NavItem, country: string, sections = true): string {
  if (item.global) return `${item.path}/`;
  return sections || !item.anchor ? `/${country}${item.path}/` : `/${country}/#${item.anchor}`;
}

/** Whether pathname (without basePath) is within the item's section. */
export function isActive(
  item: NavItem,
  country: string,
  pathname: string,
  sections = true,
): boolean {
  if (!item.global && !sections) return false; // one-page countries: the sections are on one page
  const href = navHref(item, country, sections);
  const path = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return path === href || path.startsWith(href);
}
