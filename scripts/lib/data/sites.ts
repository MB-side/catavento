// Site merging rules (docs/05 §5.3–5.4). Pure functions.
import { distanceM } from "@/lib/geo";
import type { BuildWarning, Organisation, Site } from "@/lib/types";

/** "https://www.Example.org/club/" → "example.org/club": for exact address matching only. */
export function normaliseUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    const pathPart = u.pathname.replace(/\/+$/, "").toLowerCase();
    return `${host}${pathPart}`;
  } catch {
    return undefined;
  }
}

/** "Illawarra Gliding Club Inc." → "illawarra gliding club": case, spacing and a trailing "Inc" ignored. */
export function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/,?\s+(inc\.?|incorporated)$/, "");
}

/** Weather pages and similar links that sources sometimes put where a contact belongs. */
const NOT_CONTACT_HOSTS = ["willyweather.com.au", "bom.gov.au", "windy.com", "holfuy.com"];

/**
 * Links each site's listed contact to an organisation, only on an exact match (docs/05 §5.4):
 * 1. an exact spelling or web address in club-aliases.yaml for that country;
 * 2. the same website address as exactly one organisation;
 * 3. the organisation's full name (ignoring case and a trailing "Inc"), or the short name it
 *    gives in brackets, e.g. "ACTHPA" for "ACT Hang-gliding and Paragliding Association (ACTHPA)".
 * Never guesses. A matched contact is shown under the organisation's own name, so a person's name
 * copied from a source is never published. An unmatched contact with no link, or one whose link is a
 * weather page, is dropped; other unmatched contacts are kept as listed and reported.
 */
export function matchListedContacts(
  sites: Site[],
  orgs: Organisation[],
  aliases: Record<string, Record<string, string> | null>,
  warnings: BuildWarning[],
): void {
  const byUrl = new Map<string, string[]>();
  const byName = new Map<string, string[]>();
  const add = (map: Map<string, string[]>, key: string, id: string) => {
    if (!map.get(key)?.includes(id)) map.set(key, [...(map.get(key) ?? []), id]);
  };
  for (const o of orgs) {
    const key = normaliseUrl(o.website);
    if (key) add(byUrl, `${o.country}|${key}`, o.id);
    add(byName, `${o.country}|${normaliseName(o.name)}`, o.id);
    const bracketed = /\(([^()]+)\)\s*$/.exec(o.name)?.[1];
    if (bracketed) add(byName, `${o.country}|${normaliseName(bracketed)}`, o.id);
  }
  const orgById = new Map(orgs.flatMap((o) => [[o.id, o] as const, ...(o.legacyId ? [[o.legacyId, o] as const] : [])]));
  const only = (ids: string[] | undefined) => (ids?.length === 1 ? ids[0] : undefined);

  const unmatched = new Map<string, number>();
  const dropped = new Map<string, number>();
  for (const site of sites) {
    const c = site.listedContact;
    if (!c) continue;
    const urlKey = normaliseUrl(c.url);
    const countryAliases = aliases[site.country] ?? {};
    const aliasRef = countryAliases[c.name] ?? (urlKey ? countryAliases[urlKey] : undefined);
    const org =
      (aliasRef ? orgById.get(aliasRef) : undefined) ??
      orgById.get(only(urlKey ? byUrl.get(`${site.country}|${urlKey}`) : undefined) ?? "") ??
      orgById.get(only(byName.get(`${site.country}|${normaliseName(c.name)}`)) ?? "");
    if (org) {
      site.listedContact = { ...c, name: org.name, orgId: org.id };
      continue;
    }
    const host = urlKey?.split("/")[0];
    if (!c.url || NOT_CONTACT_HOSTS.some((h) => host === h || host?.endsWith(`.${h}`))) {
      delete site.listedContact;
      const why = c.url ? `link to ${host}` : "a name with no link";
      dropped.set(why, (dropped.get(why) ?? 0) + 1);
      continue;
    }
    unmatched.set(c.name, (unmatched.get(c.name) ?? 0) + 1);
  }
  for (const [name, n] of [...unmatched].sort()) {
    warnings.push({
      code: "contact-unmatched",
      message: `Site Guide contact "${name}" (${n} site${n > 1 ? "s" : ""}) matches no organisation; add it to club-aliases.yaml if certain`,
    });
  }
  for (const [what, n] of [...dropped].sort()) {
    warnings.push({
      code: "contact-dropped",
      message: `${n} unmatched Site Guide contact${n > 1 ? "s" : ""} not shown (${what})`,
    });
  }
}

export const MERGE_M = 250;
export const REPORT_M = 400;

/**
 * Cross-source duplicates (docs/05 §5.3): a community-layer (pge) site whose launch lies within
 * 250 m of another provider's launch is dropped in favour of the other; 250–400 m is reported.
 * Same-provider records are never merged, and approximate launches never auto-merge.
 */
export function dedupeSites(sites: Site[], warnings: BuildWarning[]): Site[] {
  const primary = sites.filter((s) => s.layer !== "pge");
  const exactLaunches = primary.flatMap((s) =>
    s.launches
      .filter((l) => l.precision === "exact" && l.lat !== undefined && l.lon !== undefined)
      .map((l) => ({ site: s, lat: l.lat as number, lon: l.lon as number })),
  );
  const kept: Site[] = [...primary];
  for (const s of sites.filter((x) => x.layer === "pge")) {
    let nearest: { m: number; site: Site } | undefined;
    for (const l of s.launches) {
      if (l.precision !== "exact" || l.lat === undefined || l.lon === undefined) continue;
      for (const p of exactLaunches) {
        const m = distanceM({ lat: l.lat, lon: l.lon }, p);
        if (!nearest || m < nearest.m) nearest = { m, site: p.site };
      }
    }
    if (nearest && nearest.m < MERGE_M) {
      warnings.push({ code: "dedupe-merged", message: `${s.id} duplicates ${nearest.site.id} (${Math.round(nearest.m)} m); kept the latter`, recordId: s.id });
      continue;
    }
    if (nearest && nearest.m <= REPORT_M) {
      warnings.push({ code: "dedupe-near", message: `${s.id} is ${Math.round(nearest.m)} m from ${nearest.site.id}; check by hand`, recordId: s.id });
    }
    kept.push(s);
  }
  return kept;
}
