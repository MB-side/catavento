import { describe, expect, it } from "vitest";
import { absoluteUrl, withBasePath } from "./paths";

describe("withBasePath", () => {
  it("prefixes the base path and adds the trailing slash", () => {
    expect(withBasePath("/au/clubs", "/catavento")).toBe("/catavento/au/clubs/");
    expect(withBasePath("au/clubs/", "/catavento")).toBe("/catavento/au/clubs/");
  });

  it("maps the home page to the base path root", () => {
    expect(withBasePath("/", "/catavento")).toBe("/catavento/");
    expect(withBasePath("", "/catavento")).toBe("/catavento/");
  });

  it("leaves file paths without a trailing slash", () => {
    expect(withBasePath("/data/sites.json", "/catavento")).toBe("/catavento/data/sites.json");
  });

  it("works with an empty base path (custom domain)", () => {
    expect(withBasePath("/au/clubs", "")).toBe("/au/clubs/");
    expect(withBasePath("/", "")).toBe("/");
  });
});

describe("absoluteUrl", () => {
  it("joins the site URL and path", () => {
    expect(absoluteUrl("/au/clubs", "https://mb-side.github.io/catavento")).toBe(
      "https://mb-side.github.io/catavento/au/clubs/",
    );
    expect(absoluteUrl("/", "https://catavento.fly/")).toBe("https://catavento.fly/");
  });
});
