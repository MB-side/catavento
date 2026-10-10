import { describe, expect, it } from "vitest";
import { absoluteUrl, withBasePath } from "./paths";

describe("withBasePath", () => {
  it("prefixes the base path and adds the trailing slash", () => {
    expect(withBasePath("/au/clubs", "/housethermal")).toBe("/housethermal/au/clubs/");
    expect(withBasePath("au/clubs/", "/housethermal")).toBe("/housethermal/au/clubs/");
  });

  it("maps the home page to the base path root", () => {
    expect(withBasePath("/", "/housethermal")).toBe("/housethermal/");
    expect(withBasePath("", "/housethermal")).toBe("/housethermal/");
  });

  it("leaves file paths without a trailing slash", () => {
    expect(withBasePath("/data/sites.json", "/housethermal")).toBe("/housethermal/data/sites.json");
  });

  it("works with an empty base path (custom domain)", () => {
    expect(withBasePath("/au/clubs", "")).toBe("/au/clubs/");
    expect(withBasePath("/", "")).toBe("/");
  });
});

describe("absoluteUrl", () => {
  it("joins the site URL and path", () => {
    expect(absoluteUrl("/au/clubs", "https://mb-side.github.io/housethermal")).toBe(
      "https://mb-side.github.io/housethermal/au/clubs/",
    );
    expect(absoluteUrl("/", "https://housethermal.fly/")).toBe("https://housethermal.fly/");
  });
});
