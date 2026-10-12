import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

const STANWELL = "au/sites/nsw/stanwell-park-bald-hill/";
const BORAH = "au/sites/nsw/manilla-mt-borah/";

async function save(page: import("@playwright/test").Page, path: string) {
  await page.goto(path);
  await page.getByRole("button", { name: "Save to My Sites" }).click();
  await expect(page.getByRole("button", { name: "Saved to My Sites" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
}

test("S1: the star saves a site, My Sites lists it after a reload, even without the network", async ({
  page,
}) => {
  await page.goto("my-sites/");
  await expect(page.getByTestId("my-sites-empty")).toBeVisible();
  await save(page, STANWELL);
  await page.goto("my-sites/");
  await page.reload();
  await expect(
    page.getByTestId("my-sites-list").getByRole("link", { name: "Stanwell Park - Bald Hill" }),
  ).toBeVisible();
  // The saved list comes from this device, not the network.
  await page.route("**/data/sites.json", (route) => route.abort());
  await page.reload();
  await expect(
    page.getByTestId("my-sites-list").getByRole("link", { name: "Stanwell Park - Bald Hill" }),
  ).toBeVisible();
  // Unstarring removes it.
  await page.getByRole("button", { name: /Remove from My Sites/ }).click();
  await expect(page.getByTestId("my-sites-empty")).toBeVisible();
});

test("S2: each saved site shows 6 outlook cells with direction, speed and class, a legend and the credit", async ({
  page,
}) => {
  await save(page, STANWELL); // published range S–E: the fake NE wind is 45° outside
  await save(page, BORAH); // published range All: always within
  await page.goto("my-sites/");
  const cards = page.getByTestId("my-sites-list").getByTestId("site-card");
  await expect(cards).toHaveCount(2);
  for (const card of await cards.all()) {
    const cells = card.locator("[data-testid=outlook] [data-class]");
    await expect(cells).toHaveCount(6);
    await expect(cells.first()).toContainText("NE");
    await expect(cells.first()).toContainText("15");
  }
  await expect(cards.filter({ hasText: "Manilla" }).locator("[data-class=within]")).toHaveCount(6);
  await expect(cards.filter({ hasText: "Stanwell" }).locator("[data-class=within]")).toHaveCount(0);
  await expect(page.getByTestId("outlook-legend")).toContainText("Within the published range");
  await expect(page.getByRole("link", { name: "Weather data by Open-Meteo.com" })).toBeVisible();
  await expect(page.locator("main")).toContainText("Information only.");
});

test("S2: if the forecast can't load, My Sites says so and links to Where To Fly", async ({
  page,
}) => {
  await page.unroute("**/api.open-meteo.com/**");
  await page.route("**/api.open-meteo.com/**", (route) => route.abort());
  await save(page, STANWELL);
  await page.goto("my-sites/");
  await expect(page.getByTestId("outlook-failed")).toContainText("Forecast unavailable");
  await expect(
    page.getByTestId("outlook-failed").getByRole("link", { name: "Where To Fly" }),
  ).toBeVisible();
});

test("units and personal limits change how the outlook reads, never judging speeds by default", async ({
  page,
}) => {
  await save(page, BORAH);
  await page.goto("my-sites/");
  const first = page.locator("[data-testid=outlook] [data-class]").first();
  await expect(first).toContainText("15");
  await expect(page.locator("[data-testid=outlook] .outline-dashed")).toHaveCount(0);
  await page.getByText("Units and speed limits").click();
  await page.getByLabel("Knots").check();
  await expect(first).toContainText("8"); // 15 km/h ≈ 8 kt
  await page.getByLabel(/Highest/).fill("9"); // 9 kt ≈ 17 km/h: the 18 km/h afternoons are over
  await page.getByLabel(/Highest/).blur();
  await expect(page.locator("[data-testid=outlook] .outline-dashed")).toHaveCount(3);
  await expect(page.getByTestId("outlook-legend")).toContainText("Outside your speed limits");
});

test("S4: Share my list makes a link that recreates the list on another device", async ({
  page,
  browser,
}) => {
  await save(page, STANWELL);
  await save(page, BORAH);
  await page.goto("my-sites/");
  await page.getByRole("button", { name: "Share my list" }).click();
  const url = await page.getByTestId("share-url").inputValue();
  expect(url).toContain("/my-sites/?sites=");

  const other = await browser.newContext();
  const page2 = await other.newPage();
  await page2.route("**/api.open-meteo.com/**", (route) => route.abort());
  await page2.goto(url.replace(/^https?:\/\/[^/]+/, "http://localhost:4173"));
  await expect(page2.getByTestId("shared-list")).toContainText("2 sites");
  await page2.getByRole("button", { name: "Add them to My Sites" }).click();
  await expect(page2.getByTestId("my-sites-list").getByTestId("site-card")).toHaveCount(2);
  await other.close();
});

test("Check these sites in Where To Fly opens Where To Fly", async ({ page }) => {
  await save(page, STANWELL);
  await page.goto("my-sites/");
  await expect(
    page.getByRole("link", { name: "Check these sites in Where To Fly" }),
  ).toHaveAttribute("href", /^https:\/\/wheretofly\.info\//);
});

test("site pages show the 2-hourly outlook for 3 days", async ({ page }) => {
  await page.goto(STANWELL);
  await expect(page.locator("[data-testid=outlook] [data-class]")).toHaveCount(24);
  await expect(page.getByTestId("outlook-legend")).toBeVisible();
});

test("returning visitors see Your sites on the home page", async ({ page }) => {
  await page.goto("");
  await expect(page.getByTestId("your-sites")).toHaveCount(0);
  await save(page, BORAH);
  await page.goto("");
  await expect(page.getByTestId("your-sites")).toContainText("Manilla");
  await expect(page.getByTestId("your-sites").locator("[data-class]")).toHaveCount(6);
});

test("S10: the app is installable and opens on My Sites", async ({ page, request }) => {
  await page.goto("");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(href).toBe("/catavento/manifest.webmanifest");
  const manifest = (await (await request.get("manifest.webmanifest")).json()) as {
    start_url: string;
    display: string;
    name: string;
    icons: { src: string; sizes: string; purpose?: string }[];
  };
  expect(manifest).toMatchObject({
    name: "Catavento",
    start_url: "/catavento/my-sites/",
    display: "standalone",
  });
  expect(manifest.icons.map((i) => i.sizes)).toEqual(
    expect.arrayContaining(["192x192", "512x512"]),
  );
  for (const icon of manifest.icons) {
    const res = await request.get(icon.src.replace(/^\/catavento\//, ""));
    expect(res.headers()["content-type"]).toBe("image/png");
  }
});

test("no serious accessibility problems on My Sites with saved sites", async ({ page }) => {
  await save(page, STANWELL);
  await page.goto("my-sites/");
  await expect(page.locator("[data-testid=outlook] [data-class]").first()).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});
