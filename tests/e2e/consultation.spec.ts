import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

// docs/02 §7 Resilience: pages render fully without JavaScript, except My Sites, outlook, map and search.
const NO_JS: [string, string][] = [
  ["", "Catavento"],
  ["au/", "Australia"],
  ["au/sites/", "Sites & map · Australia"],
  ["au/sites/nsw/stanwell-park-bald-hill/", "Stanwell Park - Bald Hill"],
  ["au/clubs/canungra-hang-gliding-club/", "Canungra Hang Gliding Club Inc"],
  ["au/new-to-flying/schools/", "Schools"],
  ["au/directory/manilla-paragliding/", "Manilla Paragliding"],
  ["au/whats-on/", "What's on"],
  ["about/", "About"],
];

test.describe("pages work without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  for (const [path, heading] of NO_JS) {
    test(`/${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
    });
  }

  test("the sites list shows every site without JavaScript", async ({ page }) => {
    await page.goto("au/sites/");
    expect(await page.getByTestId("site-card").count()).toBeGreaterThan(300);
  });

  test("a site page shows its steward and facts without JavaScript", async ({ page }) => {
    await page.goto("au/sites/nsw/stanwell-park-bald-hill/");
    await expect(page.getByTestId("steward-panel")).toContainText("Managed by");
    await expect(page.locator("main")).toContainText("PG4 / HG Intermediate");
  });
});

test("the home page says plainly that Catavento is a directory", async ({ page }) => {
  await page.goto("");
  await expect(page.locator("main")).toContainText("Free directory");
  await expect(page.locator("main")).toContainText(
    "A free, independent directory of paragliding and hang gliding",
  );
});

test("policy pages say what the plan promises", async ({ page }) => {
  await page.goto("privacy/");
  for (const text of [
    "No accounts, no cookies",
    "Open-Meteo",
    "OpenFreeMap",
    "Windy",
    "Google Forms",
    "GitHub Pages",
  ]) {
    await expect(page.locator("main")).toContainText(text);
  }
  await page.goto("takedown/");
  await expect(page.locator("main")).toContainText("within 24 hours");
  await page.goto("disclaimer/");
  await expect(page.locator("main")).toContainText("You are responsible for your decision to fly.");
  await page.goto("about/");
  await expect(page.locator("main")).toContainText("Catavento is Portuguese for pinwheel");
  await page.goto("feedback/");
  await expect(page.getByTestId("testers")).toContainText("Helping test Catavento?");
});

test("What's on carries Event JSON-LD when there are events", async ({ page }) => {
  await page.goto("au/whats-on/");
  const count = Number((await page.getByTestId("event-count").innerText()).split(" ")[0]);
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(ld.some((x) => x.includes('"@type":"Event"'))).toBe(count > 0);
});

// docs/02 §7 Accessibility: one page of every kind, and every global page.
const SWEEP = [
  "about/",
  "privacy/",
  "takedown/",
  "disclaimer/",
  "sources/",
  "status/",
  "bot/",
  "au/gear/",
  "au/gear/shops/",
  "au/gear/used/",
  "au/new-to-flying/learn/",
  "au/new-to-flying/choosing-a-school/",
  "au/new-to-flying/costs/",
  "au/sites/nsw/",
  "nz/",
  "nz/new-to-flying/tandem/",
  "nz/sites/auk/karioitahi-beach/",
  "nz/directory/highside-flight-park/",
  "no-such-page/",
];

for (const p of SWEEP) {
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
