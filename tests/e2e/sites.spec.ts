import { readFileSync } from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

interface SiteRecord {
  id: string;
  name: string;
  country: string;
  regionCode: string;
  slug: string;
  windRangeLabel: string;
  ratingText?: string;
  officialGuideUrl?: string;
  stationIds: string[];
  layer: string;
}

const sites = JSON.parse(
  readFileSync(path.join(process.cwd(), "data", "generated", "sites.json"), "utf8"),
) as SiteRecord[];
const pathOf = (s: SiteRecord) =>
  `${s.country.toLowerCase()}/sites/${s.regionCode.split("-")[1]?.toLowerCase()}/${s.slug}/`;
const byId = (id: string) => {
  const s = sites.find((x) => x.id === id);
  if (!s) throw new Error(`No site ${id}`);
  return s;
};

// docs/09 §4 anchor sites, by the names the Site Guide uses (Single Hill dropped: docs/10 C30).
const ANCHORS = [
  "site:au:nsw:long-reef-ne",
  "site:au:nsw:long-reef-se",
  "site:au:nsw:stanwell-park-bald-hill",
  "site:au:nsw:manilla-mt-borah",
  "site:au:vic:mystic",
  "site:au:nsw:spring-hill",
  "site:au:nsw:lake-george-gearys-gap",
  "site:au:vic:mt-emu",
  "site:au:qld:killarney",
  "site:au:nsw:crackneck-lookout",
  "site:au:sa:tunkalilla",
];

test.describe("anchor sites match the Site Guide (docs/09 §4)", () => {
  for (const id of ANCHORS) {
    test(id, async ({ page }) => {
      const site = byId(id);
      await page.goto(pathOf(site));
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(site.name);
      const official = page.getByRole("link", { name: "Official site details", exact: true });
      await expect(official).toHaveAttribute("href", site.officialGuideUrl ?? "");
      expect(site.officialGuideUrl).toMatch(/^https:\/\/siteguide\.org\.au\/Sites\/Details\//);
      if (site.windRangeLabel !== "See official details") {
        await expect(page.locator("#wind").locator("..")).toContainText(site.windRangeLabel);
      }
      if (site.ratingText) await expect(page.locator("main")).toContainText(site.ratingText);
      if (site.stationIds.length) {
        await expect(page.getByRole("link", { name: /Open live wind/ }).first()).toBeVisible();
      }
      await expect(page.getByTestId("steward-panel")).toBeVisible();
    });
  }
});

test.describe("S12: who is responsible, whatever kind of body it is", () => {
  test("Karioitahi Beach is operated by the flight park, with its pass note and club guide", async ({
    page,
  }) => {
    await page.goto("nz/sites/auk/karioitahi-beach/");
    const panel = page.getByTestId("steward-panel");
    await expect(panel).toContainText("Operated by");
    await expect(panel).toContainText("HighSide");
    await expect(panel).toContainText("Subscription pass required");
    await expect(panel).toContainText("Auckland club");
    await expect(
      page.getByRole("link", { name: "Official site details", exact: true }),
    ).toHaveAttribute("href", /cloudbase\.org\.nz/);
  });

  test("Port Hills is managed by the Canterbury club", async ({ page }) => {
    await page.goto("nz/sites/can/port-hills/");
    await expect(page.getByTestId("steward-panel")).toContainText("Managed by");
    await expect(page.getByTestId("steward-panel")).toContainText("Canterbury club");
  });

  test("Coronet Peak shows the steward-not-listed state with a way to report it", async ({
    page,
  }) => {
    await page.goto("nz/sites/ota/coronet-peak/");
    const panel = page.getByTestId("steward-panel");
    await expect(panel).toContainText("Steward not listed yet");
    await expect(
      panel.getByRole("link", { name: "Know who manages this site? Tell us" }),
    ).toHaveAttribute("href", /docs\.google\.com\/forms/);
  });

  test("New Zealand site pages use NZHGPA wording, never SAFA's", async ({ page }) => {
    for (const s of sites.filter((x) => x.country === "NZ")) {
      await page.goto(pathOf(s));
      await expect(page.locator("body")).not.toContainText("SAFA");
      await expect(page.getByTestId("steward-panel")).toContainText("NZHGPA");
    }
  });
});

test.describe("sites list", () => {
  test("lists every site and filters by name and wind", async ({ page }) => {
    const au = sites.filter((s) => s.country === "AU");
    await page.goto("au/sites/");
    await expect(page.getByTestId("site-count")).toHaveText(`${au.length} sites`);
    await page.getByLabel("Name", { exact: true }).fill("Long Reef");
    await expect(
      page.getByTestId("site-list").getByRole("link", { name: "Long Reef NE" }),
    ).toBeVisible();
    await page.getByLabel("Name", { exact: true }).fill("");
    await page.getByLabel("Takes a wind from").selectOption("NE");
    const count = Number((await page.getByTestId("site-count").innerText()).split(" ")[0]);
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(au.length);
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page.getByTestId("site-count")).toHaveText(`${au.length} sites`);
  });

  test("a region page lists only that region's sites", async ({ page }) => {
    const act = sites.filter((s) => s.regionCode === "AU-ACT");
    await page.goto("au/sites/act/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Australian Capital Territory",
    );
    await expect(page.getByTestId("site-count")).toHaveText(
      `${act.length} site${act.length === 1 ? "" : "s"}`,
    );
  });

  test("the map loads only on request, and the list still works if tiles fail", async ({
    page,
  }) => {
    await page.route("**/tiles.openfreemap.org/**", (route) => route.abort());
    await page.goto("au/sites/");
    await expect(page.getByTestId("sites-map")).toHaveCount(0);
    await page.getByRole("button", { name: "Show map" }).click();
    await expect(
      page.getByText(/The map couldn't load|Loading the map/).or(page.getByTestId("sites-map")),
    ).toBeVisible();
    await expect(page.getByTestId("site-list")).toBeVisible();
  });

  test("community sites are labelled", async ({ page }) => {
    const community = sites.find((s) => s.layer === "pge" && s.country === "AU");
    test.skip(!community, "no community sites in the data");
    await page.goto(pathOf(community as SiteRecord));
    await expect(page.locator("main")).toContainText("Community data");
  });
});

test("site pages carry a share image and JSON-LD", async ({ page }) => {
  await page.goto("au/sites/nsw/stanwell-park-bald-hill/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /\/og\/sites\/au\/nsw\/stanwell-park-bald-hill\.png$/,
  );
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(ld.some((x) => x.includes('"SportsActivityLocation"'))).toBe(true);
  const image = await page.request.get("og/sites/au/nsw/stanwell-park-bald-hill.png");
  expect(image.headers()["content-type"]).toBe("image/png");
});

for (const p of [
  "au/sites/",
  "au/sites/act/",
  "au/sites/nsw/stanwell-park-bald-hill/",
  "nz/sites/ota/coronet-peak/",
]) {
  test(`no serious accessibility problems on /${p}`, async ({ page }) => {
    await page.goto(p);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
}
