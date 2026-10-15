import { describe, expect, it } from "vitest";
import { analyticsScript, outboundEvent } from "./analytics";

const on = { enabled: true, provider: "goatcounter", code: "catavento" } as const;

describe("analyticsScript", () => {
  it("loads nothing while counting is off", () => {
    expect(analyticsScript({ ...on, enabled: false })).toBeNull();
  });
  it("loads nothing without a valid site name", () => {
    expect(analyticsScript({ ...on, code: "" })).toBeNull();
    expect(analyticsScript({ ...on, code: "Bad Name/x" })).toBeNull();
    expect(analyticsScript({ ...on, code: "a.b" })).toBeNull();
  });
  it("points at the site's own GoatCounter endpoint", () => {
    expect(analyticsScript(on)).toEqual({
      src: "https://gc.zgo.at/count.js",
      endpoint: "https://catavento.goatcounter.com/count",
    });
  });
});

describe("outboundEvent", () => {
  const origin = "https://mb-side.github.io";
  it("names the other site and page, without query or fragment", () => {
    expect(outboundEvent("https://www.nova.eu/en/try-buy/?a=1#x", origin)).toEqual({
      path: "outbound/www.nova.eu/en/try-buy",
      title: "www.nova.eu",
    });
    expect(outboundEvent("https://example.org/", origin)).toEqual({
      path: "outbound/example.org",
      title: "example.org",
    });
  });
  it("ignores links within the site, email, phone and broken links", () => {
    expect(outboundEvent("/catavento/au/sites/", origin)).toBeNull();
    expect(outboundEvent("https://mb-side.github.io/catavento/about/", origin)).toBeNull();
    expect(outboundEvent("mailto:a@b.example", origin)).toBeNull();
    expect(outboundEvent("tel:+61400000000", origin)).toBeNull();
    expect(outboundEvent("http://[bad", origin)).toBeNull();
  });
});
