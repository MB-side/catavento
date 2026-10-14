// Directory views (docs/02 §5.8–5.9): schools, tandem providers, gear businesses and profiles,
// gathered from lib/data at build time.
import "server-only";
import { getBrands, getOfferings, getOrganisations } from "@/lib/data";
import type { BrandLink, Country, Offering, Organisation, OrgKind } from "@/lib/types";

const has = (o: Organisation, kinds: OrgKind[]) =>
  kinds.includes(o.kind) || (o.additionalKinds ?? []).some((k) => kinds.includes(k));

const byName = (a: Organisation, b: Organisation) => a.name.localeCompare(b.name);

/** Every organisation with a directory profile: anything that isn't a club or association. */
export function directoryOrgs(country: Country): Organisation[] {
  return getOrganisations({ country: country.code })
    .filter((o) => o.kind !== "club" && o.kind !== "regional_association")
    .sort(byName);
}

export function schools(country: Country): Organisation[] {
  return directoryOrgs(country).filter((o) => has(o, ["school"]));
}

/**
 * Businesses that publish tandem flights: tandem operators, organisations listed with tandem as a
 * discipline or a tandem offering, or whose description (from the founder's research) says so.
 */
export function tandemProviders(country: Country): Organisation[] {
  return directoryOrgs(country).filter(
    (o) =>
      has(o, ["tandem_operator"]) ||
      o.disciplines.includes("tandem") ||
      getOfferings(o.id).some((x) => x.type === "tandem") ||
      /\btandem/i.test(o.summary ?? ""),
  );
}

export function gearOrgs(country: Country): Organisation[] {
  // Shops, importers and service centres, plus schools and others that sell gear (D84).
  return directoryOrgs(country).filter(
    (o) =>
      has(o, ["retailer", "importer_distributor", "manufacturer", "service_centre"]) ||
      (o.sells?.length ?? 0) > 0,
  );
}

export function serviceCentres(country: Country): Organisation[] {
  return directoryOrgs(country).filter((o) => has(o, ["service_centre"]));
}

/** The lowest published price among an organisation's offerings, if any. */
export function priceFrom(orgId: string): Offering | undefined {
  return getOfferings(orgId)
    .filter((o) => o.priceFrom !== undefined)
    .sort((a, b) => (a.priceFrom ?? 0) - (b.priceFrom ?? 0))[0];
}

/** Groups organisations by region, in the country's region order, unregioned last. */
export function byRegion(country: Country, orgs: Organisation[]) {
  const keys = [...country.regions, ""];
  return keys
    .map((code) => ({ code, orgs: orgs.filter((o) => (o.regionCode ?? "") === code) }))
    .filter((g) => g.orgs.length > 0);
}

/** Every business's brands, keyed by organisation ID. */
export function brandsByOrg(): Record<string, BrandLink[]> {
  const out: Record<string, BrandLink[]> = {};
  for (const b of getBrands()) {
    for (const d of b.distributors)
      (out[d.orgId] ??= []).push({ name: b.name, role: d.role, basis: d.basis });
  }
  for (const list of Object.values(out)) list.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}
