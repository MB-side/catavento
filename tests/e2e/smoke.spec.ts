import { readFileSync } from "node:fs";
import path from "node:path";
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

test("home is an overview: search, sections and countries", async ({ page }) => {
  await page.goto("");
  const sections = page.getByRole("region", { name: "What's here" });
  for (const name of ["Sites & map", "What's on", "Gear", "New to flying"]) {
    await expect(sections.getByRole("link", { name: new RegExp(name) })).toBeVisible();
  }
  const countries = page.getByRole("region", { name: "Browse by country" });
  await expect(countries.getByRole("link", { name: /Australia/ })).toHaveAttribute(
    "href",
    /\/au\/$/,
  );
  await expect(countries.getByRole("link", { name: /New Zealand.*Sample/ })).toBeVisible();

  await page.getByLabel("Search sites, clubs, schools and events").fill("Stanwell");
  await page.getByRole("search").getByRole("button", { name: "Search" }).click();
  await expect(page).toHaveURL(/\/catavento\/search\/\?q=Stanwell$/);
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

for (const path of ["", "au/clubs/", "nz/", "feedback/", "status/", "bot/"]) {
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

const providers = JSON.parse(
  readFileSync(path.join(process.cwd(), "data", "generated", "providers.json"), "utf8"),
) as { id: string; name: string; tier: string }[];

test("Sources lists every provider with its tier and credit line", async ({ page }) => {
  await page.goto("sources/");
  const cards = page.locator("li[id^='provider-']");
  await expect(cards).toHaveCount(providers.length);
  for (const p of providers) {
    const card = page.locator(`#provider-${p.id}`);
    await expect(card.getByRole("heading", { name: p.name })).toBeVisible();
    await expect(card).toContainText(/Green|Amber|Red/);
    await expect(card).toContainText("Credit shown");
  }
});

test("country pages show counts worked out from the data", async ({ page }) => {
  await page.goto("au/");
  await expect(page.getByTestId("country-counts")).toContainText(/\d+ clubs/);
  await page.goto("nz/");
  await expect(page.getByTestId("country-counts")).toContainText(/5 sites/);
  await expect(page.getByTestId("country-counts")).toContainText(/11 clubs/);
});

test("the 404 page has its own title", async ({ page }) => {
  await page.goto("no-such-page/");
  await expect(page).toHaveTitle("Page not found | Catavento");
});

test("every page offers 'Report a correction' with its own address filled in", async ({ page }) => {
  await page.goto("nz/clubs/");
  const link = page.getByRole("contentinfo").getByRole("link", { name: "Report a correction" });
  const href = new URL((await link.getAttribute("href")) ?? "");
  expect(href.host).toBe("docs.google.com");
  expect(href.searchParams.get("usp")).toBe("pp_url");
  expect([...href.searchParams.values()]).toContain(
    "https://mb-side.github.io/catavento/nz/clubs/",
  );
});

test("the feedback page links to both forms and the email address", async ({ page }) => {
  await page.goto("feedback/");
  await expect(page.getByRole("link", { name: "Open the feedback form" })).toHaveAttribute(
    "href",
    /docs\.google\.com\/forms\//,
  );
  await expect(
    page.getByRole("main").getByRole("link", { name: "Report a correction" }),
  ).toHaveAttribute("href", /docs\.google\.com\/forms\//);
  await expect(page.getByRole("link", { name: "housethermal.app@gmail.com" })).toBeVisible();
});

test("Windy's map loads only after a tap, with its credit", async ({ page }) => {
  await page.route("**/embed.windy.com/**", (route) => route.abort());
  await page.goto("au/");
  const map = page.getByTestId("windy-map");
  await expect(map.locator("iframe")).toHaveCount(0);
  await expect(map.getByRole("link", { name: "Wind map by Windy.com" })).toBeVisible();
  await map.getByRole("button", { name: "Show live wind map" }).click();
  await expect(map.locator("iframe")).toHaveAttribute(
    "src",
    /embed\.windy\.com\/embed2\.html.*overlay=wind/,
  );
  await expect(page.getByTestId("stations-placeholder")).toBeVisible();
});

test("Status shows the Site Guide's latest run and next check", async ({ page }) => {
  await page.goto("status/");
  const card = page.locator("#status-ansg");
  await expect(card.getByRole("heading", { name: "Australian National Site Guide" })).toBeVisible();
  await expect(card).toContainText("Every day");
  await expect(card).toContainText(/\d+ found, \d+ changed/);
  await expect(card).toContainText("Next check");
});

test("the bot page shows the user agent and how to opt out", async ({ page }) => {
  await page.goto("bot/");
  await expect(page.getByRole("main")).toContainText(
    "CataventoBot/0.1 (+https://mb-side.github.io/catavento/bot/;",
  );
  await expect(page.getByRole("main")).toContainText("User-agent: CataventoBot");
  await expect(page.getByRole("main")).toContainText("Disallow: /");
});
