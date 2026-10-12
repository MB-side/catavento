import { describe, expect, it } from "vitest";
import { checkHtml, visibleText } from "./content-guard";

const page = (body: string) =>
  `<html><head><title>Clubs | Catavento</title></head><body>${body}</body></html>`;

describe("content guard", () => {
  it("passes clean pages", () => {
    expect(checkHtml(page("<p>Forecast wind direction within the published range.</p>"))).toEqual(
      [],
    );
  });

  it.each([
    ["Conditions look flyable today", "flyable"],
    ["Is it safe to launch?", "safe"],
    ["Looks good to go", "good-to-go"],
    ["Courses from [price]", "placeholder"],
    ["Welcome to Cata-vento", "name-spelling"],
    ["Welcome to CataVento", "name-spelling"],
    ["Welcome to HouseThermal", "old-name"],
  ])("flags %j", (text, rule) => {
    expect(checkHtml(page(`<p>${text}</p>`)).map((h) => h.rule)).toContain(rule);
  });

  it("allows words that merely contain banned ones", () => {
    expect(
      checkHtml(page("<p>Safety officers · SAFA membership · it's on the club website</p>")),
    ).toEqual([]);
  });

  it("ignores scripts, so JSON-LD and framework data don't trip it", () => {
    const html = page(
      '<script type="application/ld+json">{"description":"[not visible]","x":["a"]}</script><p>Hi</p>',
    );
    expect(checkHtml(html)).toEqual([]);
  });

  it("extracts visible text", () => {
    expect(visibleText("<p>A &amp; B</p><!-- [hidden] --><style>.x{}</style>")).toBe(" A & B ");
  });
});
