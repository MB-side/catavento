import { describe, expect, it } from "vitest";
import { analyticsScript } from "./analytics";

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
