// Visiting pilots (D89): paths and ordering for the pages. Pure functions.
import type { VisitorHelp, VisitorService } from "./types";

export function visitingPath(code?: string): string {
  return code ? `/visiting/${code.toLowerCase()}` : "/visiting";
}

export const TOURS_PATH = "/visiting/tours";

/** Most useful to a visiting pilot first. */
export const SERVICE_ORDER: VisitorService[] = [
  "site-briefing",
  "guiding",
  "shuttle",
  "flight-park",
  "tours",
  "gear-hire",
  "licence-help",
  "accommodation",
  "tandem",
  "courses",
];

export const sortServices = (services: VisitorService[]): VisitorService[] =>
  [...new Set(services)].sort((a, b) => SERVICE_ORDER.indexOf(a) - SERVICE_ORDER.indexOf(b));

/** How many businesses offer each service, in display order, leaving out services nobody offers. */
export function serviceCounts(help: VisitorHelp[]): { service: VisitorService; count: number }[] {
  return SERVICE_ORDER.map((service) => ({
    service,
    count: help.filter((h) => h.services.includes(service)).length,
  })).filter((s) => s.count > 0);
}

/** Businesses offering the most visitor-specific help first (briefings, guiding, lifts), then by name. */
export function sortHelp(help: VisitorHelp[]): VisitorHelp[] {
  const score = (h: VisitorHelp) =>
    Math.min(...h.services.map((s) => SERVICE_ORDER.indexOf(s)).filter((i) => i >= 0));
  return [...help].sort((a, b) => score(a) - score(b) || a.name.localeCompare(b.name));
}

/** Where a country's visiting page lives: the fully covered countries keep theirs in their own section. */
export function visitingHref(c: { code: string; group: string }): string {
  return c.group === "home"
    ? `/${c.code.toLowerCase()}/visiting-pilots/`
    : `${visitingPath(c.code)}/`;
}
