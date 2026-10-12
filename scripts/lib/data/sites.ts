// Site merging rules (docs/05 §5.3–5.4). Pure functions.
import { distanceM } from "@/lib/geo";
import { coversAll, labelArcs, mergeArcs, UNPARSED_LABEL } from "@/lib/wind";
import type { BuildWarning, Organisation, Site, StewardEvidence, WindArc } from "@/lib/types";
import { normaliseUrl, OrgMatcher, type Aliases } from "./match";

export { normaliseName, normaliseUrl } from "./match";

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
  aliases: Aliases,
  warnings: BuildWarning[],
): void {
  const matcher = new OrgMatcher(orgs, aliases);
  const unmatched = new Map<string, number>();
  const dropped = new Map<string, number>();
  for (const site of sites) {
    const c = site.listedContact;
    if (!c) continue;
    const urlKey = normaliseUrl(c.url);
    const org = matcher.find(site.country, c.name, c.url, c.clubRef)?.org;
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

/**
 * Gives a hand-compiled site the takeoffs pinned to it in ParaglidingEarth (positions, wind
 * directions rated good, disciplines), crediting ParaglidingEarth. Never matched automatically.
 */
export function enrichFromPge(site: Site, pinned: string[], pgeSites: Site[], warnings: BuildWarning[]): void {
  const found = pinned
    .map((pid) => {
      const hit = pgeSites.find((p) => p.pgeId === pid);
      if (!hit) warnings.push({ code: "pge-pin-missing", message: `${site.id}: ParaglidingEarth ${pid} not in the latest download`, recordId: site.id });
      return hit;
    })
    .filter((p): p is Site => !!p);
  if (!found.length) return;
  site.launches = found.flatMap((p) => p.launches).map((l, i) => ({ ...l, id: `${site.id}:launch:${i + 1}`, name: found.length > 1 ? (found[i]?.name ?? l.name) : l.name }));
  const arcs = found.flatMap((p) => (p.windRanges === "all" ? [{ fromDeg: 0, toDeg: 360 }] : p.windRanges)) as WindArc[];
  if (arcs.length) {
    const ranges = coversAll(arcs) ? "all" : mergeArcs(arcs);
    site.windRanges = ranges;
    site.windRangeLabel = labelArcs(ranges);
  } else {
    site.windRangeLabel = UNPARSED_LABEL;
  }
  site.disciplines = [...new Set([...site.disciplines, ...found.flatMap((p) => p.disciplines)])];
  site.sources = [...site.sources, ...found.flatMap((p) => p.sources)];
}

/**
 * The community layer (ParaglidingEarth) is shown only in fully covered countries; in sample
 * countries it only feeds pinned sample sites. A community site whose ID is taken by another
 * source's site gets its ParaglidingEarth ID added.
 */
export function placeCommunitySites(sites: Site[], fullCountries: ReadonlySet<string>): Site[] {
  const taken = new Set(sites.filter((s) => s.layer !== "pge").map((s) => s.id));
  return sites
    .filter((s) => s.layer !== "pge" || fullCountries.has(s.country))
    .map((s) => {
      if (s.layer !== "pge" || !taken.has(s.id)) return s;
      const slug = `${s.slug}-${s.pgeId ?? "pge"}`;
      const id = `${s.id.slice(0, s.id.lastIndexOf(":") + 1)}${slug}`;
      return { ...s, id, slug, launches: s.launches.map((l, i) => ({ ...l, id: `${id}:launch:${i + 1}` })) };
    });
}

/**
 * D47: a club is shown as managing a site only when two sources agree: the site guide lists it as
 * the site's contact, and the club's own website names the site. Hand-set stewards
 * (site-stewards.yaml) are applied afterwards and win.
 */
export function confirmStewards(
  sites: Site[],
  orgs: Organisation[],
  evidence: StewardEvidence[],
  warnings: BuildWarning[],
): void {
  const byId = new Map(sites.map((s) => [s.id, s]));
  for (const ev of evidence) {
    const org = orgs.find((o) => o.id === ev.orgId);
    if (!org) {
      warnings.push({ code: "evidence-org-missing", message: `${ev.id}: no organisation ${ev.orgId}` });
      continue;
    }
    for (const siteId of ev.siteIds) {
      const site = byId.get(siteId);
      if (!site || site.listedContact?.orgId !== org.id || site.stewardRole !== "unknown") continue;
      site.stewardOrgId = org.id;
      site.stewardRole = "club";
      site.sources = [...site.sources, ev.source];
    }
  }
}
