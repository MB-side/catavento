// Merges organisations collected from sources (e.g. SAFA's directories) into the directory built
// from the seed (docs/03 §6: ingest wins over seed). Matching is exact only (docs/05 §5.4); an
// unmatched record becomes a new organisation, so nothing the national body lists is lost.
import type { BuildWarning, CollectedOrg, OrgKind, Organisation } from "@/lib/types";
import { orgId, orgSlug } from "./ids";
import type { OrgMatcher } from "./match";

// A source's "club" may be a club or an association; its "school" any business that teaches.
const COMPATIBLE: Record<string, ReadonlySet<OrgKind>> = {
  club: new Set(["club", "regional_association", "governing_body"]),
  school: new Set(["school", "tandem_operator", "flight_park", "operator", "retailer", "manufacturer"]),
};

const dateOf = (iso: string) => iso.slice(0, 10);

export interface OrgMergeResult {
  organisations: Organisation[];
  /** Organisation ID → the regional association its source names. */
  associationNames: Map<string, { country: string; name: string }>;
}

export function mergeCollectedOrgs(
  collected: CollectedOrg[],
  organisations: Organisation[],
  matcher: OrgMatcher,
  warnings: BuildWarning[],
): OrgMergeResult {
  const out = [...organisations];
  const usedIds = new Set(out.map((o) => o.id));
  const associationNames = new Map<string, { country: string; name: string }>();
  const claimed = new Map<string, string>();

  for (const c of [...collected].sort((a, b) => a.id.localeCompare(b.id))) {
    const hit = matcher.find(c.country, c.name, c.website);
    const compatible = hit && COMPATIBLE[c.kind]?.has(hit.org.kind);
    if (hit && !compatible) {
      warnings.push({
        code: "org-kind-mismatch",
        message: `${c.providerId} ${c.kind} "${c.name}" matches ${hit.org.id} (a ${hit.org.kind}); kept apart`,
        recordId: c.id,
      });
    }
    if (hit && compatible) {
      const org = hit.org;
      const earlier = claimed.get(org.id);
      if (earlier) {
        warnings.push({
          code: "org-matched-twice",
          message: `${c.id} and ${earlier} both match ${org.id}; check by hand`,
          recordId: org.id,
        });
      }
      claimed.set(org.id, c.id);
      if (c.website) org.website = c.website;
      if (c.emailPublic) org.emailPublic = c.emailPublic;
      if (c.phonePublic) org.phonePublic = c.phonePublic;
      if (c.regionCode) org.regionCode = c.regionCode;
      org.disciplines = [...new Set([...org.disciplines, ...c.disciplines])];
      if (c.kind === "school") org.nationalBodyListed = true;
      if (c.name !== org.name && !org.aliases?.includes(c.name)) {
        org.aliases = [...(org.aliases ?? []), c.name];
      }
      if (!org.sources.some((s) => s.providerId === c.providerId && s.url === c.source.url)) {
        org.sources = [...org.sources, c.source];
      }
      org.lastVerified = dateOf(c.source.fetchedAt);
      if (org.verificationStatus === "needs_verification") org.verificationStatus = "listed_by_national_body";
      if (c.associationName) associationNames.set(org.id, { country: c.country, name: c.associationName });
      continue;
    }

    // Not in the directory yet: add it, as the national body lists it.
    let slug = orgSlug(c.name);
    if (usedIds.has(orgId(c.country, slug))) slug = orgSlug(c.name, true);
    for (let n = 2; usedIds.has(orgId(c.country, slug)); n++) slug = `${orgSlug(c.name, true)}-${n}`;
    const org: Organisation = {
      id: orgId(c.country, slug),
      slug,
      kind: c.kind,
      name: c.name,
      disciplines: c.disciplines,
      country: c.country,
      regionCode: c.regionCode,
      website: c.website,
      emailPublic: c.emailPublic,
      phonePublic: c.phonePublic,
      nationalBodyListed: c.kind === "school" ? true : undefined,
      sources: [c.source],
      lastVerified: dateOf(c.source.fetchedAt),
      verificationStatus: "listed_by_national_body",
    };
    usedIds.add(org.id);
    out.push(org);
    matcher.add(org);
    if (c.associationName) associationNames.set(org.id, { country: c.country, name: c.associationName });
    warnings.push({
      code: "org-added",
      message: `${c.id} "${c.name}" matches nothing in the directory; added as ${org.id}`,
      recordId: org.id,
    });
  }
  return { organisations: out, associationNames };
}
