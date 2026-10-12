// Parses the Australian National Site Guide's public Google Earth files (siteguide.org.au/Kml/Open
// and /Kml/Closed) into short facts per site (docs/05 §4.2). Descriptions, hazards, rules and
// landing notes are never kept: only names, positions, the short header fields, the listed
// contact and the page link.
import * as cheerio from "cheerio";
import { XMLParser } from "fast-xml-parser";

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
  contact?: { name: string; url?: string };
  launches: ParsedLaunch[];
  status: "open" | "closed";
}

interface Placemark {
  name?: string;
  description?: string;
  styleUrl?: string;
  Point?: { coordinates?: string };
}

const LAUNCH_STYLES = new Set(["#styleLaunch", "#styleClosedLaunch"]);
/** Header fields longer than this are prose, not short facts, and are dropped. */
const MAX_SHORT_FIELD = 80;

const asArray = <T>(v: T | T[] | undefined): T[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v];

function collectPlacemarks(node: unknown, out: Placemark[]): void {
  if (!node || typeof node !== "object") return;
  const n = node as Record<string, unknown>;
  for (const pm of asArray(n.Placemark as Placemark | Placemark[] | undefined)) out.push(pm);
  for (const key of ["Document", "Folder", "kml"]) {
    for (const child of asArray(n[key] as unknown)) collectPlacemarks(child, out);
  }
}

function shortText(value: string | undefined): string | undefined {
  const t = value?.replace(/\s+/g, " ").trim();
  return t && t.length <= MAX_SHORT_FIELD ? t : undefined;
}

/** "152.8423, -31.5948" or "152.8423,-31.5948,0" → { lat, lon } */
export function parseCoordinates(
  text: string | undefined,
): { lat: number; lon: number } | undefined {
  const [lonText, latText] = (text ?? "").trim().split(/\s*,\s*/);
  const lon = Number(lonText);
  const lat = Number(latText);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180)
    return undefined;
  return { lat, lon };
}

interface Header {
  siteName?: string;
  siteGuideUrl?: string;
  typeText?: string;
  heightText?: string;
  conditionsText?: string;
  ratingText?: string;
  contact?: { name: string; url?: string };
}

/** Reads the header tables and the Contact/Responsible line from a launch description. */
export function parseDescription(html: string): Header {
  const $ = cheerio.load(html);
  const link = $('a[href*="/Sites/Details/"]').first();
  const tables = $("table");
  const facts = tables.eq(1).find("tr");
  const cell = (row: number, col: number) => facts.eq(row).find("td").eq(col).text();

  let contact: Header["contact"];
  $("b").each((_, el) => {
    if (contact || !/Contact\s*\/\s*Responsible/i.test($(el).text())) return;
    const a = $(el).nextAll("a").first();
    const name = shortText(a.text());
    if (name) {
      const href = a.attr("href");
      contact = { name, url: href && /^https?:\/\//.test(href) ? href : undefined };
    }
  });

  return {
    siteName: shortText(link.text()),
    siteGuideUrl: link.attr("href")?.replace(/ /g, "%20"),
    typeText: shortText(cell(0, 0)),
    heightText: shortText(cell(0, 1)),
    conditionsText: shortText(cell(1, 0)),
    ratingText: shortText(cell(1, 1)),
    contact,
  };
}

/** Launch name without the "Site name - " prefix the guide uses inside multi-launch folders. */
function launchName(placemarkName: string, siteName: string): string {
  const prefix = `${siteName} - `;
  const name = placemarkName.startsWith(prefix)
    ? placemarkName.slice(prefix.length)
    : placemarkName;
  return name === siteName ? "Launch" : name;
}

export function parseSiteGuideKml(
  xml: string,
  status: "open" | "closed",
): {
  sites: ParsedSite[];
  skipped: string[];
} {
  const doc = new XMLParser({
    ignoreAttributes: true,
    processEntities: true,
    htmlEntities: true,
  }).parse(xml) as unknown;
  const placemarks: Placemark[] = [];
  collectPlacemarks(doc, placemarks);

  const bySite = new Map<string, ParsedSite>();
  const skipped: string[] = [];
  for (const pm of placemarks) {
    if (!pm.styleUrl || !LAUNCH_STYLES.has(pm.styleUrl)) continue;
    const header = parseDescription(String(pm.description ?? ""));
    const position = parseCoordinates(pm.Point?.coordinates);
    if (!header.siteGuideUrl || !header.siteName || !position) {
      skipped.push(String(pm.name ?? "unnamed launch"));
      continue;
    }
    let site = bySite.get(header.siteGuideUrl);
    if (!site) {
      site = {
        name: header.siteName,
        siteGuideUrl: header.siteGuideUrl,
        typeText: header.typeText,
        heightText: header.heightText,
        conditionsText: header.conditionsText,
        ratingText: header.ratingText,
        contact: header.contact,
        launches: [],
        status,
      };
      bySite.set(header.siteGuideUrl, site);
    }
    site.contact ??= header.contact;
    site.launches.push({ name: launchName(String(pm.name ?? ""), site.name), ...position });
  }
  return { sites: [...bySite.values()], skipped };
}
