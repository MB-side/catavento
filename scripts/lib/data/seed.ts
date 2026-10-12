// Maps the seed spreadsheets (data/seed/*.csv) to records (docs/04 §6). Pure functions: no file
// access, so every rule here is unit-tested.
import { guardRules } from "../content-guard";
import type {
  BuildWarning,
  Discipline,
  Licence,
  OrgKind,
  OrgVerification,
  Organisation,
  Provider,
  Resource,
  SourceRef,
  Station,
  StationVerification,
} from "@/lib/types";
import { orgId, orgSlug, slugify, stationId } from "./ids";

export type CsvRow = Record<string, string>;

const ORG_KINDS = new Set<OrgKind>([
  "governing_body",
  "regional_association",
  "club",
  "school",
  "tandem_operator",
  "retailer",
  "importer_distributor",
  "manufacturer",
  "service_centre",
]);
const RESOURCE_CATEGORIES = new Set([
  "info_tool",
  "weather_tool",
  "competition_platform",
  "community_media",
  "booking_marketplace",
  "tourism_listing",
]);
const SKIPPED_CATEGORIES = new Set(["overseas_benchmark", "domestic_benchmark"]);
const DISCIPLINES = new Set<Discipline>(["PG", "HG", "PPG", "WM", "tandem", "speedflying", "parakite"]);

/** A seed row before IDs are assigned (slugs need the whole country's names to avoid clashes). */
export interface SeedOrg extends Omit<Organisation, "id" | "slug"> {
  legacyId: string;
}

export interface SeedResult {
  orgs: SeedOrg[];
  resources: Resource[];
  warnings: BuildWarning[];
}

export function blankToUndefined(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v ? v : undefined;
}

export function parseDisciplines(value: string | undefined): Discipline[] {
  return (value ?? "")
    .split(";")
    .map((d) => d.trim())
    .filter((d): d is Discipline => DISCIPLINES.has(d as Discipline));
}

/** "NSW" → "AU-NSW"; "NSW;ACT" → "AU-NSW" (first listed); blank → undefined. */
export function regionFromState(country: string, state: string | undefined): string | undefined {
  const first = blankToUndefined(state?.split(";")[0]);
  return first ? `${country}-${first.toUpperCase()}` : undefined;
}

/** Seed verification values → the enum, per docs/10 C4. Notes asking to verify win. */
export function orgVerification(status: string, notes: string): OrgVerification {
  if (/\bverify\b|to be confirmed|not confirmed|unverified/i.test(notes)) return "needs_verification";
  if (status.startsWith("listed_by_")) return "listed_by_national_body";
  if (status === "needs_verification") return "needs_verification";
  if (status === "owner_confirmed") return "owner_confirmed";
  return "verified_public_source";
}

/** Which provider a seed row's source address belongs to. */
export function providerForUrl(url: string): string {
  const host = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  })();
  if (host.endsWith("safa.asn.au")) return "safa";
  if (host.endsWith("nzhgpa.org.nz")) return "nzhgpa";
  if (host.endsWith("siteguide.org.au")) return "ansg";
  if (host.endsWith("vhpa.org.au") || host.endsWith("queenslandsportsaviators.com.au")) return "assoc";
  return "org-websites";
}

/** Our own short summary must pass the same wording rules as every page. */
export function safeSummary(text: string | undefined): string | undefined {
  const t = blankToUndefined(text);
  if (!t) return undefined;
  return guardRules.some((r) => r.pattern.test(t)) ? undefined : t;
}

export function sourceRef(url: string, date: string, providers: Map<string, Provider>): SourceRef {
  const providerId = providerForUrl(url);
  const licence: Licence = providers.get(providerId)?.licence ?? "unknown";
  return { providerId, url, fetchedAt: date, licence };
}

export function mapDirectory(rows: CsvRow[], providers: Map<string, Provider>): SeedResult {
  const orgs: SeedOrg[] = [];
  const resources: Resource[] = [];
  const warnings: BuildWarning[] = [];

  for (const row of rows) {
    const id = row.id ?? "";
    const category = row.category ?? "";
    const country = blankToUndefined(row.country);
    const sourceUrl = blankToUndefined(row.source_url) ?? blankToUndefined(row.website);
    const lastChecked = blankToUndefined(row.last_checked) ?? "";

    if (SKIPPED_CATEGORIES.has(category)) continue;

    if (RESOURCE_CATEGORIES.has(category)) {
      const url = blankToUndefined(row.website);
      if (!url) {
        warnings.push({ code: "resource-no-url", message: `${row.name}: no website in the seed, not listed`, recordId: id });
        continue;
      }
      resources.push({
        id: `resource:${slugify(row.name ?? id)}`,
        legacyId: id,
        name: row.name ?? id,
        url,
        category: blankToUndefined(row.subcategory) ?? category,
        summary: safeSummary(row.offerings_summary),
        countries: country ? [country] : undefined,
      });
      continue;
    }

    const kind: OrgKind | undefined =
      row.subcategory === "flight_park"
        ? "flight_park"
        : ORG_KINDS.has(category as OrgKind)
          ? (category as OrgKind)
          : undefined;
    if (!kind) {
      warnings.push({ code: "unknown-category", message: `${row.name}: category "${category}" not imported`, recordId: id });
      continue;
    }
    if (!country) {
      warnings.push({ code: "no-country", message: `${row.name}: no country, not imported`, recordId: id });
      continue;
    }
    if (!sourceUrl) {
      warnings.push({ code: "no-source", message: `${row.name}: no source address, not imported`, recordId: id });
      continue;
    }

    const status = orgVerification(row.verification_status ?? "", row.notes ?? "");
    const listedBySchoolDirectory =
      row.in_safa_school_directory === "yes" ||
      (kind === "school" && (row.verification_status ?? "").startsWith("listed_by_"));

    orgs.push({
      legacyId: id,
      kind,
      name: (row.name ?? id).trim(),
      disciplines: parseDisciplines(row.disciplines),
      country,
      regionCode: regionFromState(country, row.state),
      locality: blankToUndefined(row.locality),
      postcode: blankToUndefined(row.postcode),
      website: blankToUndefined(row.website),
      emailPublic: blankToUndefined(row.email),
      phonePublic: blankToUndefined(row.phone),
      nationalBodyListed: listedBySchoolDirectory || undefined,
      summary: safeSummary(row.offerings_summary),
      sources: [sourceRef(sourceUrl, lastChecked, providers)],
      lastVerified: lastChecked,
      verificationStatus: status,
    });
  }
  return { orgs, resources, warnings };
}

/** Assigns IDs, keeping the parenthetical only where names would otherwise clash. */
export function assignOrgIds(orgs: SeedOrg[]): Organisation[] {
  const counts = new Map<string, number>();
  for (const o of orgs) {
    const key = `${o.country}:${orgSlug(o.name)}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return orgs.map((o) => {
    const clash = (counts.get(`${o.country}:${orgSlug(o.name)}`) ?? 0) > 1;
    const slug = orgSlug(o.name, clash);
    return { ...o, id: orgId(o.country, slug), slug };
  });
}

const STATION_PROVIDER: Record<string, string> = {
  freeflightwx: "freeflightwx",
  holfuy: "holfuy",
  club_site: "club-stations",
  weatherlink: "weatherlink",
  bom_aws: "bom",
};

export function stationVerification(status: string): { status: StationVerification; hidden: boolean } {
  switch (status) {
    case "verified_public_source":
    case "linked_by_club":
    case "listed_on_provider_index":
      return { status, hidden: false };
    // Name only, address not captured, or a third-party description: kept but not shown (docs/10 C4).
    default:
      return { status: "needs_verification", hidden: true };
  }
}

export function mapStations(rows: CsvRow[]): { stations: Station[]; warnings: BuildWarning[] } {
  const stations: Station[] = [];
  const warnings: BuildWarning[] = [];
  for (const row of rows) {
    const providerId = STATION_PROVIDER[row.provider ?? ""];
    if (!providerId) {
      warnings.push({ code: "unknown-station-provider", message: `${row.name}: provider "${row.provider}" unknown`, recordId: row.station_id });
      continue;
    }
    const country = blankToUndefined(row.country);
    if (!country) {
      warnings.push({ code: "no-country", message: `${row.name}: no country, not imported`, recordId: row.station_id });
      continue;
    }
    const ref = blankToUndefined(row.provider_ref) ?? row.name ?? row.station_id ?? "";
    const url = blankToUndefined(row.url);
    const v = stationVerification(row.verification_status ?? "");
    // BOM rows describe state feeds, not stations: kept for Iteration 2, never shown (docs/04 §6).
    const hidden = v.hidden || providerId === "bom" || !url;
    stations.push({
      id: stationId(providerId, ref),
      legacyId: row.station_id,
      providerId,
      providerRef: ref,
      name: (row.name ?? ref).trim(),
      country,
      url,
      embedAllowed: false,
      feedAllowed: false,
      verificationStatus: v.status,
      ...(hidden ? { hidden: true } : {}),
    });
  }
  return { stations, warnings };
}
