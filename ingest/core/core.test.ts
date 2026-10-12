import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { strToU8, zipSync } from "fflate";
import { afterEach, describe, expect, it } from "vitest";
import type { Provider, ProviderRun, Site } from "@/lib/types";
import { kmlText } from "../sources/ansg/collect";
import { PoliteFetcher, RobotsDisallowedError, USER_AGENT } from "./fetcher";
import { changeGuard } from "./guard";
import type { RegionLookup } from "./regions";
import { isDue, runIngest, type ProviderModule } from "./runner";

describe("changeGuard", () => {
  it("accepts a first run with a note, and normal changes quietly", () => {
    expect(
      changeGuard({ previousCount: undefined, validCount: 10, invalidCount: 0 }).decision,
    ).toBe("accepted_first_run");
    expect(changeGuard({ previousCount: 100, validCount: 85, invalidCount: 0 })).toEqual({
      decision: "accepted",
    });
  });

  it("blocks a drop of more than 20%, more than 10% invalid, or nothing at all", () => {
    expect(changeGuard({ previousCount: 100, validCount: 79, invalidCount: 0 }).decision).toBe(
      "blocked_drop",
    );
    expect(changeGuard({ previousCount: 100, validCount: 89, invalidCount: 11 }).decision).toBe(
      "blocked_invalid",
    );
    expect(changeGuard({ previousCount: 100, validCount: 0, invalidCount: 0 }).decision).toBe(
      "blocked_drop",
    );
  });

  it("lets events and notices come and go, checking only their validity", () => {
    // No stable records before or now, and no events this week: fine.
    expect(
      changeGuard({ previousCount: 0, validCount: 0, invalidCount: 0, totalValid: 0 }),
    ).toEqual({
      decision: "accepted",
    });
    // Directory steady, events dropped from 30 to 2: fine.
    expect(
      changeGuard({ previousCount: 40, validCount: 40, invalidCount: 0, totalValid: 42 }).decision,
    ).toBe("accepted");
    // But unreadable records count against every kind.
    expect(
      changeGuard({ previousCount: 40, validCount: 40, invalidCount: 6, totalValid: 42 }).decision,
    ).toBe("blocked_invalid");
  });
});

/** A fake web: maps URLs to responses and records the request headers. */
function fakeFetch(pages: Record<string, { status: number; body: string }>) {
  const seen: { url: string; ua: string | null }[] = [];
  const impl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    seen.push({ url, ua: new Headers(init?.headers).get("User-Agent") });
    const page = pages[url] ?? { status: 404, body: "" };
    return new Response(page.body, { status: page.status });
  }) as typeof fetch;
  return { impl, seen };
}

describe("PoliteFetcher", () => {
  it("reads robots.txt first, identifies itself and refuses disallowed paths", async () => {
    const { impl, seen } = fakeFetch({
      "https://example.org/robots.txt": { status: 200, body: "User-agent: *\nDisallow: /private/" },
      "https://example.org/open.kml": { status: 200, body: "<kml/>" },
    });
    const f = new PoliteFetcher(impl, async () => {}, 0);
    const res = await f.get("https://example.org/open.kml");
    expect(res.body).toBe("<kml/>");
    expect(res.contentHash).toMatch(/^[0-9a-f]{64}$/);
    await expect(f.get("https://example.org/private/x")).rejects.toBeInstanceOf(
      RobotsDisallowedError,
    );
    expect(seen.map((s) => s.url)).toEqual([
      "https://example.org/robots.txt",
      "https://example.org/open.kml",
    ]);
    expect(seen.every((s) => s.ua === USER_AGENT)).toBe(true);
  });

  it("obeys rules written for CataventoBot by name", async () => {
    const { impl } = fakeFetch({
      "https://example.org/robots.txt": {
        status: 200,
        body: "User-agent: CataventoBot\nDisallow: /",
      },
    });
    const f = new PoliteFetcher(impl, async () => {}, 0);
    await expect(f.get("https://example.org/a")).rejects.toBeInstanceOf(RobotsDisallowedError);
  });

  it("stays away when robots.txt gives a server error, but treats a missing one as allowed", async () => {
    const down = fakeFetch({ "https://down.example/robots.txt": { status: 503, body: "" } });
    await expect(
      new PoliteFetcher(down.impl, async () => {}, 0).get("https://down.example/a"),
    ).rejects.toBeInstanceOf(RobotsDisallowedError);
    const none = fakeFetch({ "https://none.example/a": { status: 200, body: "ok" } });
    expect(
      (await new PoliteFetcher(none.impl, async () => {}, 0).get("https://none.example/a")).body,
    ).toBe("ok");
  });

  it("waits about 3 seconds between requests to the same website", async () => {
    const waits: number[] = [];
    const { impl } = fakeFetch({ "https://example.org/a": { status: 200, body: "a" } });
    const f = new PoliteFetcher(impl, async (ms) => void waits.push(ms));
    await f.get("https://example.org/a");
    // robots.txt then the file: the second request waited nearly the full interval.
    expect(waits.length).toBe(1);
    expect(waits[0]).toBeGreaterThan(2900);
  });

  it("gives up on a missing page without retrying", async () => {
    const { impl, seen } = fakeFetch({});
    await expect(
      new PoliteFetcher(impl, async () => {}, 0).get("https://example.org/gone"),
    ).rejects.toThrow("HTTP 404");
    expect(seen.filter((s) => s.url.endsWith("/gone"))).toHaveLength(1);
  });
});

describe("kmlText", () => {
  it("unzips a zipped Google Earth file, and passes plain KML through", () => {
    const kml = '<?xml version="1.0"?><kml><Document/></kml>';
    expect(kmlText({ bytes: zipSync({ "doc.kml": strToU8(kml) }) })).toBe(kml);
    expect(kmlText({ bytes: strToU8(kml) })).toBe(kml);
    expect(() => kmlText({ bytes: zipSync({ "readme.txt": strToU8("x") }) })).toThrow("no .kml");
  });
});

const provider = (collect: Provider["collect"]): Provider =>
  ({ id: "test", name: "Test", enabled: true, countries: ["AU"], collect }) as Provider;

describe("isDue", () => {
  const now = new Date("2026-10-20T00:00:00Z");
  const ran = (iso: string) => ({ lastSuccessAt: iso }) as ProviderRun;
  it("runs when never run and when the interval has passed (with 6 hours' slack)", () => {
    expect(isDue(provider({ everyDays: 7 }), undefined, now)).toBe(true);
    expect(isDue(provider({ everyDays: 7 }), ran("2026-10-13T05:00:00Z"), now)).toBe(true);
    expect(isDue(provider({ everyDays: 7 }), ran("2026-10-14T00:00:00Z"), now)).toBe(false);
  });
  it("never runs a paused provider or one without a schedule", () => {
    expect(isDue(provider({ everyDays: 7, paused: true }), undefined, now)).toBe(false);
    expect(isDue(provider(undefined), undefined, now)).toBe(false);
  });
});

function site(n: number): Site {
  return {
    id: `site:au:act:s${n}`,
    slug: `s${n}`,
    name: `Site ${n}`,
    country: "AU",
    regionCode: "AU-ACT",
    windRanges: [],
    windRangeLabel: "See official details",
    status: "open",
    stewardRole: "unknown",
    launches: [
      {
        id: `site:au:act:s${n}:launch:1`,
        name: "Launch",
        lat: -35.4,
        lon: 149.1,
        precision: "exact",
      },
    ],
    stationIds: [],
    disciplines: ["PG"],
    layer: "ansg",
    sources: [
      {
        providerId: "test",
        url: "https://example.org/",
        fetchedAt: "2026-10-12T00:00:00.000Z",
        licence: "facts",
      },
    ],
  };
}

describe("runIngest", () => {
  let root: string;
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it("keeps the last good copy when the change guard blocks an update", async () => {
    root = mkdtempSync(path.join(os.tmpdir(), "catavento-ingest-"));
    let count = 10;
    const mod: ProviderModule = {
      id: "test",
      collect: async () => ({
        unchanged: false,
        contentHash: `h${count}`,
        records: { sites: Array.from({ length: count }, (_, i) => site(i)) },
        invalid: 0,
        warnings: [],
      }),
    };
    const opts = {
      root,
      providers: [provider({ everyDays: 7 })],
      modules: [mod],
      regions: {} as RegionLookup,
      countriesRegions: new Map([["AU", new Set(["AU-ACT"])]]),
      fetcher: new PoliteFetcher(fakeFetch({}).impl, async () => {}, 0),
      force: true,
      log: () => {},
    };
    const first = await runIngest(opts);
    expect(first.test).toMatchObject({
      status: "warning",
      recordsFound: 10,
      guardDecision: "accepted_first_run",
    });

    count = 5;
    const second = await runIngest(opts);
    expect(second.test).toMatchObject({
      status: "blocked",
      guardDecision: "blocked_drop",
      contentHash: "h10",
    });
    const kept = JSON.parse(readFileSync(path.join(root, "data/ingest/test.json"), "utf8")) as {
      sites: Site[];
    };
    expect(kept.sites).toHaveLength(10);
  });

  it("records a failure without touching the last good copy", async () => {
    root = mkdtempSync(path.join(os.tmpdir(), "catavento-ingest-"));
    const mod: ProviderModule = {
      id: "test",
      collect: async () => {
        throw new Error("network down");
      },
    };
    const runs = await runIngest({
      root,
      providers: [provider({ everyDays: 7 })],
      modules: [mod],
      regions: {} as RegionLookup,
      countriesRegions: new Map(),
      force: true,
      log: () => {},
    });
    expect(runs.test).toMatchObject({ status: "failed", warnings: ["network down"] });
  });
});
