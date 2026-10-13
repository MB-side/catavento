import { readFileSync } from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

// Overview regions (D83): Europe with a page per country, and single-country destinations.
const overviewSites = JSON.parse(
  readFileSync(path.join(process.cwd(), "data", "generated", "overview-sites.json"), "utf8"),
) as { id: string; name: string; country: string }[];

test("Flying elsewhere lists Europe and the destinations, and the home page links to it", async ({
  page,
}) => {
  await page.goto("world/");
  const regions = page.getByTestId("world-regions");
  await expect(regions.getByRole("link", { name: /Europe/ })).toBeVisible();
  await expect(regions.getByRole("link", { name: /Nepal/ })).toBeVisible();
  await page.goto("");
  await expect(
    page.getByTestId("home-elsewhere").getByRole("link", { name: "Europe" }),
  ).toBeVisible();
});

test("Europe shows the region guide and links to each country", async ({ page }) => {
  await page.goto("world/europe/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Europe");
  await expect(page.getByTestId("overview-guide")).toContainText("IPPI");
  await page
    .getByTestId("world-countries")
    .getByRole("link", { name: /France/ })
    .click();
  await expect(page).toHaveURL(/world\/europe\/fr\/$/);
});

test("a country page has its guide, sites and an outlook on request", async ({ page }) => {
  await page.goto("world/europe/fr/");
  await expect(page.getByTestId("overview-guide")).toContainText("FFVL");
  const list = page.getByTestId("overview-sites");
  const count = overviewSites.filter((s) => s.country === "FR").length;
  await expect(list.locator(":scope > li")).toHaveCount(count);
  const first = list.locator(":scope > li").first();
  await first.locator("summary").click();
  await expect(first.getByRole("link", { name: /Full details on ParaglidingEarth/ })).toBeVisible();
  await first.getByRole("button", { name: "Show the next 3 days" }).click();
  await expect(first.getByText("Within the published range")).toBeVisible();
  await expect(first.getByRole("button", { name: "Show the next 3 days" })).toBeHidden();
});

test("a country without a guide says so plainly", async ({ page }) => {
  await page.goto("world/morocco/");
  await expect(page.getByTestId("guide-missing")).toContainText("Morocco");
});

test("overview pages name no other country's national body by mistake", async ({ page }) => {
  await page.goto("world/europe/de/");
  await expect(page.locator("main")).not.toContainText("SAFA");
  await expect(page.locator("main")).toContainText("DHV");
});

test.describe("overview pages without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the site list and guide are there", async ({ page }) => {
    await page.goto("world/europe/ch/");
    await expect(page.getByTestId("overview-guide")).toContainText("SHV");
    expect(await page.getByTestId("overview-sites").locator(":scope > li").count()).toBeGreaterThan(
      100,
    );
  });
});

for (const p of ["world/", "world/europe/", "world/europe/fr/", "world/nepal/", "world/morocco/"]) {
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
