// Exact matching of names and web addresses to organisations (docs/05 §5.4, D48). Never guesses:
// a match needs an alias, the same website as exactly one organisation, or the same name after
// normalising case, "&"/"and", punctuation and a trailing "Inc".
import type { Organisation } from "@/lib/types";

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

/** "Illawarra Gliding Club Inc." → "illawarra gliding club"; "A & B" → "a and b". */
export function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[.,'’\-–/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s+(inc|incorporated)$/, "");
}

export type Aliases = Record<string, Record<string, string> | null>;

export type MatchRule = "code" | "alias" | "website" | "name";

/** Another source's code for an organisation, e.g. SAFA's club code "CG" (D60). */
export interface ClubRef {
  providerId: string;
  id: string;
}

/** Looks organisations up by alias, website or name within one country. */
export class OrgMatcher {
  private byId = new Map<string, Organisation>();
  private byUrl = new Map<string, string[]>();
  private byName = new Map<string, string[]>();
  private byPart = new Map<string, string[]>();
  private byCode = new Map<string, string>();

  constructor(
    orgs: Organisation[],
    private readonly aliases: Aliases,
  ) {
    for (const o of orgs) this.add(o);
  }

  /** Adds an organisation (e.g. one just created from a source) to the indexes. */
  add(o: Organisation): void {
    this.byId.set(o.id, o);
    if (o.legacyId) this.byId.set(o.legacyId, o);
    const push = (map: Map<string, string[]>, key: string) => {
      if (!map.get(key)?.includes(o.id)) map.set(key, [...(map.get(key) ?? []), o.id]);
    };
    const url = normaliseUrl(o.website);
    if (url) push(this.byUrl, `${o.country}|${url}`);
    for (const [provider, code] of Object.entries(o.externalIds ?? {})) {
      this.byCode.set(`${provider}|${code}`, o.id);
    }
    for (const name of [o.name, ...(o.aliases ?? [])]) {
      push(this.byName, `${o.country}|${normaliseName(name)}`);
      // "Queensland Sports Aviators (QSA)" is also found as "QSA" and as "Queensland Sports Aviators".
      const m = /^(.*?)\s*\(([^()]+)\)\s*$/.exec(name);
      // Full names are tried first, so "Manilla Paragliding" isn't confused with "Manilla Paragliding (Cairns)".
      if (m?.[1]) push(this.byPart, `${o.country}|${normaliseName(m[1])}`);
      if (m?.[2]) push(this.byPart, `${o.country}|${normaliseName(m[2])}`);
    }
  }

  find(
    country: string,
    name: string | undefined,
    url?: string,
    ref?: ClubRef,
  ): { org: Organisation; rule: MatchRule } | undefined {
    const coded = ref ? this.byId.get(this.byCode.get(`${ref.providerId}|${ref.id}`) ?? "") : undefined;
    if (coded && coded.country === country) return { org: coded, rule: "code" };
    const urlKey = normaliseUrl(url);
    const aliases = this.aliases[country] ?? {};
    const aliasRef = (name ? aliases[name.trim()] : undefined) ?? (urlKey ? aliases[urlKey] : undefined);
    const aliased = aliasRef ? this.byId.get(aliasRef) : undefined;
    if (aliased) return { org: aliased, rule: "alias" };
    const only = (ids: string[] | undefined) =>
      ids?.length === 1 ? this.byId.get(ids[0] as string) : undefined;
    const byUrl = urlKey ? only(this.byUrl.get(`${country}|${urlKey}`)) : undefined;
    if (byUrl) return { org: byUrl, rule: "website" };
    const key = name ? `${country}|${normaliseName(name)}` : undefined;
    const byName = key ? only(this.byName.get(key)) : undefined;
    if (byName) return { org: byName, rule: "name" };
    const byPart = key && !this.byName.has(key) ? only(this.byPart.get(key)) : undefined;
    if (byPart) return { org: byPart, rule: "name" };
    return undefined;
  }

  get(ref: string): Organisation | undefined {
    return this.byId.get(ref);
  }
}
