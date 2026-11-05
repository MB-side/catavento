// One page per country (D93): the same eight sections everywhere, old addresses forwarding, and the
// country switcher.
import { readFileSync } from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

const overviewSites = JSON.parse(
  readFileSync(path.join(process.cwd(), "data", "generated", "overview-sites.json"), "utf8"),
) as { id: string; country: string }[];
const visiting = JSON.parse(
  readFileSync(path.join(process.cwd(), "data", "generated", "visiting.json"), "utf8"),
) as { help: { country: string }[]; tours: { destinations: string[] }[] };

const SECTIONS = [
  "Sites on the map",
  "Before you fly",
  "Local contacts",
  "Learn and fly with someone",
  "Flying tours here",
  "Gear",
  "Events and notices",
  "Weather and more sources",
];

for (const [code, coverage] of [
  ["au", "Full coverage"],
  ["nz", "Partial"],
  ["fr", "Overview"],
  ["np", "Overview"],
  ["ma", "Overview"],
  ["bt", "Overview"],
] as const) {
  test(`/${code}/ has the eight sections in order and says how much we cover`, async ({ page }) => {
    await page.goto(`${code}/`);
    const headings = page.getByTestId("country-page").locator("section > h2");
    const texts = (await headings.allInnerTexts()).map((h) => h.replace(/^\d+\s*/, ""));
    expect(texts.slice(0, 8)).toEqual(SECTIONS);
    await expect(page.getByTestId("coverage-badge").first()).toHaveText(coverage);
  });
}

test("France: a rules summary with its notice, help on the ground, tours and every site", async ({
  page,
}) => {
  await page.goto("fr/");
  await expect(page.getByRole("heading", { name: "Flying in France", level: 1 })).toBeVisible();
  await expect(page.getByTestId("visitor-rules").first()).toContainText("IPPI");
  await expect(page.getByTestId("rules-notice").first()).toContainText("FFVL");
  const help = visiting.help.filter((h) => h.country === "FR").length;
  await expect(page.getByTestId("visitor-help").locator("li.flex")).toHaveCount(help);
  const tours = visiting.tours.filter((t) => t.destinations.includes("FR")).length;
  await expect(page.getByTestId("tour-list").locator(":scope > li")).toHaveCount(tours);
  const list = page.getByTestId("overview-sites");
  await expect(list.locator(":scope > li")).toHaveCount(
    overviewSites.filter((s) => s.country === "FR").length,
  );
  const first = list.locator(":scope > li").first();
  await first.locator("summary").click();
  await first.getByRole("button", { name: "Show the next 3 days" }).click();
  await expect(first.locator("[data-outlook-slot] > *").first()).toBeVisible();
});

test("a country without gathered rules says so, and points to the brands' dealer lists for gear", async ({
  page,
}) => {
  await page.goto("ma/");
  await expect(page.locator("#rules")).toContainText(
    "We haven't gathered the rules for visitors here yet",
  );
  await expect(page.getByTestId("dealer-lists").getByRole("link").first()).toBeVisible();
});

test("a country page names its own national body, never another country's", async ({ page }) => {
  await page.goto("de/");
  await expect(page.locator("main")).not.toContainText("SAFA");
  await expect(page.locator("main")).toContainText("DHV");
});

test.describe("country pages without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the site list and the rules are there", async ({ page }) => {
    await page.goto("ch/");
    await expect(page.locator("main")).toContainText("SHV");
    expect(await page.getByTestId("overview-sites").locator(":scope > li").count()).toBeGreaterThan(
      100,
    );
  });
  test("old addresses still forward", async ({ page }) => {
    await page.goto("visiting/fr/");
    await expect(page).toHaveURL(/\/catavento\/fr\/$/);
  });
});

test("old addresses forward to the country pages and Destinations", async ({ page }) => {
  for (const [from, to] of [
    ["visiting/fr/", /\/catavento\/fr\/$/],
    ["world/europe/fr/", /\/catavento\/fr\/$/],
    ["world/nepal/", /\/catavento\/np\/$/],
    ["world/", /\/catavento\/visiting\/$/],
  ] as const) {
    await page.goto(from);
    await expect(page).toHaveURL(to);
  }
});

test("Europe's page links each country to its own page", async ({ page }) => {
  await page.goto("world/europe/");
  await page
    .getByTestId("world-countries")
    .getByRole("link", { name: /France/ })
    .click();
  await expect(page).toHaveURL(/\/catavento\/fr\/$/);
});

test("the country switcher goes to the chosen country, and the tabs follow it", async ({
  page,
}) => {
  await page.goto("au/");
  await page.getByTestId("country-switcher").selectOption("FR");
  await expect(page).toHaveURL(/\/catavento\/fr\/$/);
  await page.goto("about/");
  await expect(page.getByTestId("country-switcher")).toHaveValue("FR");
});

for (const p of ["visiting/", "world/europe/", "fr/", "np/", "ma/", "au/"]) {
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
