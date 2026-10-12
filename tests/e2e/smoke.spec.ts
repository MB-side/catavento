import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Relative paths: baseURL already includes the basePath, so these exercise the real URLs.
const globalPages = [
  "",
  "my-sites/",
  "search/",
  "about/",
  "sources/",
  "status/",
  "bot/",
  "takedown/",
  "privacy/",
  "disclaimer/",
  "feedback/",
];
const countrySections = [
  "",
  "sites/",
  "clubs/",
  "whats-on/",
  "gear/",
  "new-to-flying/",
  "visiting-pilots/",
];

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1280) < 1024;

test.describe("every page", () => {
  const all = [...globalPages, ...countrySections.flatMap((s) => [`au/${s}`, `nz/${s}`])];
  for (const path of all) {
    test(`renders /${path}`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page).toHaveTitle(/Catavento/);
      await expect(page.getByTestId("prototype-banner")).toBeVisible();
    });
  }
});

test("home page has the brand title, descriptor and Organization JSON-LD", async ({ page }) => {
  await page.goto("");
  await expect(page).toHaveTitle(
    "Catavento · Paragliding and hang gliding in Australia, all in one place",
  );
  await expect(page.locator("h1")).toHaveText("Catavento");
  const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(JSON.parse(jsonLd ?? "{}")).toMatchObject({
    "@type": "Organization",
    name: "Catavento",
  });
  // Search engines are kept out until consultation launch.
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("prototype banner can be dismissed for the session", async ({ page }) => {
  await page.goto("");
  const banner = page.getByTestId("prototype-banner");
  await banner.getByRole("button", { name: "Hide this notice" }).click();
  await expect(banner).toBeHidden();
  await page.goto("about/");
  await expect(page.locator("h1")).toHaveText("About");
  await expect(page.getByTestId("prototype-banner")).toBeHidden();
});

test("banner names each country's own bodies", async ({ page }) => {
  await page.goto("au/");
  await expect(page.getByTestId("prototype-banner")).toContainText(
    "SAFA, the Site Guide or any club",
  );
  await page.goto("nz/");
  await expect(page.getByTestId("prototype-banner")).toContainText("NZHGPA or any club");
  await page.goto("about/");
  await expect(page.getByTestId("prototype-banner")).toContainText("any national body");
});

test("no SAFA wording on any New Zealand page; sample notice shown", async ({ page }) => {
  for (const section of countrySections) {
    await page.goto(`nz/${section}`);
    await expect(page.locator("body")).not.toContainText("SAFA");
    await expect(page.getByTestId("coverage-notice")).toBeVisible();
  }
  await page.goto("au/");
  await expect(page.getByTestId("coverage-notice")).toHaveCount(0);
});

test("unknown pages and countries show the 404 page", async ({ page }) => {
  const response = await page.goto("xx/clubs/");
  expect(response?.status()).toBe(404);
  await expect(page.locator("h1")).toHaveText("Page not found");
});

test("navigation reaches each section in the current country", async ({ page }) => {
  await page.goto("nz/");
  if (isPhone(page)) {
    const tabs = page.getByRole("navigation", { name: "Sections" });
    for (const [label, path] of [
      ["Sites", "nz/sites/"],
      ["What's on", "nz/whats-on/"],
      ["Gear", "nz/gear/"],
      ["New to flying", "nz/new-to-flying/"],
      ["My Sites", "my-sites/"],
    ] as const) {
      await tabs.getByRole("link", { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/catavento/${path}$`));
      await expect(tabs.getByRole("link", { name: label, exact: true })).toHaveAttribute(
        "aria-current",
        "page",
      );
    }
    await page.getByRole("link", { name: "Search" }).click();
    await expect(page).toHaveURL(/\/catavento\/search\/$/);
    await page.getByLabel("Menu").click();
    await page.getByRole("link", { name: "About" }).first().click();
    await expect(page).toHaveURL(/\/catavento\/about\/$/);
  } else {
    const nav = page.getByRole("navigation", { name: "Main" });
    for (const [label, path] of [
      ["Sites & map", "nz/sites/"],
      ["What's on", "nz/whats-on/"],
      ["Gear", "nz/gear/"],
      ["New to flying", "nz/new-to-flying/"],
      ["My Sites", "my-sites/"],
    ] as const) {
      await nav.getByRole("link", { name: label }).click();
      await expect(page).toHaveURL(new RegExp(`/catavento/${path}$`));
      await expect(nav.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
    }
  }
});

test("there is no Clubs section in the navigation (D31)", async ({ page }) => {
  await page.goto("au/");
  for (const name of ["Main", "Sections"]) {
    await expect(
      page.getByRole("navigation", { name }).getByRole("link", { name: "Clubs" }),
    ).toHaveCount(0);
  }
});

test("interactive controls in the bars meet the 44 px touch target", async ({ page }) => {
  await page.goto("au/");
  const controls = page.locator(
    "header a:visible, header summary:visible, [data-testid=prototype-banner] button, nav[aria-label=Sections] a:visible",
  );
  const count = await controls.count();
  expect(count).toBeGreaterThan(3);
  for (let i = 0; i < count; i++) {
    const box = await controls.nth(i).boundingBox();
    expect(box?.height ?? 0, await controls.nth(i).innerText()).toBeGreaterThanOrEqual(44);
  }
});

for (const path of ["", "au/clubs/", "nz/", "feedback/"]) {
  test(`no serious accessibility problems on /${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
}
