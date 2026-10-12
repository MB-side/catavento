// Reading club websites (amber tier, docs/05 §4): find a club's public news feed, events calendar
// and "sites" page from its home page; read headlines, dates and links only; and note which site
// names its own sites page mentions (the second source for stewardship, D47). Never copies text.
import * as cheerio from "cheerio";
import { XMLParser } from "fast-xml-parser";
import { normaliseName } from "@/scripts/lib/data/match";

export interface Discovered {
  feeds: string[]; // RSS or Atom
  calendars: string[]; // iCal (.ics)
  eventsApi?: string; // The Events Calendar's JSON, on WordPress sites that use it
  sitesPages: string[];
  menuNames: string[]; // entries under a "Sites" menu, often one per flying site
}

const SITES_LINK = /\b(flying\s+)?sites?\b|\bsite\s+guide\b|\bwhere\s+to\s+fly\b|\blaunch(es)?\b/i;
const SKIP_LINK = /\b(website|map|search|login|log in|sign in|members?\s+only)\b/i;

/** Same site, ignoring "www." and http/https. */
function sameHost(a: URL, b: URL): boolean {
  return a.hostname.replace(/^www\./, "") === b.hostname.replace(/^www\./, "");
}

/** Finds feeds, calendars and sites pages linked from a club's home page. */
export function discover(html: string, pageUrl: string): Discovered {
  const $ = cheerio.load(html);
  const base = new URL(pageUrl);
  const abs = (href: string | undefined) => {
    if (!href) return undefined;
    try {
      const u = new URL(href.replace(/^webcal:/i, "https:"), base);
      return /^https?:$/.test(u.protocol) ? u : undefined;
    } catch {
      return undefined;
    }
  };
  const feeds = new Set<string>();
  $('link[rel="alternate"]').each((_, el) => {
    const type = $(el).attr("type") ?? "";
    const u = abs($(el).attr("href"));
    // WordPress also advertises comment feeds; only the main feed carries news.
    if (u && /rss|atom/.test(type) && !/comments/i.test(u.pathname)) feeds.add(u.toString());
  });
  const calendars = new Set<string>();
  const sitesPages = new Set<string>();
  const menuNames = new Set<string>();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const u = abs(href);
    if (!u) return;
    if (
      /\.ics(\?|$)/i.test(u.pathname + u.search) ||
      /^webcal:/i.test(href) ||
      /[?&]ical=1/.test(u.search)
    ) {
      calendars.add(u.toString());
      return;
    }
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (sameHost(u, base) && text.length <= 40 && SITES_LINK.test(text) && !SKIP_LINK.test(text)) {
      // A "Sites" drop-down: the entries under it usually name the club's sites. The menu is a
      // list nested in the same list item, or the element right after the link.
      const item = $(el).closest("li");
      const menu = item.length ? item.find("ul a, ol a") : $(el).next().find("a");
      menu.each((__, entry) => {
        const name = $(entry).text().replace(/\s+/g, " ").trim();
        if (name && name.length <= 40) menuNames.add(name);
      });
      u.hash = "";
      if (u.toString() !== base.toString()) sitesPages.add(u.toString());
    }
  });
  const usesEventsCalendar =
    /tribe-events|the-events-calendar/i.test(html) && /wp-content|wp-json/i.test(html);
  return {
    feeds: [...feeds].slice(0, 2),
    calendars: [...calendars].slice(0, 2),
    eventsApi: usesEventsCalendar
      ? new URL("/wp-json/tribe/events/v1/events", base).toString()
      : undefined,
    sitesPages: [...sitesPages].slice(0, 2),
    menuNames: [...menuNames].slice(0, 40),
  };
}

export interface FeedItem {
  title: string;
  date: string; // YYYY-MM-DD
  url: string;
}

const xml = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@" });

const text = (v: unknown): string =>
  typeof v === "string"
    ? v
    : typeof v === "number"
      ? String(v)
      : typeof v === "object" && v && "#text" in v
        ? String((v as { "#text": unknown })["#text"])
        : "";

function plain(s: string): string {
  return cheerio.load(`<p>${s}</p>`)("p").text().replace(/\s+/g, " ").trim();
}

/** RSS 2.0 or Atom: each item's title, date and link. Item text (descriptions) is ignored. */
export function parseFeed(body: string): FeedItem[] {
  const doc = xml.parse(body) as Record<string, unknown>;
  const rss = (doc.rss as { channel?: { item?: unknown } } | undefined)?.channel?.item;
  const atom = (doc.feed as { entry?: unknown } | undefined)?.entry;
  const items = ([] as unknown[]).concat(rss ?? atom ?? []);
  const out: FeedItem[] = [];
  for (const raw of items) {
    const item = raw as Record<string, unknown>;
    const title = plain(text(item.title));
    const linkField = item.link;
    const link = Array.isArray(linkField)
      ? text(
          (
            linkField.find((l) => (l as Record<string, string>)["@rel"] !== "edit") as Record<
              string,
              string
            >
          )?.["@href"],
        )
      : typeof linkField === "object" && linkField
        ? text((linkField as Record<string, string>)["@href"] ?? linkField)
        : text(linkField);
    const when = Date.parse(
      text(item.pubDate ?? item.published ?? item.updated ?? item["dc:date"]),
    );
    if (!title || !/^https?:\/\//.test(link) || !Number.isFinite(when)) continue;
    out.push({ title, date: new Date(when).toISOString().slice(0, 10), url: link });
  }
  return out;
}

export interface CalendarEvent {
  uid: string;
  title: string;
  start: string; // YYYY-MM-DD, or local date-time with offset
  end?: string;
  location?: string;
  url?: string;
}

/** Minutes east of UTC for a time zone at a given instant. */
function offsetMinutes(timeZone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return Math.round((asUtc - at.getTime()) / 60_000);
}

const fmtOffset = (min: number) =>
  `${min < 0 ? "-" : "+"}${String(Math.floor(Math.abs(min) / 60)).padStart(2, "0")}:${String(Math.abs(min) % 60).padStart(2, "0")}`;

/** An iCal date or date-time ("20261017", "20261017T190000Z", or local with TZID) as ISO 8601. */
export function icsDate(
  value: string,
  tzid: string | undefined,
  fallbackZone: string,
): string | undefined {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(value.trim());
  if (!m) return undefined;
  const [, y, mo, d, h, mi, s, z] = m;
  if (!h) return `${y}-${mo}-${d}`;
  if (z) return `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
  let zone = tzid ?? fallbackZone;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
  } catch {
    zone = fallbackZone;
  }
  // Wall-clock time in that zone: find its offset (twice, to settle across a daylight-saving change).
  const wall = Date.UTC(+y!, +mo! - 1, +d!, +h, +mi!, +s!);
  let off = offsetMinutes(zone, new Date(wall));
  off = offsetMinutes(zone, new Date(wall - off * 60_000));
  return `${y}-${mo}-${d}T${h}:${mi}:${s}${fmtOffset(off)}`;
}

/** Reads VEVENTs from an iCal file: title, start, end, place and link. Descriptions are ignored. */
export function parseIcs(body: string, fallbackZone: string): CalendarEvent[] {
  const lines = body.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
  const events: CalendarEvent[] = [];
  let cur: Record<string, { value: string; tzid?: string }> | undefined;
  const unescape = (s: string) =>
    s
      .replace(/\\n/gi, " ")
      .replace(/\\([,;\\])/g, "$1")
      .trim();
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") cur = {};
    else if (line === "END:VEVENT" && cur) {
      const start = cur.DTSTART
        ? icsDate(cur.DTSTART.value, cur.DTSTART.tzid, fallbackZone)
        : undefined;
      const title = cur.SUMMARY ? unescape(cur.SUMMARY.value) : "";
      if (start && title) {
        let end = cur.DTEND ? icsDate(cur.DTEND.value, cur.DTEND.tzid, fallbackZone) : undefined;
        // All-day events end on the day after they finish (iCal's exclusive end date).
        if (end && start.length === 10 && end.length === 10) {
          const last = new Date(`${end}T00:00:00Z`);
          last.setUTCDate(last.getUTCDate() - 1);
          end = last.toISOString().slice(0, 10);
        }
        const url = cur.URL?.value.trim();
        events.push({
          uid: cur.UID?.value.trim() || `${start}|${title}`,
          title,
          start,
          end: end && end !== start ? end : undefined,
          location: cur.LOCATION ? unescape(cur.LOCATION.value) || undefined : undefined,
          url: url && /^https?:\/\//.test(url) ? url : undefined,
        });
      }
      cur = undefined;
    } else if (cur) {
      const m = /^([A-Z-]+)((?:;[^:]*)?):(.*)$/.exec(line);
      if (!m) continue;
      const tzid = /;TZID=("?)([^;:"]+)\1/.exec(m[2] ?? "")?.[2];
      cur[m[1] as string] = { value: m[3] ?? "", tzid };
    }
  }
  return events;
}

/** Lowercase words separated by single spaces: names and page text compare the same way. */
function phrase(s: string): string {
  return normaliseName(s)
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The visible text of a page, as words, for whole-phrase matching. */
export function pageText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, noscript, nav, footer, header").remove();
  return ` ${phrase($("body").text())} `;
}

const COMPASS = new Set([
  "n",
  "nne",
  "ne",
  "ene",
  "e",
  "ese",
  "se",
  "sse",
  "s",
  "ssw",
  "sw",
  "wsw",
  "w",
  "wnw",
  "nw",
  "nnw",
]);

// Words that name a kind of place, not a place: never enough on their own.
const GENERIC = new Set([
  "lookout",
  "beach",
  "beaches",
  "mount",
  "point",
  "reserve",
  "ridge",
  "launch",
  "launches",
  "north",
  "south",
  "east",
  "west",
  "bluff",
  "head",
  "headland",
  "cliffs",
  "valley",
  "range",
  "creek",
  "field",
  "airstrip",
  "aerodrome",
  "airfield",
  "station",
  "track",
  "hills",
  "dunes",
  "paddock",
  "landing",
  "summit",
]);

/**
 * Ways a club might write a site's name: as published, without a bracketed note, the note itself,
 * each part of a name joined by " - " or a comma, and with or without "Mt"/"Mount". A single word
 * must be at least 6 letters and not a generic word like "Lookout".
 */
export function nameVariants(name: string): string[] {
  const base = name.replace(/\s*\([^)]*\)\s*$/, "").trim();
  const note = /\(([^)]*)\)\s*$/.exec(name)?.[1];
  const pieces = [name, base, ...(note ? [note] : []), ...base.split(/\s+[-–]\s+|,\s*/)];
  const out = new Set<string>();
  for (const piece of pieces) {
    const v = phrase(piece);
    if (!v) continue;
    out.add(v);
    // "Strzelecki Lookout" is often just "Strzelecki"; "Long Reef NE" (a launch) just "Long Reef".
    const words = v.split(" ");
    const last = words.at(-1) as string;
    if (words.length > 1 && (GENERIC.has(last) || COMPASS.has(last))) {
      out.add(words.slice(0, -1).join(" "));
    }
    if (/^(mt|mount) /.test(v)) {
      out.add(v.replace(/^mt /, "mount ").replace(/^mount /, "mt "));
      out.add(v.replace(/^(mt|mount) /, ""));
    }
  }
  return [...out].filter((v) =>
    v.includes(" ") ? v.length >= 5 : v.length >= 6 && !GENERIC.has(v),
  );
}

/** Text to search for site names in a list of menu entries, kept apart so names don't run together. */
export function menuText(names: string[]): string {
  return ` ${names.map(phrase).filter(Boolean).join(" | ")} `;
}

/** Whether a page's text names a site, as a whole phrase. */
export function mentions(text: string, siteName: string): boolean {
  return nameVariants(siteName).some((v) => text.includes(` ${v} `));
}
