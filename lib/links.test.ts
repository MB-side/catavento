import { describe, expect, it } from "vitest";
import { correctionFormUrl, isExternalHref, windyEmbedUrl } from "./links";

const form = {
  url: "https://docs.google.com/forms/d/e/X/viewform",
  pageField: "entry.1",
  recordField: "entry.2",
};

describe("correctionFormUrl", () => {
  it("fills in the page address", () => {
    const url = new URL(
      correctionFormUrl("https://mb-side.github.io/catavento/au/clubs/", undefined, form),
    );
    expect(url.origin + url.pathname).toBe(form.url);
    expect(url.searchParams.get("usp")).toBe("pp_url");
    expect(url.searchParams.get("entry.1")).toBe("https://mb-side.github.io/catavento/au/clubs/");
    expect(url.searchParams.has("entry.2")).toBe(false);
  });

  it("adds the record ID on record pages", () => {
    const url = new URL(correctionFormUrl("https://x.example/", "org:au:abc", form));
    expect(url.searchParams.get("entry.2")).toBe("org:au:abc");
  });
});

describe("windyEmbedUrl", () => {
  it("builds Windy's standard wind map in the country's units", () => {
    const url = new URL(windyEmbedUrl({ lat: -27, lon: 134, zoom: 4, speedUnit: "kmh" }));
    expect(url.host).toBe("embed.windy.com");
    expect(url.pathname).toBe("/embed2.html");
    expect(url.searchParams.get("overlay")).toBe("wind");
    expect(url.searchParams.get("lat")).toBe("-27.000");
    expect(url.searchParams.get("metricWind")).toBe("km/h");
    expect(
      new URL(windyEmbedUrl({ lat: 0, lon: 0, zoom: 5, speedUnit: "kt" })).searchParams.get(
        "metricWind",
      ),
    ).toBe("kt");
  });
});

describe("isExternalHref", () => {
  const site = "https://example.org/catavento";
  it("treats other websites as outside", () => {
    expect(isExternalHref("https://siteguide.org.au/Sites/Details/Possums", site)).toBe(true);
    expect(isExternalHref("http://open-meteo.com/", site)).toBe(true);
  });
  it("keeps the site's own pages, email, phone and in-page links in place", () => {
    for (const href of [
      "https://example.org/catavento/au/sites/",
      "https://example.org/catavento",
      "/catavento/au/",
      "#main",
      "mailto:hello@example.org",
      "tel:0400000000",
      "",
    ]) {
      expect(isExternalHref(href, site), href).toBe(false);
    }
  });
});
