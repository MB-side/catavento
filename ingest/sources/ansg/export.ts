// Reads the Site Guide's export service (/api/Export), which its webmaster suggested (D59). Keeps
// short facts only: names, launch positions, type, height, rating, wind directions, status, and
// each site's listed contact (name, link and SAFA club code). Descriptions, hazards, landing
// notes, landowners, photos, phone numbers and addresses are never read into Catavento.

export const SITE_GUIDE_BASE = "https://siteguide.org.au";

/** Fields longer than this are prose, not short facts, and are dropped. */
export const MAX_SHORT_FIELD = 80;

export interface ExportContact {
  isContact?: boolean;
  isResponsible?: boolean;
  name?: string | null;
  fullName?: string | null;
  link?: string | null;
  safaClubId?: string | null;
}

export interface ExportLaunch {
  name?: string | null;
  conditions?: string | null; // the launch's own wind directions, where the site gives none
  lat?: number;
  lon?: number;
}

export interface ExportSite {
  id: number;
  name?: string | null;
  closed?: string | null;
  rating?: string | null;
  height?: string | null;
  type?: string | null;
  conditions?: string | null;
  launches?: ExportLaunch[] | null;
  contacts?: ExportContact[] | null;
}

export interface SiteGuideExport {
  version?: { id: number; published?: string };
  sites?: ExportSite[] | null;
}

export interface ParsedLaunch {
  name: string;
  lat: number;
  lon: number;
}

export interface ParsedSite {
  name: string;
  siteGuideUrl: string;
  typeText?: string;
  heightText?: string;
  conditionsText?: string;
  ratingText?: string;
  contact?: { name: string; url?: string; clubRef?: { providerId: string; id: string } };
  launches: ParsedLaunch[];
  status: "open" | "closed";
}

export function short(value: string | null | undefined): string | undefined {
  const t = value?.replace(/\s+/g, " ").trim();
  return t && t.length <= MAX_SHORT_FIELD ? t : undefined;
}

/** The site's page, as the Site Guide links it: its name as stored, percent-encoded. */
export function siteGuidePage(rawName: string): string {
  return `${SITE_GUIDE_BASE}/Sites/Details/${encodeURIComponent(rawName).replace(/%2C/g, ",")}`;
}

function httpLink(value: string | null | undefined): string | undefined {
  const v = value?.trim();
  if (!v) return undefined;
  try {
    const u = new URL(v);
    return /^https?:$/.test(u.protocol) ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The contact to list: the responsible body with a SAFA club code first, then any contact with a
 * code, then the responsible body, then any contact. A person's name without a club code is only
 * chosen when nothing else is listed (and the build then shows it only if it links to a club).
 */
export function chooseContact(contacts: ExportContact[] | null | undefined): ParsedSite["contact"] {
  const list = contacts ?? [];
  const ranked = [
    list.find((c) => c.isResponsible && c.safaClubId),
    list.find((c) => c.isContact && c.safaClubId),
    list.find((c) => c.isResponsible),
    list.find((c) => c.isContact),
  ].find(Boolean);
  if (!ranked) return undefined;
  const name = (ranked.fullName ?? "").trim() || (ranked.name ?? "").trim();
  if (!name) return undefined;
  const code = ranked.safaClubId?.trim();
  return {
    name,
    url: httpLink(ranked.link),
    clubRef: code ? { providerId: "safa", id: code } : undefined,
  };
}

export function parseExport(data: SiteGuideExport): { sites: ParsedSite[]; skipped: string[] } {
  const sites: ParsedSite[] = [];
  const skipped: string[] = [];
  for (const s of data.sites ?? []) {
    const rawName = s.name ?? "";
    const name = rawName.replace(/\s+/g, " ").trim();
    const launches = (s.launches ?? [])
      .filter(
        (l) =>
          typeof l.lat === "number" &&
          typeof l.lon === "number" &&
          Math.abs(l.lat) <= 90 &&
          Math.abs(l.lon) <= 180 &&
          !(l.lat === 0 && l.lon === 0),
      )
      .map((l) => ({
        name: l.name?.trim() || "Launch",
        lat: l.lat as number,
        lon: l.lon as number,
      }));
    if (!name || launches.length === 0) {
      skipped.push(name || `site ${s.id}`);
      continue;
    }
    sites.push({
      name,
      siteGuideUrl: siteGuidePage(rawName),
      typeText: short(s.type),
      heightText: short(s.height),
      ratingText: short(s.rating),
      // Wind directions: the site's own, or else those given for its launches.
      conditionsText:
        short(s.conditions) ??
        short(
          [...new Set((s.launches ?? []).map((l) => l.conditions?.trim()).filter(Boolean))].join(
            ", ",
          ),
        ),
      contact: chooseContact(s.contacts),
      launches,
      status: s.closed?.trim() ? "closed" : "open",
    });
  }
  return { sites, skipped };
}
