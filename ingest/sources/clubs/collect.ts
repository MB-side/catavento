// Club websites (amber tier): for each club or association with a website, read its home page to
// find a news feed, an events calendar and a "sites" page; take headlines, dates and links; and
// record which sites its own sites page names (D47's second source). About twice a week.
// Facebook and other red-tier hosts are never visited; a club can opt out via robots.txt, by
// asking us, or through data/manual/club-websites.yaml.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import type { EventItem, Notice, Organisation, SourceRef, StewardEvidence } from "@/lib/types";
import { sha256 } from "../../core/fetcher";
import type { CountryScope, ProviderModule } from "../../core/runner";
import { eventType } from "../safa/parse";
import { toEvent } from "../safa/collect";
import type { SafaEventsPage } from "../safa/parse";
import { discover, mentions, menuText, pageText, parseFeed, parseIcs } from "./parse";

const PROVIDER = "club-websites";
const DAY = 86_400_000;
const NOTICE_DAYS = 180;
const MAX_NOTICES = 10;
const RED_HOSTS =
  /(^|\.)(facebook\.com|fb\.com|instagram\.com|holfuy\.com|skysight\.io|paraglidingmap\.com)$/i;

const settingsSchema = z.object({ skip: z.array(z.string()).default([]) }).nullable();

/** Organisations a club website opted out for, from data/manual/club-websites.yaml. */
export function readSkipList(root = process.cwd()): Set<string> {
  const file = path.join(root, "data", "manual", "club-websites.yaml");
  if (!existsSync(file)) return new Set();
  return new Set(settingsSchema.parse(parseYaml(readFileSync(file, "utf8")))?.skip ?? []);
}

/** Clubs and associations whose website we may read. */
export function clubsToRead(orgs: Organisation[], skip: ReadonlySet<string>): Organisation[] {
  return orgs.filter((o) => {
    if (o.kind !== "club" && o.kind !== "regional_association") return false;
    if (o.hidden || !o.website || skip.has(o.id) || (o.legacyId && skip.has(o.legacyId)))
      return false;
    try {
      return !RED_HOSTS.test(new URL(o.website).hostname);
    } catch {
      return false;
    }
  });
}

const ref = (url: string): SourceRef => ({
  providerId: PROVIDER,
  url,
  fetchedAt: "",
  licence: "facts",
});

export const clubWebsites: ProviderModule = {
  id: PROVIDER,
  async collect(ctx) {
    const { organisations, sites } = ctx.directory();
    const clubs = clubsToRead(organisations, readSkipList());
    const scopes = new Map(ctx.countries.map((c) => [c.code, c]));
    const now = ctx.now.getTime();
    const notices: Notice[] = [];
    const events: EventItem[] = [];
    const stewardEvidence: StewardEvidence[] = [];
    const warnings: string[] = [];
    const read: string[] = [];

    for (const org of clubs) {
      const country: CountryScope | undefined = scopes.get(org.country);
      if (!country) continue;
      let home;
      try {
        home = await ctx.fetcher.get(org.website as string);
      } catch (error) {
        warnings.push(
          `${org.name}: website not read (${error instanceof Error ? error.message : String(error)})`,
        );
        continue;
      }
      const found = discover(home.body, home.url);
      const got: string[] = [];

      for (const feedUrl of found.feeds) {
        try {
          const items = parseFeed((await ctx.fetcher.get(feedUrl)).body)
            .filter(
              (i) =>
                Date.parse(i.date) >= now - NOTICE_DAYS * DAY && Date.parse(i.date) <= now + DAY,
            )
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, MAX_NOTICES);
          for (const i of items) {
            notices.push({
              id: `notice:club:${sha256(i.url).slice(0, 12)}`,
              title: i.title,
              date: i.date,
              url: i.url,
              country: org.country,
              scope: "club",
              orgId: org.id,
              sources: [ref(feedUrl)],
            });
          }
          if (items.length) got.push(`${items.length} news`);
        } catch (error) {
          warnings.push(
            `${org.name}: news feed not read (${error instanceof Error ? error.message : String(error)})`,
          );
        }
      }

      const inWindow = (iso: string) => {
        const t = Date.parse(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
        return t >= now - 30 * DAY && t <= now + 183 * DAY;
      };
      for (const calUrl of found.calendars) {
        try {
          const list = parseIcs(
            (await ctx.fetcher.get(calUrl)).body,
            country.timezone ?? "UTC",
          ).filter((e) => inWindow(e.start));
          for (const e of list) {
            events.push({
              id: `event:club:${sha256(`${org.id}|${e.uid}`).slice(0, 12)}`,
              title: e.title,
              startDate: e.start,
              endDate: e.end,
              type: eventType(e.title, []),
              disciplines: [],
              locationText: e.location,
              country: org.country,
              regionCode: org.regionCode,
              organiserOrgId: org.id,
              organiserName: org.name,
              url: e.url ?? home.url,
              sources: [ref(calUrl)],
            });
          }
          if (list.length) got.push(`${list.length} events`);
        } catch (error) {
          warnings.push(
            `${org.name}: calendar not read (${error instanceof Error ? error.message : String(error)})`,
          );
        }
      }
      if (found.eventsApi && found.calendars.length === 0) {
        try {
          const from = new Date(now - 30 * DAY).toISOString().slice(0, 10);
          const page = JSON.parse(
            (await ctx.fetcher.get(`${found.eventsApi}?per_page=50&start_date=${from}`)).body,
          ) as SafaEventsPage;
          const list = (page.events ?? []).map((e) => ({
            ...toEvent(e, country, { providerId: PROVIDER, idPrefix: `club-${org.slug}` }),
            organiserOrgId: org.id,
            organiserName: org.name,
          }));
          events.push(...list.filter((e) => inWindow(e.startDate)));
          if (list.length) got.push(`${list.length} events`);
        } catch {
          // Many WordPress sites have the plugin's styles but no public events feed.
        }
      }

      // The club's own sites page naming a site the Site Guide lists it for: two sources agree.
      const listed = sites.filter((s) => s.listedContact?.orgId === org.id);
      const named = new Set<string>();
      const menu = menuText(found.menuNames);
      const fromMenu = listed.filter((s) => mentions(menu, s.name)).map((s) => s.id);
      if (fromMenu.length) {
        fromMenu.forEach((id) => named.add(id));
        stewardEvidence.push({
          id: `evidence:${org.id}:menu`,
          orgId: org.id,
          url: home.url,
          siteIds: fromMenu.sort(),
          source: ref(home.url),
        });
      }
      for (const pageUrl of found.sitesPages) {
        if (named.size === listed.length) break;
        try {
          const text = pageText((await ctx.fetcher.get(pageUrl)).body);
          const siteIds = listed
            .filter((s) => !named.has(s.id) && mentions(text, s.name))
            .map((s) => s.id)
            .sort();
          if (siteIds.length) {
            siteIds.forEach((id) => named.add(id));
            stewardEvidence.push({
              id: `evidence:${org.id}:${sha256(pageUrl).slice(0, 8)}`,
              orgId: org.id,
              url: pageUrl,
              siteIds,
              source: ref(pageUrl),
            });
          }
        } catch (error) {
          warnings.push(
            `${org.name}: sites page not read (${error instanceof Error ? error.message : String(error)})`,
          );
        }
      }
      if (named.size)
        got.push(`its website names ${named.size} of the ${listed.length} sites listed for it`);
      read.push(`${org.name}: ${got.length ? got.join(", ") : "nothing to collect"}`);
    }

    const unstamped = { notices, events, stewardEvidence };
    const contentHash = sha256(JSON.stringify(unstamped));
    if (!ctx.force && contentHash === ctx.previous?.contentHash) {
      return { unchanged: true, contentHash, records: {}, invalid: 0, warnings: [] };
    }
    const fetchedAt = ctx.now.toISOString();
    const s = (r: SourceRef): SourceRef => ({ ...r, fetchedAt, contentHash });
    return {
      unchanged: false,
      contentHash,
      records: {
        notices: notices.map((n) => ({ ...n, sources: n.sources.map(s) })),
        events: events.map((e) => ({ ...e, sources: e.sources.map(s) })),
        stewardEvidence: stewardEvidence.map((e) => ({ ...e, source: s(e.source) })),
      },
      invalid: 0,
      warnings,
      info: read, // what each club's website gave, shown on /status
    };
  },
};
