import { describe, expect, it } from "vitest";
import { orgId, orgSlug, regionSegment, siteId, slugify, stationId } from "./ids";

describe("slugify", () => {
  it("makes lowercase kebab-case and folds accents and macrons", () => {
    expect(slugify("Hawke's Bay & Co.")).toBe("hawkes-bay-co");
    expect(slugify("Manawatū-Whanganui")).toBe("manawatu-whanganui");
    expect(slugify("  Long Reef NE ")).toBe("long-reef-ne");
  });
});

describe("orgSlug", () => {
  it("drops a trailing parenthetical and legal suffixes", () => {
    expect(orgSlug("Sports Aviation Federation of Australia (SAFA)")).toBe(
      "sports-aviation-federation-of-australia",
    );
    expect(orgSlug("Albany Hang Gliding Club Inc")).toBe("albany-hang-gliding-club");
    expect(orgSlug("The Pico Club Incorporated")).toBe("the-pico-club");
  });

  it("keeps the parenthetical when asked, to tell clashing names apart", () => {
    expect(orgSlug("SkySurf Paragliding (Canberra)", true)).toBe("skysurf-paragliding-canberra");
  });
});

describe("ID builders", () => {
  it("follow docs/04 §1", () => {
    expect(orgId("AU", "x")).toBe("org:au:x");
    expect(regionSegment("NZ-CAN")).toBe("can");
    expect(siteId("NZ", "NZ-CAN", "port-hills")).toBe("site:nz:can:port-hills");
    expect(stationId("freeflightwx", "acthpa/springhill")).toBe("station:freeflightwx:acthpa-springhill");
  });
});
