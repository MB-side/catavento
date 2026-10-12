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
  sources: { providerId: string }[];
}
interface SiteRecord {
  id: string;
  name: string;
  country: string;
  regionCode: string;
  slug: string;
  stewardRole: string;
  stewardOrgId?: string;
}

const read = <T>(file: string) =>
  JSON.parse(readFileSync(path.join(process.cwd(), "data", "generated", file), "utf8")) as T;
const orgs = read<Org[]>("organisations.json").filter((o) => !o.hidden);
const sites = read<SiteRecord[]>("sites.json");
const clubLike = orgs.filter((o) => o.kind === "club" || o.kind === "regional_association");
const clubPath = (o: Org) => `${o.country.toLowerCase()}/clubs/${o.slug}/`;
const sitePath = (s: SiteRecord) =>
  `${s.country.toLowerCase()}/sites/${s.regionCode.split("-")[1]?.toLowerCase()}/${s.slug}/`;

test("the clubs directory lists every club and association in the country", async ({ page }) => {
  for (const country of ["AU", "NZ"]) {
    const expected = clubLike.filter((o) => o.country === country);
    await page.goto(`${country.toLowerCase()}/clubs/`);
    await expect(page.getByTestId("club-count")).toContainText(String(expected.length));
    for (const o of expected) {
      await expect(page.getByRole("link", { name: o.name, exact: true })).toBeVisible();
    }
  }
});

test("every club in the national bodies' directories has a page", async ({ request }) => {
  // SAFA's club directory for Australia; NZHGPA's club list (seed) for New Zealand.
  const listed = clubLike.filter(
    (o) => o.sources.some((s) => s.providerId === "safa") || o.country === "NZ",
  );
  expect(listed.length).toBeGreaterThan(40);
  for (const o of listed) {
    const res = await request.get(clubPath(o));
    expect(res.status(), o.name).toBe(200);
  }
});

test("sites and their managing clubs link to each other both ways", async ({ request }) => {
  const managed = sites.filter((s) => s.stewardRole === "club" && s.stewardOrgId);
  expect(managed.length).toBeGreaterThan(40);
  for (const s of managed) {
    const club = orgs.find((o) => o.id === s.stewardOrgId);
    expect(club, s.id).toBeDefined();
    const siteHtml = await (await request.get(sitePath(s))).text();
    expect(siteHtml, `${s.id} → club`).toContain(`/clubs/${club?.slug}/`);
    const clubHtml = await (await request.get(clubPath(club as Org))).text();
    expect(clubHtml, `${club?.id} → site`).toContain(
      `/sites/${s.regionCode.split("-")[1]?.toLowerCase()}/${s.slug}/`,
    );
  }
});

test("Follow club saves the club's sites to My Sites on this device", async ({ page }) => {
  await page.goto("my-sites/");
  await expect(page.getByTestId("my-sites-empty")).toBeVisible();
  await page.goto("au/clubs/canungra-hang-gliding-club/");
  const managed = page.getByTestId("club-managed").getByTestId("site-card");
  const count = await managed.count();
  expect(count).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Follow club" }).click();
  await expect(page.getByRole("status")).toContainText(`${count} site`);
  await page.goto("my-sites/");
  await expect(page.getByTestId("my-sites-list").getByRole("listitem")).toHaveCount(count);
  await page
    .getByRole("button", { name: /Remove from My Sites/ })
    .first()
    .click();
  await expect(page.getByTestId("my-sites-list").getByRole("listitem")).toHaveCount(count - 1);
});

test("New Zealand club pages use NZHGPA wording and show the sample notice", async ({ page }) => {
  for (const o of clubLike.filter((x) => x.country === "NZ")) {
    await page.goto(clubPath(o));
    await expect(page.locator("body")).not.toContainText("SAFA");
    await expect(page.locator("main")).toContainText("NZHGPA membership");
    await expect(page.getByTestId("coverage-notice")).toBeVisible();
  }
});

test("a club page separates confirmed sites from sites that only list it", async ({ page }) => {
  await page.goto("au/clubs/act-hang-gliding-and-paragliding-association/");
  await expect(page.getByRole("heading", { name: "Sites we manage" })).toBeVisible();
  await expect(page.getByTestId("club-managed").getByRole("listitem").first()).toBeVisible();
  await expect(page.locator("main")).toContainText("Current SAFA membership is required");
});

for (const p of [
  "au/clubs/",
  "au/clubs/canungra-hang-gliding-club/",
  "nz/clubs/canterbury-club/",
  "my-sites/",
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
