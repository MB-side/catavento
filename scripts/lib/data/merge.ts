// Merge rules (docs/03 §6, docs/04 §4, §7): manual > ingest > seed. Pure functions.
import type {
  BuildWarning,
  Club,
  Country,
  Offering,
  Organisation,
  Provider,
  Site,
  SiteStationEntry,
  SourceRef,
  Station,
  StewardRole,
} from "@/lib/types";
import type { SeedOrg } from "./seed";
import { orgSlug, siteId } from "./ids";

export interface MergeRule {
  from: string;
  into: string[];
  note?: string;
}

function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const k = key(i);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Folds rows for the same business into their target (by legacy ID); targets gain the row's kind. */
export function applyOrgMerges(
  orgs: SeedOrg[],
  rules: MergeRule[],
  warnings: BuildWarning[],
): SeedOrg[] {
  const byLegacy = new Map(orgs.map((o) => [o.legacyId, o]));
  const absorbed = new Set<string>();
  for (const rule of rules) {
    const from = byLegacy.get(rule.from);
    if (!from) {
      warnings.push({ code: "merge-missing", message: `Merge source ${rule.from} not found` });
      continue;
    }
    for (const targetId of rule.into) {
      const target = byLegacy.get(targetId);
      if (!target) {
        warnings.push({ code: "merge-missing", message: `Merge target ${targetId} not found` });
        continue;
      }
      const kinds = new Set([...(target.additionalKinds ?? []), from.kind]);
      kinds.delete(target.kind);
      target.additionalKinds = kinds.size ? [...kinds] : undefined;
      target.disciplines = [...new Set([...target.disciplines, ...from.disciplines])];
      target.sources = uniqueBy([...target.sources, ...from.sources], (s) => s.url);
      target.website ??= from.website;
      target.aliases = [...new Set([...(target.aliases ?? []), from.name])];
    }
    absorbed.add(rule.from);
  }
  return orgs.filter((o) => !absorbed.has(o.legacyId));
}

/** Cross-links organisations that are one business with separate records. */
export function applyRelated(
  orgs: Organisation[],
  groups: { ids: string[] }[],
  warnings: BuildWarning[],
): void {
  const byLegacy = new Map(orgs.map((o) => [o.legacyId ?? o.id, o]));
  for (const group of groups) {
    const members = group.ids.map((id) => byLegacy.get(id));
    if (members.some((m) => m === undefined)) {
      warnings.push({ code: "related-missing", message: `Related group ${group.ids.join(", ")} has a missing member` });
      continue;
    }
    for (const m of members as Organisation[]) {
      const others = (members as Organisation[]).filter((o) => o !== m).map((o) => o.id);
      m.relatedOrgIds = [...new Set([...(m.relatedOrgIds ?? []), ...others])];
    }
  }
}

const OVERRIDE_META = new Set(["note", "source"]);

/**
 * Applies data/manual/overrides.yaml to any records with an `id` (and optional `legacyId`).
 * Returns the keys that matched, so the caller can report unused ones.
 */
export function applyOverrides<T extends { id: string; legacyId?: string }>(
  records: T[],
  overrides: Record<string, Record<string, unknown>>,
): Set<string> {
  const used = new Set<string>();
  for (const record of records) {
    for (const key of [record.id, record.legacyId]) {
      if (!key) continue;
      const fields = overrides[key];
      if (!fields) continue;
      used.add(key);
      for (const [field, value] of Object.entries(fields)) {
        if (!OVERRIDE_META.has(field)) (record as Record<string, unknown>)[field] = value;
      }
    }
  }
  return used;
}

/** Resolves a seed legacy ID or organisation ID to an organisation ID. */
export function resolveOrgRef(ref: string, orgs: Organisation[]): string | undefined {
  return orgs.find((o) => o.id === ref || o.legacyId === ref)?.id;
}

/** Exact-match club alias lookup within one country. Never guesses (docs/05 §5.4). */
export function resolveAlias(
  text: string | undefined,
  country: string,
  aliases: Record<string, Record<string, string> | null>,
  orgs: Organisation[],
): string | undefined {
  const ref = text ? aliases[country]?.[text.trim()] : undefined;
  return ref ? resolveOrgRef(ref, orgs) : undefined;
}

export interface SampleSiteInput {
  name: string;
  region: string;
  steward: { legacyId?: string; role: StewardRole };
  alsoAdministeredBy?: { legacyId: string; note?: string };
  officialGuideUrl?: string;
  siteAccessNote?: string;
  stations?: string[];
  pgeIds?: string[]; // ParaglidingEarth takeoffs that are this site, checked by hand
  note?: string;
  source: string;
}

/** Hand-compiled sites (the NZ sample): steward facts only until coordinates arrive (M2, ParaglidingEarth). */
export function mapSampleSites(
  inputs: SampleSiteInput[],
  orgs: Organisation[],
  date: string,
  warnings: BuildWarning[],
): Site[] {
  return inputs.map((input) => {
    const country = input.region.split("-")[0] ?? "";
    const slug = orgSlug(input.name);
    const id = siteId(country, input.region, slug);
    const stewardOrgId = input.steward.legacyId ? resolveOrgRef(input.steward.legacyId, orgs) : undefined;
    if (input.steward.legacyId && !stewardOrgId) {
      warnings.push({ code: "steward-missing", message: `${input.name}: steward ${input.steward.legacyId} not found`, recordId: id });
    }
    const also = input.alsoAdministeredBy ? resolveOrgRef(input.alsoAdministeredBy.legacyId, orgs) : undefined;
    const source: SourceRef = { providerId: "manual", url: input.source, fetchedAt: date, licence: "facts" };
    return {
      id,
      slug,
      name: input.name,
      country,
      regionCode: input.region,
      windRanges: [],
      windRangeLabel: "See official details",
      status: "unknown",
      stewardOrgId,
      stewardRole: input.steward.role,
      stewardNote: input.note,
      alsoAdministeredBy: also ? [{ orgId: also, note: input.alsoAdministeredBy?.note }] : undefined,
      siteAccessNote: input.siteAccessNote,
      officialGuideUrl: input.officialGuideUrl,
      launches: [],
      stationIds: input.stations ?? [],
      disciplines: [],
      layer: "manual",
      sources: [source],
    } satisfies Site;
  });
}

/** Clubs gain their derived site and station lists (docs/04 §7). */
export function deriveClubs(orgs: Organisation[], sites: Site[], stations: Station[]): (Organisation | Club)[] {
  return orgs.map((o) => {
    if (o.kind !== "club") return o;
    const siteIds = sites
      .filter(
        (s) =>
          (s.stewardRole === "club" && s.stewardOrgId === o.id) ||
          s.alsoAdministeredBy?.some((a) => a.orgId === o.id),
      )
      .map((s) => s.id);
    const stationIds = stations.filter((s) => s.ownerOrgId === o.id).map((s) => s.id);
    return { ...o, kind: "club", siteIds, stationIds } satisfies Club;
  });
}

export interface OfferingInput {
  org: string;
  type: Offering["type"];
  discipline?: Offering["discipline"];
  title: string;
  priceFromAud?: number;
  priceFrom?: number;
  priceText?: string;
  durationText?: string;
  inclusions?: string[];
  url: string;
  sourceCheckedAt: string;
}

/** Published prices, each tied to an organisation by name or legacy ID, in its country's currency. */
export function mapOfferings(
  inputs: OfferingInput[],
  orgs: Organisation[],
  countries: Country[],
  providers: Map<string, Provider>,
  warnings: BuildWarning[],
): Offering[] {
  const out: Offering[] = [];
  for (const input of inputs) {
    const matches = orgs.filter((o) => o.legacyId === input.org || o.name === input.org);
    if (matches.length !== 1) {
      warnings.push({
        code: "offering-org",
        message: `Offering "${input.title}": organisation "${input.org}" matched ${matches.length} records`,
      });
      continue;
    }
    const org = matches[0] as Organisation;
    const currency = countries.find((c) => c.code === org.country)?.currency;
    out.push({
      orgId: org.id,
      type: input.type,
      discipline: input.discipline,
      title: input.title,
      priceFrom: input.priceFrom ?? input.priceFromAud,
      currency,
      priceText: input.priceText,
      durationText: input.durationText,
      inclusions: input.inclusions,
      url: input.url,
      source: {
        providerId: "org-websites",
        url: input.url,
        fetchedAt: input.sourceCheckedAt,
        licence: providers.get("org-websites")?.licence ?? "facts",
      },
    });
  }
  return out;
}

/**
 * Station IDs for each site from data/manual/site-stations.yaml (curated order first), with any
 * hand-set approximate distances.
 */
export function applySiteStations(
  sites: Site[],
  curated: Record<string, SiteStationEntry[]>,
  stations: Station[],
  warnings: BuildWarning[],
): void {
  const known = new Set(stations.map((s) => s.id));
  for (const site of sites) {
    const entries = curated[site.id];
    if (!entries) continue;
    const ids = entries.map((e) => (typeof e === "string" ? e : e.id));
    const distances = Object.fromEntries(
      entries.flatMap((e) => (typeof e === "string" || !known.has(e.id) ? [] : [[e.id, e.km]])),
    );
    if (Object.keys(distances).length > 0) site.stationDistancesKm = distances;
    for (const id of ids) {
      if (!known.has(id)) warnings.push({ code: "station-missing", message: `${site.id}: station ${id} not found`, recordId: site.id });
    }
    site.stationIds = [...new Set([...ids.filter((id) => known.has(id)), ...site.stationIds.filter((id) => known.has(id))])];
  }
}

