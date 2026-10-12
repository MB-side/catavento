// Parsers for SAFA's public pages (docs/05 §4.2). Facts only: names, regions, published contacts,
// websites, dates and links. Never committee members' names or details, never descriptions.
import * as cheerio from "cheerio";
import type { Discipline, EventType } from "@/lib/types";

export const SAFA_BASE = "https://safa.asn.au";

/** "PO Box 2 Port Douglas, Qld 4870  QLD 4877" → "QLD": the last state abbreviation in an address. */
export function stateFromAddress(address: string): string | undefined {
  const matches = [...address.matchAll(/\b(ACT|NSW|NT|QLD|SA|TAS|VIC|WA)\b\.?,?\s*\d{4}/gi)];
  return matches.at(-1)?.[1]?.toUpperCase();
}

/** Trims spacing and stray trailing punctuation: "Queensland Sports Aviators Inc. - " → "Queensland Sports Aviators Inc." */
export function cleanName(name: string): string {
  return name
    .replace(/\s+/g, " ")
    .replace(/[\s\-–,]+$/, "")
    .trim();
}

/** "www.flycanungra.com.au/" → "https://www.flycanungra.com.au/"; anything unusable → undefined. */
export function cleanWebsite(href: string | undefined): string | undefined {
  const raw = href?.trim();
  if (!raw || raw.startsWith("mailto:") || raw.startsWith("/")) return undefined;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.hostname.includes(".") ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function cleanEmail(href: string | undefined): string | undefined {
  const email = href?.replace(/^mailto:/i, "").trim();
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined;
}

export interface DirectoryCard {
  name: string;
  state?: string;
  email?: string;
  phone?: string;
  website?: string;
  detailPath?: string; // clubs: their SAFA detail page
  disciplines: Discipline[];
}

const BADGES: [RegExp, Discipline][] = [
  [/\(PG\)/, "PG"],
  [/\(HG\)/, "HG"],
  [/\(WM\)/, "WM"],
  [/\(PPG\)|paramotor/i, "PPG"],
];

/** The "full directory" cards on SAFA's club and school pages. Addresses give only the state. */
export function parseDirectory(html: string): DirectoryCard[] {
  const $ = cheerio.load(html);
  const cards: DirectoryCard[] = [];
  $("#allListingsDirectory .listingDirectoryItem").each((_, el) => {
    const card = $(el);
    const name = cleanName(card.find(".uk-text-bold").first().text());
    if (!name) return;
    let address = "";
    let phone: string | undefined;
    let email: string | undefined;
    card.find("span").each((__, span) => {
      const label = $(span).find("b").first().text().trim();
      const value = $(span).text().replace(label, "").trim();
      if (label === "Address:") address = value;
      if (label === "Phone:") phone = value.replace(/\s+/g, " ") || undefined;
      if (label === "Email:") email = cleanEmail($(span).find("a").attr("href"));
    });
    const link = card.find("a.uk-text-primary").last().attr("href");
    const disciplines = card
      .find(".uk-badge")
      .map((__, b) => BADGES.find(([re]) => re.test($(b).text()))?.[1])
      .get()
      .filter((d): d is Discipline => !!d);
    cards.push({
      name,
      state: stateFromAddress(address),
      email,
      phone,
      website: link?.startsWith("/find-a-club/") ? undefined : cleanWebsite(link),
      detailPath: link?.startsWith("/find-a-club/") ? link : undefined,
      disciplines: [...new Set(disciplines)],
    });
  });
  return cards;
}

export interface ClubDetail {
  name: string;
  email?: string;
  website?: string;
  association?: string;
}

/** A club's SAFA page: only the club-level list above "Key Personnel" is read. */
export function parseClubDetail(html: string): ClubDetail | undefined {
  const $ = cheerio.load(html);
  const heading = $("h1.uk-article-title").nextAll().find("h2").first();
  const name = cleanName(heading.text());
  if (!name) return undefined;
  const detail: ClubDetail = { name };
  heading
    .nextAll("ul")
    .first()
    .children("li")
    .each((_, li) => {
      const label = $(li).find("b").first().text().trim();
      const link = $(li).find("a").attr("href");
      if (label === "Email:") detail.email = cleanEmail(link);
      if (label === "Website:")
        detail.website = cleanWebsite(link ?? $(li).text().replace(label, ""));
      if (label === "Related Association:") {
        const value = cleanName($(li).text().replace(label, ""));
        if (value) detail.association = value;
      }
    });
  return detail;
}

export interface ParsedNotice {
  title: string;
  date: string;
  url: string;
}

/** Defect reports and safety notices: title and date from "YYYY.MM.DD Title" (or "YYYYMMDD Title"), plus the link. */
export function parseDefectNotices(html: string): { notices: ParsedNotice[]; undated: string[] } {
  const $ = cheerio.load(html);
  const heading = $("h2")
    .filter((_, h) => $(h).text().trim() === "Defect Reports")
    .first();
  const notices: ParsedNotice[] = [];
  const undated: string[] = [];
  heading
    .nextAll("table")
    .first()
    .find("tr")
    .each((_, tr) => {
      const cells = $(tr).find("td");
      if (cells.length < 4) return;
      const text = cells.eq(0).text().replace(/\s+/g, " ").trim();
      const url = cleanWebsite(cells.eq(3).find("a").attr("href"));
      const m = /^(\d{4})[.\-/]?(\d{2})[.\-/]?(\d{2})\s+(.+)$/.exec(text);
      if (!url) return;
      if (!m) {
        undated.push(text);
        return;
      }
      notices.push({ title: m[4] as string, date: `${m[1]}-${m[2]}-${m[3]}`, url });
    });
  return { notices, undated };
}

// ---------- events (SAFA's public events feed, The Events Calendar's JSON) ----------

export interface SafaEvent {
  id: number;
  title: string;
  url: string;
  start_date: string;
  end_date?: string;
  utc_start_date: string;
  all_day: boolean;
  categories?: { name: string; slug: string }[];
  venue?: { venue?: string; city?: string; stateprovince?: string; province?: string } | [];
  organizer?: { organizer?: string }[];
}

export interface SafaEventsPage {
  events: SafaEvent[];
  next_rest_url?: string;
}

const TYPES: [RegExp, EventType][] = [
  [/compet|\bcomp\b|championship|open\b/i, "competition"],
  [/fly[\s-]?in/i, "fly_in"],
  [/\bsiv\b/i, "siv"],
  [/clinic|course|training|workshop|seminar/i, "clinic"],
  [/\bagm\b|meeting/i, "meeting"],
  [/festival/i, "festival"],
  [/social|bbq|dinner|party/i, "social"],
];

export function eventType(title: string, categories: string[]): EventType {
  for (const text of [...categories, title]) {
    const hit = TYPES.find(([re]) => re.test(text));
    if (hit) return hit[1];
  }
  return "other";
}

/** "2026-10-17 19:00:00" local with "2026-10-17 08:00:00" UTC → "2026-10-17T19:00:00+11:00". */
export function localIso(local: string, utc: string): string {
  const asUtc = (s: string) => Date.parse(`${s.replace(" ", "T")}Z`);
  const offsetMin = Math.round((asUtc(local) - asUtc(utc)) / 60_000);
  const sign = offsetMin < 0 ? "-" : "+";
  const abs = Math.abs(offsetMin);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${local.replace(" ", "T")}${sign}${hh}:${mm}`;
}

export function decodeEntities(text: string): string {
  return cheerio.load(`<p>${text}</p>`)("p").text().replace(/\s+/g, " ").trim();
}
