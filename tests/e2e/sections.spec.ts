import { readFileSync } from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

interface Org {
  id: string;
  slug: string;
  name: string;
  kind: string;
  country: string;
  hidden?: boolean;
  website?: string;
}
const orgs = (
  JSON.parse(
    readFileSync(path.join(process.cwd(), "data", "generated", "organisations.json"), "utf8"),
  ) as Org[]
).filter((o) => !o.hidden);
const directory = orgs.filter((o) => o.kind !== "club" && o.kind !== "regional_association");

test.describe("S5: find a tandem near me", () => {
  test("tandem flights are grouped by state, with discipline and a link, and only published prices", async ({
    page,
  }) => {
    await page.goto("au/new-to-flying/tandem/");
    const regions = page.getByTestId("tandem-region");
    expect(await regions.count()).toBeGreaterThan(3);
    const nsw = regions.filter({
      has: page.getByRole("heading", { name: "New South Wales", level: 2 }),
    });
    await expect(
      nsw.getByRole("heading", { name: "Businesses that publish tandem flights" }),
    ).toBeVisible();
    for (const card of await nsw.getByTestId("org-card").all()) {
      await expect(card.getByRole("link").first()).toBeVisible();
    }
    await expect(
      nsw.getByTestId("org-card").filter({ hasText: "Sydney Hang Gliding Centre" }),
    ).toContainText("Hang gliding");
    // The only published price is Manilla Paragliding's; no other card shows a price.
    const priced = page.getByTestId("org-card").filter({ hasText: "A$" });
    await expect(priced).toHaveCount(1);
    await expect(priced).toContainText("Manilla Paragliding");
    await expect(page.locator("main")).toContainText("Weight and age limits vary");
  });
});

test.describe("S6: compare schools", () => {
  test("up to three schools side by side, with Not published for gaps", async ({ page }) => {
    await page.goto("au/new-to-flying/schools/");
    const boxes = page.getByTestId("school-card").getByRole("checkbox");
    expect(await boxes.count()).toBeGreaterThan(10);
    await page
      .getByTestId("school-card")
      .filter({ hasText: "Manilla Paragliding" })
      .first()
      .getByRole("checkbox")
      .check();
    await boxes.nth(1).check();
    await boxes.nth(2).check();
    const compare = page.getByTestId("compare");
    await expect(compare.getByRole("columnheader")).toHaveCount(3);
    await expect(compare).toContainText("A$2,890");
    await expect(compare).toContainText("Not published");
    await expect(boxes.nth(5)).toBeDisabled();
    await expect(page.locator("main")).toContainText("You can compare up to 3 schools.");
    await page.getByRole("button", { name: "Clear comparison" }).click();
    await expect(compare).toHaveCount(0);
  });

  test("filters by state and discipline", async ({ page }) => {
    await page.goto("au/new-to-flying/schools/");
    const all = await page.getByTestId("school-card").count();
    await page.getByLabel("Teaches").selectOption({ label: "Hang gliding" });
    const hg = await page.getByTestId("school-card").count();
    expect(hg).toBeGreaterThan(0);
    expect(hg).toBeLessThan(all);
  });
});

test("every school, operator, shop and national body has a profile", async ({ request }) => {
  expect(directory.length).toBeGreaterThan(50);
  for (const o of directory) {
    const res = await request.get(`${o.country.toLowerCase()}/directory/${o.slug}/`);
    expect(res.status(), o.name).toBe(200);
  }
});

test("the learning pathway links to the national body; New Zealand gets the short version", async ({
  page,
  request,
}) => {
  await page.goto("au/new-to-flying/learn/");
  await expect(page.getByRole("link", { name: /SAFA's own guide/ })).toHaveAttribute(
    "href",
    /safa\.asn\.au/,
  );
  await expect(page.getByRole("link", { name: "Paragliding" })).toBeVisible();
  await page.goto("nz/new-to-flying/learn/");
  await expect(page.getByRole("link", { name: /NZHGPA's own guide/ })).toHaveAttribute(
    "href",
    /nzhgpa\.org\.nz/,
  );
  await expect(page.getByRole("link", { name: "How to choose a school" })).toHaveCount(0);
  expect((await request.get("nz/new-to-flying/costs/")).status()).toBe(404);
});

test("gear: brands lead to the businesses that sell them, and used-gear advice links to SAFA", async ({
  page,
}) => {
  await page.goto("au/gear/where-to-buy/");
  const brands = page
    .getByTestId("brands")
    .getByRole("listitem")
    .filter({ has: page.getByRole("heading") });
  expect(await brands.count()).toBeGreaterThan(15);
  await expect(page.getByRole("heading", { name: "Ozone" }).locator("..")).toContainText(
    "Planet Paragliding",
  );
  await page.goto("au/gear/used/");
  await expect(page.getByRole("link", { name: /advice on buying equipment/ })).toHaveAttribute(
    "href",
    "https://safa.asn.au/pilot-tools/buying-equipment/",
  );
});

test("What's on lists upcoming events and the national notices", async ({ page }) => {
  await page.goto("au/whats-on/");
  await expect(page.getByTestId("event-count")).toBeVisible();
  expect(await page.getByTestId("notices").getByRole("listitem").count()).toBeGreaterThan(20);
});

test("visiting pilots get their country's own national body", async ({ page }) => {
  await page.goto("au/visiting-pilots/");
  await expect(page.getByRole("link", { name: /SAFA's page for visiting pilots/ })).toBeVisible();
  await page.goto("nz/visiting-pilots/");
  await expect(page.getByRole("link", { name: /NZHGPA's page for visiting pilots/ })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("SAFA");
});

test("New Zealand's New to flying pages never mention SAFA", async ({ page }) => {
  for (const p of [
    "nz/new-to-flying/",
    "nz/new-to-flying/tandem/",
    "nz/new-to-flying/schools/",
    "nz/new-to-flying/learn/",
    "nz/gear/",
  ]) {
    await page.goto(p);
    await expect(page.locator("body")).not.toContainText("SAFA");
  }
});

test("search finds sites, clubs and schools", async ({ page }) => {
  await page.goto("search/?q=stanwell");
  await expect(
    page.getByTestId("search-results").getByRole("link", { name: "Stanwell Park - Bald Hill" }),
  ).toBeVisible();
  await page.getByLabel("Search sites, clubs, schools and events").fill("canungra");
  await expect(
    page
      .getByTestId("search-results")
      .getByRole("link", { name: "Canungra Hang Gliding Club Inc" }),
  ).toBeVisible();
  await page.getByLabel("Search sites, clubs, schools and events").fill("zzzz-nothing");
  await expect(page.getByTestId("search-count")).toContainText("Nothing matches");
});

test("the home page search box leads to results", async ({ page }) => {
  await page.goto("");
  await page.getByRole("searchbox").first().fill("manilla");
  await page.getByRole("searchbox").first().press("Enter");
  await expect(page).toHaveURL(/search\/\?q=manilla/);
  await expect(page.getByTestId("search-results").getByRole("link").first()).toBeVisible();
});

for (const p of [
  "au/",
  "au/new-to-flying/",
  "au/new-to-flying/tandem/",
  "au/new-to-flying/schools/",
  "au/new-to-flying/learn/paragliding/",
  "au/directory/manilla-paragliding/",
  "au/gear/where-to-buy/",
  "au/whats-on/",
  "au/visiting-pilots/",
  "search/?q=long",
]) {
  test(`no serious accessibility problems on /${p}`, async ({ page }) => {
    await page.goto(p);
    if (p.startsWith("search")) await expect(page.getByTestId("search-results")).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
}

test("Shops: 'What are you after?' narrows the list to businesses that sell it", async ({
  page,
}) => {
  await page.goto("au/gear/shops/");
  const count = async () =>
    Number((await page.getByTestId("gear-count").innerText()).split(" ")[0]);
  const all = await count();
  const filter = page.getByTestId("gear-filter");
  await filter.getByRole("button", { name: "Instruments (varios, GPS, radios)" }).click();
  await expect(
    filter.getByRole("button", { name: "Instruments (varios, GPS, radios)" }),
  ).toHaveAttribute("aria-pressed", "true");
  const instruments = await count();
  expect(instruments).toBeGreaterThan(0);
  expect(instruments).toBeLessThan(all);
  for (const card of await page.getByTestId("org-card").all()) {
    await expect(card).toContainText("Instruments (varios, GPS, radios)");
  }
  await filter.getByRole("button", { name: "Pod harnesses" }).click();
  await expect(page.getByTestId("org-card").filter({ hasText: "Fly2Base" })).toBeVisible();
  await expect(page.getByTestId("org-card").filter({ hasText: "Paratech" })).toHaveCount(0);
  await expect(page.locator("main")).toContainText("such as an EN-B wing");
});

test("search finds shops by the gear people ask for", async ({ page }) => {
  await page.goto("search/?q=vario");
  await expect(
    page.getByTestId("search-results").getByRole("link", { name: "Fly2Base" }),
  ).toBeVisible();
  await page.getByLabel("Search sites, clubs, schools and events").fill("pod harness");
  await expect(
    page.getByTestId("search-results").getByRole("link", { name: "Paragliding Shop" }),
  ).toBeVisible();
});

test("a station away from the launch says roughly how far", async ({ page }) => {
  await page.goto("au/sites/qld/teewah-beach/");
  await expect(page.locator("main")).toContainText("Lake Cootharaba");
  await expect(page.locator("main")).toContainText("about 7 km away");
});

test("a wind range from a club website is credited to the club", async ({ page }) => {
  await page.goto("au/sites/nsw/bartletts-reserve-ne-bonnys/");
  await expect(page.locator("main")).toContainText("Published range: NNE–ENE");
  await expect(
    page.getByRole("link", { name: /Wind directions from the Mid North Coast Flyers Inc website/ }),
  ).toHaveAttribute("href", "https://mncf.tidyhq.com/public/pages/bartletts-reserve");
});

test("community sites show ParaglidingEarth's extra facts and possible directions", async ({
  page,
}) => {
  await page.goto("au/sites/nsw/manilla-skyranch/");
  const main = page.locator("main");
  await expect(main).toContainText("m at takeoff");
  await expect(main).toContainText("Kinds of flying");
});

test("New Zealand lists its ParaglidingEarth community sites", async ({ page }) => {
  await page.goto("nz/sites/");
  const count = Number((await page.getByTestId("site-count").innerText()).split(" ")[0]);
  expect(count).toBeGreaterThan(100);
  await expect(page.locator("body")).not.toContainText("SAFA");
});
