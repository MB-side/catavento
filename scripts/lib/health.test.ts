import { describe, expect, it } from "vitest";
import type { ProviderRun } from "@/lib/types";
import { checkHealth, healthReport, problemFingerprint, type HealthInput } from "./health";

const now = new Date("2026-10-13T00:00:00Z");
const run = (
  status: ProviderRun["status"],
  finishedAt: string,
  lastSuccessAt?: string,
): ProviderRun => ({
  status,
  startedAt: finishedAt,
  finishedAt,
  recordsFound: 1,
  recordsChanged: 0,
  warnings: [],
  ...(lastSuccessAt ? { lastSuccessAt } : {}),
});
const base: HealthInput = {
  now,
  providers: [
    { id: "daily", name: "Daily source", collect: { everyDays: 1 } },
    { id: "weekly", name: "Weekly source", collect: { everyDays: 7 } },
    { id: "paused", name: "Paused source", collect: { everyDays: 1, paused: true } },
    { id: "links-only", name: "Links only" },
  ],
  runs: {
    daily: run("warning", "2026-10-12T16:30:00Z", "2026-10-12T16:30:00Z"),
    weekly: run("unchanged", "2026-10-08T16:30:00Z", "2026-10-08T16:30:00Z"),
  },
  offerings: [
    {
      org: "School",
      title: "Tandem",
      url: "https://school.example/",
      sourceCheckedAt: "2026-10-08",
    },
  ],
  gearCategories: [{ org: "Shop", source: "https://shop.example/", checked: "2026-10-13" }],
  siteWind: [{ site: "site:au:nsw:x", source: "https://club.example/x", checked: "2026-10-13" }],
  links: { checkedAt: "2026-10-01T18:00:00Z", total: 600, broken: [] },
  workflows: [
    {
      name: "Ingest",
      conclusion: "success",
      url: "https://github.com/x/1",
      createdAt: "2026-10-12T16:30:00Z",
    },
  ],
};

describe("checkHealth", () => {
  it("is quiet when everything is on schedule, warnings included", () => {
    expect(checkHealth(base)).toEqual([]);
    expect(healthReport([], now)).toMatch(/^All clear/);
  });

  it("flags failed, blocked, overdue and never-run sources, but not paused or link-only ones", () => {
    const problems = checkHealth({
      ...base,
      providers: [...base.providers, { id: "new", name: "New source", collect: { everyDays: 3 } }],
      runs: {
        daily: run("failed", "2026-10-12T16:30:00Z", "2026-10-09T16:30:00Z"),
        weekly: run("blocked", "2026-10-12T16:30:00Z", "2026-10-08T16:30:00Z"),
      },
    });
    expect(problems.map((p) => p.key)).toEqual([
      "source-failed:daily",
      "source-overdue:daily",
      "source-blocked:weekly",
      "source-never:new",
    ]);
  });

  it("flags only each job's latest failed run", () => {
    const problems = checkHealth({
      ...base,
      workflows: [
        {
          name: "Deploy",
          conclusion: "failure",
          url: "https://github.com/x/3",
          createdAt: "2026-10-12T17:00:00Z",
        },
        {
          name: "Ingest",
          conclusion: "success",
          url: "https://github.com/x/2",
          createdAt: "2026-10-12T16:30:00Z",
        },
        {
          name: "Ingest",
          conclusion: "failure",
          url: "https://github.com/x/1",
          createdAt: "2026-10-11T16:30:00Z",
        },
      ],
    });
    expect(problems.map((p) => p.key)).toEqual(["workflow:Deploy"]);
  });

  it("lists broken links and notices when the link check has stopped", () => {
    const problems = checkHealth({
      ...base,
      links: {
        checkedAt: "2026-08-01T18:00:00Z",
        total: 600,
        broken: [
          { url: "https://gone.example/", page: "au/directory/x/index.html", error: "HTTP 404" },
        ],
      },
    });
    expect(problems.map((p) => p.key)).toEqual(["links-overdue", "link:https://gone.example/"]);
  });

  it("asks for hand-entered facts to be re-checked after their use-by date", () => {
    const problems = checkHealth({
      ...base,
      offerings: [
        {
          org: "School",
          title: "Tandem",
          url: "https://school.example/",
          sourceCheckedAt: "2026-03-01",
        },
      ],
      gearCategories: [{ org: "Shop", source: "https://shop.example/", checked: "2025-09-01" }],
      siteWind: [
        { site: "site:au:nsw:x", source: "https://club.example/x", checked: "2025-09-01" },
      ],
    });
    expect(problems.map((p) => p.kind)).toEqual(["stale", "stale", "stale"]);
    expect(healthReport(problems, now)).toContain("### Hand-entered facts to re-check");
  });

  it("fingerprints the set of problems, not their order", () => {
    const a = checkHealth({ ...base, runs: {} });
    expect(problemFingerprint(a)).toBe(problemFingerprint([...a].reverse()));
    expect(problemFingerprint(a)).not.toBe(problemFingerprint([]));
  });
});

describe("checkHealth: link noise", () => {
  const links = {
    checkedAt: "2026-10-12T18:00:00Z",
    total: 600,
    broken: [
      { url: "https://refuses.example/page", page: "a/index.html", error: "HTTP 403" },
      { url: "https://national.example/doc.php?id=1", page: "b/index.html", error: "HTTP 404" },
      { url: "https://gone.example/", page: "c/index.html", error: "HTTP 404" },
    ],
  };

  it("doesn't count links that refuse checkers, and honours exceptions until their review date", () => {
    const problems = checkHealth({
      ...base,
      links,
      linkExceptions: [
        { url: "https://national.example/doc.php", reason: "their listing", review: "2027-01-31" },
      ],
    });
    expect(problems.map((p) => p.key)).toEqual(["link:https://gone.example/"]);
  });

  it("lists an excepted link again once its review date has passed", () => {
    const problems = checkHealth({
      ...base,
      links,
      linkExceptions: [
        { url: "https://national.example/doc.php", reason: "their listing", review: "2026-10-01" },
      ],
    });
    expect(problems.map((p) => p.key)).toEqual([
      "link:https://national.example/doc.php?id=1",
      "link:https://gone.example/",
    ]);
  });
});
