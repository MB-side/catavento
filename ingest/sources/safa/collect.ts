// SAFA (green tier): club and school directories, each club's SAFA page (website and association
// only), upcoming events from its public events feed, and the titles of its defect and safety
// notices. Weekly. Never collects committee members' names or details (D53).
import type { CollectedOrg, EventItem, Notice, SourceRef } from "@/lib/types";
import { slugify } from "@/scripts/lib/data/ids";
import { sha256 } from "../../core/fetcher";
import type { CountryScope, ProviderModule } from "../../core/runner";
import {
  SAFA_BASE,
  decodeEntities,
  eventType,
  localIso,
  parseClubDetail,
  parseDefectNotices,
  parseDirectory,
  type DirectoryCard,
  type SafaEvent,
  type SafaEventsPage,
} from "./parse";

export const SAFA_PAGES = {
  clubs: `${SAFA_BASE}/local-clubs/`,
  schools: `${SAFA_BASE}/learn-to-fly/flight-schools/`,
  resources: `${SAFA_BASE}/pilot-tools/resources/`,
  events: `${SAFA_BASE}/wp-json/tribe/events/v1/events`,
} as const;

const DAY = 86_400_000;
const MAX_EVENT_PAGES = 5;

const ymd = (d: Date) => d.toISOString().slice(0, 10);

function regionOf(state: string | undefined, country: CountryScope): string | undefined {
  const code = state ? `${country.code}-${state}` : undefined;
  return code && country.regions.has(code) ? code : undefined;
}

/** Records without fetch times, so an unchanged week gives the same fingerprint. */
interface Unstamped {
  orgs: CollectedOrg[];
  events: EventItem[];
  notices: Notice[];
}

function stamp(records: Unstamped, fetchedAt: string, contentHash: string): Unstamped {
  const s = (ref: SourceRef): SourceRef => ({ ...ref, fetchedAt, contentHash });
  return {
    orgs: records.orgs.map((o) => ({ ...o, source: s(o.source) })),
    events: records.events.map((e) => ({ ...e, sources: e.sources.map(s) })),
    notices: records.notices.map((n) => ({ ...n, sources: n.sources.map(s) })),
  };
}

const ROLE_WORDS = new Set([
  "admin",
  "bookings",
  "chair",
  "club",
  "committee",
  "contact",
  "enquiries",
  "enquiry",
  "exec",
  "executive",
  "fly",
  "flying",
  "hello",
  "info",
  "learn",
  "members",
  "membership",
  "office",
  "president",
  "safety",
  "secretary",
  "treasurer",
  "web",
  "webmaster",
]);

/**
 * A club's email is kept only if it is a role address ("secretary@…", "info@…") or on the club's
 * own website domain. SAFA sometimes lists a volunteer's personal address for a club; that is
 * not copied (D53). Schools are businesses, so their published contact is kept.
 */
export function clubEmail(
  email: string | undefined,
  website: string | undefined,
): string | undefined {
  if (!email) return undefined;
  const [local = "", domain = ""] = email.toLowerCase().split("@");
  if (local.split(/[._+-]/).some((part) => ROLE_WORDS.has(part))) return email;
  const host = website ? new URL(website).hostname.toLowerCase().replace(/^www\./, "") : undefined;
  if (host && (domain === host || domain.endsWith(`.${host}`) || host.endsWith(`.${domain}`)))
    return email;
  return undefined;
}

export function toCollectedOrg(
  card: DirectoryCard,
  kind: "club" | "school",
  country: CountryScope,
  extra: { website?: string; email?: string; association?: string; url: string },
): CollectedOrg {
  const ref =
    kind === "club" ? (card.detailPath?.split("id=")[1] ?? slugify(card.name)) : slugify(card.name);
  return {
    id: `safa:${kind}:${ref}`,
    providerId: "safa",
    kind,
    name: card.name,
    country: country.code,
    regionCode: regionOf(card.state, country),
    website: extra.website ?? card.website,
    emailPublic:
      kind === "school"
        ? (card.email ?? extra.email)
        : clubEmail(card.email ?? extra.email, extra.website),
    phonePublic: kind === "school" ? card.phone : undefined,
    disciplines: card.disciplines,
    associationName: extra.association,
    externalId: kind === "club" ? card.detailPath?.split("id=")[1] : undefined,
    source: { providerId: "safa", url: extra.url, fetchedAt: "", licence: "facts" },
  };
}

/** Maps an event from The Events Calendar's public JSON (used by SAFA and many club websites). */
export function toEvent(
  e: SafaEvent,
  country: CountryScope,
  from: { providerId: string; idPrefix: string } = { providerId: "safa", idPrefix: "safa" },
): EventItem {
  const categories = (e.categories ?? []).map((c) => c.name);
  const venue = Array.isArray(e.venue) ? undefined : e.venue;
  const state = (venue?.stateprovince ?? venue?.province ?? "").toUpperCase();
  const fromCategory = categories.map((c) => c.toUpperCase()).find((c) => regionOf(c, country));
  const title = decodeEntities(e.title);
  const startDate = e.all_day
    ? e.start_date.slice(0, 10)
    : localIso(e.start_date, e.utc_start_date);
  const endDay = e.end_date?.slice(0, 10);
  const location = [venue?.venue, venue?.city]
    .filter(Boolean)
    .map((x) => decodeEntities(x as string));
  return {
    id: `event:${from.idPrefix}:${e.id}`,
    title,
    startDate,
    endDate: e.all_day && endDay && endDay !== startDate ? endDay : undefined,
    type: eventType(title, categories),
    disciplines: [],
    locationText: [...new Set(location)].join(", ") || undefined,
    country: country.code,
    regionCode: regionOf(state, country) ?? regionOf(fromCategory, country),
    organiserName: e.organizer?.[0]?.organizer
      ? decodeEntities(e.organizer[0].organizer)
      : undefined,
    url: e.url,
    sources: [{ providerId: from.providerId, url: e.url, fetchedAt: "", licence: "facts" }],
  };
}

export const safa: ProviderModule = {
  id: "safa",
  async collect(ctx) {
    const country = ctx.countries[0];
    if (ctx.countries.length !== 1 || !country) throw new Error("SAFA covers one country");
    const warnings: string[] = [];
    let invalid = 0;

    // Clubs: the directory, then each club's own SAFA page for its website and association.
    const clubCards = parseDirectory((await ctx.fetcher.get(SAFA_PAGES.clubs)).body);
    const orgs: CollectedOrg[] = [];
    for (const card of clubCards) {
      const url = card.detailPath
        ? new URL(card.detailPath, SAFA_BASE).toString()
        : SAFA_PAGES.clubs;
      let detail;
      if (card.detailPath) {
        try {
          detail = parseClubDetail((await ctx.fetcher.get(url)).body);
        } catch (error) {
          warnings.push(
            `${card.name}: club page not read (${error instanceof Error ? error.message : String(error)})`,
          );
        }
      }
      orgs.push(toCollectedOrg(card, "club", country, { ...detail, url }));
    }

    const schoolCards = parseDirectory((await ctx.fetcher.get(SAFA_PAGES.schools)).body);
    for (const card of schoolCards) {
      orgs.push(toCollectedOrg(card, "school", country, { url: SAFA_PAGES.schools }));
    }
    for (const o of orgs) {
      if (!o.regionCode) warnings.push(`${o.name}: no state found in SAFA's address`);
    }

    // Events from 30 days ago to six months ahead.
    const events: EventItem[] = [];
    const from = ymd(new Date(ctx.now.getTime() - 30 * DAY));
    const to = ymd(new Date(ctx.now.getTime() + 183 * DAY));
    let next: string | undefined =
      `${SAFA_PAGES.events}?per_page=50&start_date=${from}&end_date=${to}`;
    for (let page = 0; next && page < MAX_EVENT_PAGES; page++) {
      const body = JSON.parse((await ctx.fetcher.get(next)).body) as SafaEventsPage;
      for (const e of body.events ?? []) {
        try {
          events.push(toEvent(e, country));
        } catch {
          invalid++;
          warnings.push(`Event ${e.id}: not readable`);
        }
      }
      next = body.next_rest_url;
    }

    // Defect reports and safety notices: titles, dates and links only.
    const { notices: parsed, undated } = parseDefectNotices(
      (await ctx.fetcher.get(SAFA_PAGES.resources)).body,
    );
    for (const title of undated) warnings.push(`Notice "${title}": no date in its title; skipped`);
    const notices: Notice[] = parsed.map((n) => ({
      id: `notice:safa:${sha256(n.url).slice(0, 12)}`,
      title: n.title,
      date: n.date,
      url: n.url,
      country: country.code,
      scope: "national",
      sources: [{ providerId: "safa", url: SAFA_PAGES.resources, fetchedAt: "", licence: "facts" }],
    }));

    const unstamped = { orgs, events, notices };
    const contentHash = sha256(JSON.stringify(unstamped));
    if (!ctx.force && contentHash === ctx.previous?.contentHash) {
      return { unchanged: true, contentHash, records: {}, invalid: 0, warnings: [] };
    }
    const records = stamp(unstamped, ctx.now.toISOString(), contentHash);
    return { unchanged: false, contentHash, records, invalid, warnings };
  },
};
