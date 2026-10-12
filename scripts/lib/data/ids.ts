// Identifier helpers (docs/04 §1). IDs are stable once published; slugs come from names.

/** Lowercase kebab-case: "Hawke's Bay & Co." → "hawkes-bay-co". Macrons and accents are folded. */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const LEGAL_SUFFIX = /\b(inc|incorporated|pty|ltd|limited)\.?$/i;

/**
 * Organisation slug: drops a trailing parenthetical (an acronym or note, e.g. "(SAFA)") and legal
 * suffixes such as "Inc". `keepParenthetical` keeps the bracketed part, used to tell apart
 * records that would otherwise collide (e.g. "SkySurf Paragliding (Canberra)" and "(Wollongong)").
 */
export function orgSlug(name: string, keepParenthetical = false): string {
  let base = keepParenthetical ? name : name.replace(/\s*\([^)]*\)\s*$/, "");
  for (let i = 0; i < 3; i++) base = base.trim().replace(LEGAL_SUFFIX, "");
  return slugify(base);
}

export function orgId(country: string, slug: string): string {
  return `org:${country.toLowerCase()}:${slug}`;
}

/** "AU-NSW" → "nsw" (the URL and ID segment for a region). */
export function regionSegment(regionCode: string): string {
  return regionCode.split("-")[1]?.toLowerCase() ?? regionCode.toLowerCase();
}

export function siteId(country: string, regionCode: string, slug: string): string {
  return `site:${country.toLowerCase()}:${regionSegment(regionCode)}:${slug}`;
}

export function stationId(providerId: string, ref: string): string {
  return `station:${providerId}:${slugify(ref)}`;
}
