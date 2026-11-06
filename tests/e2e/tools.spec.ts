// Pilot tools (D99): the tools page, and site pages that open Paraglidable at the launch.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

test("the Pilot tools page groups outside tools and links to each", async ({ page }) => {
  await page.goto("tools/");
  await expect(page.getByRole("heading", { name: "Pilot tools", level: 1 })).toBeVisible();
  await expect(
    page.getByTestId("tool-group-nav").getByRole("link", { name: "Logbooks" }),
  ).toHaveAttribute("href", "#tools-logbooks");
  const card = (name: string) =>
    page.getByTestId("tool-card").filter({ has: page.getByRole("heading", { name, exact: true }) });
  await expect(card("Paralog").getByRole("link", { name: /Open Paralog/ })).toHaveAttribute(
    "href",
    "https://www.paralogbook.de/",
  );
  await expect(card("AirCheck")).toContainText("Australia");
  await expect(page.getByText(/flyable/i)).toHaveCount(0);
});

test("a site page links to Pilot tools; European country pages open Paraglidable over the country", async ({
  page,
}) => {
  await page.goto("au/sites/act/lanyon/");
  // Paraglidable shows nothing for Australia, so Australian site pages don't link to it (D99).
  await expect(page.getByRole("link", { name: /Paraglidable/ })).toHaveCount(0);
  await page.getByRole("link", { name: "More pilot tools" }).click();
  await expect(page).toHaveURL(/\/tools\/$/);
  await page.goto("ch/");
  await expect(page.getByRole("link", { name: /Switzerland on Paraglidable/ })).toHaveAttribute(
    "href",
    /^https:\/\/paraglidable\.com\/\?lat=4[5-7]\.\d+&lon=[6-9]\.\d+&zoom=6$/,
  );
  await page.goto("au/");
  await expect(page.getByRole("link", { name: /on Paraglidable/ })).toHaveCount(0);
});

test("no serious accessibility problems on /tools/", async ({ page }) => {
  await page.goto("tools/");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(serious.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
});
