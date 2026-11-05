// Visiting pilots (D89): the hub, a country outside Australia and New Zealand, the tours page, and
// the Australian page's new sections.
import { readFileSync } from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

const visiting = JSON.parse(
  readFileSync(path.join(process.cwd(), "data", "generated", "visiting.json"), "utf8"),
) as {
  help: { country: string; name: string }[];
  tours: { name: string; destinations: string[] }[];
};

test("the visiting hub lists Australia, New Zealand and overseas countries, and links to tours", async ({
  page,
}) => {
  await page.goto("visiting/");
  const home = page.getByTestId("visiting-home");
  await expect(home.getByRole("link", { name: /Australia/ })).toHaveAttribute("href", /\/au\/$/);
  await expect(home.getByRole("link", { name: /New Zealand/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Europe", level: 2 })).toBeVisible();
  await expect(page.getByRole("link", { name: /^France/ })).toHaveAttribute("href", /\/fr\/$/);
  if (visiting.tours.length > 0) await expect(page.getByTestId("tours-link")).toBeVisible();
  await expect(page.getByTestId("visitor-rules")).toContainText("IPPI");
});

test("the tours page lists every operator", async ({ page }) => {
  await page.goto("visiting/tours/");
  if (visiting.tours.length > 0) {
    await expect(page.getByTestId("tour-list").locator(":scope > li")).toHaveCount(
      visiting.tours.length,
    );
  }
});

test("the Australian visiting page adds the rules for overseas pilots and help on the ground", async ({
  page,
}) => {
  await page.goto("au/visiting-pilots/");
  await expect(page.getByTestId("visitor-rules")).toContainText("SAFA");
  // The rules are a summary: the page says so and links to SAFA's own page.
  const notice = page.getByTestId("rules-notice");
  await expect(notice).toContainText("not legal advice");
  await expect(
    notice.getByRole("link", { name: /current rules for visiting pilots/ }),
  ).toHaveAttribute("href", /safa\.asn\.au/);
  await expect(page.getByRole("heading", { name: "Help on the ground" })).toBeVisible();
  await expect(page.getByTestId("visiting-map")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Flying tours here" })).toBeVisible();
});

for (const p of ["visiting/tours/", "au/visiting-pilots/"]) {
  test(`no serious accessibility problems on /${p}`, async ({ page }) => {
    await page.goto(p);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
}
