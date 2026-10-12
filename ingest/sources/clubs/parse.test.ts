import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { Organisation } from "@/lib/types";
import { clubsToRead } from "./collect";
import {
  discover,
  icsDate,
  mentions,
  menuText,
  nameVariants,
  pageText,
  parseFeed,
  parseIcs,
} from "./parse";

const fixture = (name: string) => readFileSync(path.join(__dirname, "fixtures", name), "utf8");

describe("discover", () => {
  const found = discover(fixture("home.html"), "https://www.exampleclub.org.au/");

  it("finds the main news feed but not the comments feed", () => {
    expect(found.feeds).toEqual(["https://www.exampleclub.org.au/feed/"]);
  });

  it("finds a calendar, turning webcal: into https:", () => {
    expect(found.calendars).toEqual(["https://www.exampleclub.org.au/events/?ical=1"]);
  });

  it("finds the club's own sites page, not other hosts, maps or members' areas", () => {
    expect(found.sitesPages).toEqual(["https://www.exampleclub.org.au/flying-sites/"]);
  });

  it("reads the entries under a Sites drop-down menu", () => {
    expect(found.menuNames).toEqual(["Beechmont", "Tamborine", "Hinchies"]);
    const menu = menuText(found.menuNames);
    expect(mentions(menu, "Beechmont - Rosin's Lookout")).toBe(true);
    expect(mentions(menu, "Mt. Tamborine")).toBe(true);
    expect(mentions(menu, "Hinchcliffe's (Hart's, Flattop)")).toBe(false); // a nickname is not a match
  });

  it("notices The Events Calendar on WordPress", () => {
    expect(found.eventsApi).toBe("https://www.exampleclub.org.au/wp-json/tribe/events/v1/events");
  });
});

describe("parseFeed", () => {
  it("takes each item's title, date and link, never its text", () => {
    const items = parseFeed(fixture("feed.xml"));
    expect(items).toEqual([
      {
        title: "Working bee at Mount Example & AGM notice",
        date: "2026-10-09",
        url: "https://www.exampleclub.org.au/2026/10/working-bee/",
      },
      { title: "Old news", date: "2025-01-06", url: "https://www.exampleclub.org.au/2025/01/old/" },
    ]);
    expect(JSON.stringify(items)).not.toContain("must not be copied");
  });

  it("reads Atom feeds too", () => {
    const atom = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Site closed</title>
      <link rel="alternate" href="https://club.example/closed"/><updated>2026-10-01T00:00:00Z</updated></entry></feed>`;
    expect(parseFeed(atom)).toEqual([
      { title: "Site closed", date: "2026-10-01", url: "https://club.example/closed" },
    ]);
  });
});

describe("parseIcs", () => {
  const events = parseIcs(fixture("cal.ics"), "Australia/Sydney");

  it("reads all-day events with iCal's exclusive end date", () => {
    expect(events[0]).toEqual({
      uid: "1@exampleclub",
      title: "Spring fly-in",
      start: "2026-11-21",
      end: "2026-11-22",
      location: "Mount Example, NSW",
      url: "https://www.exampleclub.org.au/event/fly-in/",
    });
  });

  it("keeps local times with their offset, and unfolds long lines", () => {
    expect(events[1]).toMatchObject({
      title: "Club meeting and AGM",
      start: "2026-11-05T19:30:00+11:00",
    });
    expect(events[2]?.start).toBe("2026-07-01T09:00:00Z");
    expect(JSON.stringify(events)).not.toContain("must not be copied");
  });

  it("converts times written without a zone using the country's zone", () => {
    expect(icsDate("20260615T100000", undefined, "Australia/Perth")).toBe(
      "2026-06-15T10:00:00+08:00",
    );
    expect(icsDate("20260615T100000", "Not/AZone", "Australia/Sydney")).toBe(
      "2026-06-15T10:00:00+10:00",
    );
    expect(icsDate("nonsense", undefined, "UTC")).toBeUndefined();
  });
});

describe("site names on a club's sites page", () => {
  const text = pageText(fixture("sites.html"));

  it("matches whole names in the page body, Mt or Mount", () => {
    expect(mentions(text, "Mt Example")).toBe(true);
    expect(mentions(text, "Stanwell Park (Bald Hill)")).toBe(true);
    expect(mentions(text, "Lanyon")).toBe(false); // only in the header
    expect(mentions(text, "Stanwell Parkside")).toBe(false); // whole words only
    expect(mentions(text, "Bald Bluff")).toBe(true); // a mention is a mention: the Site Guide must agree too
  });

  it("ignores names too short or common to count", () => {
    expect(nameVariants("Hill")).toEqual([]);
    expect(nameVariants("Strzelecki lookout")).toEqual(["strzelecki lookout", "strzelecki"]);
    expect(nameVariants("Hunter - Lookout")).toEqual(["hunter lookout", "hunter"]);
    expect(nameVariants("Long Reef NE")).toEqual(["long reef ne", "long reef"]);
    expect(mentions(text, "The Hill")).toBe(true);
  });
});

describe("clubsToRead", () => {
  const org = (id: string, kind: Organisation["kind"], website?: string): Organisation => ({
    id,
    slug: id,
    kind,
    name: id,
    disciplines: [],
    country: "AU",
    website,
    sources: [],
    lastVerified: "2026-10-12",
    verificationStatus: "listed_by_national_body",
  });

  it("reads clubs and associations with websites, never Facebook, and honours opt-outs", () => {
    const chosen = clubsToRead(
      [
        org("a", "club", "https://a.example"),
        org("b", "regional_association", "https://b.example"),
        org("c", "club", "https://www.facebook.com/groups/c"),
        org("d", "club"),
        org("e", "school", "https://e.example"),
        org("f", "club", "https://f.example"),
      ],
      new Set(["f"]),
    );
    expect(chosen.map((o) => o.id)).toEqual(["a", "b"]);
  });
});
