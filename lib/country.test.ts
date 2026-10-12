import { describe, expect, it } from "vitest";
import { countriesFileSchema } from "@/lib/schemas";
import { siteConfig } from "@/site.config";
import { getOrganisation } from "./data";
import { countryFromPath } from "./country-codes";
import { getAllCountries, getCountry, getEnabledCountries } from "./country";

describe("countries", () => {
  it("have exactly one default country, matching site.config", () => {
    const defaults = getAllCountries().filter((c) => c.default);
    expect(defaults).toHaveLength(1);
    expect(defaults[0]?.code).toBe(siteConfig.defaultCountry);
  });

  it("include every country enabled in site.config", () => {
    expect(getEnabledCountries().map((c) => c.code)).toEqual([...siteConfig.enabledCountries]);
  });

  it("name a national body that exists as an organisation in the same country", () => {
    for (const c of getEnabledCountries()) {
      const body = getOrganisation(c.nationalBody.orgId);
      expect(body?.kind, c.code).toBe("governing_body");
      expect(body?.country).toBe(c.code);
    }
  });

  it("use each country's own membership line", () => {
    expect(getCountry("AU")?.nationalBody.membershipLine).toMatch(/SAFA/);
    expect(getCountry("nz")?.nationalBody.membershipLine).not.toMatch(/SAFA/);
  });

  it("reject a malformed countries.yaml", () => {
    expect(() => countriesFileSchema.parse([{ code: "australia" }])).toThrow();
  });
});

describe("countryFromPath", () => {
  it("finds the country segment on country pages only", () => {
    expect(countryFromPath("/au/clubs/")).toBe("au");
    expect(countryFromPath("/nz")).toBe("nz");
    expect(countryFromPath("/about/")).toBeUndefined();
    expect(countryFromPath("/")).toBeUndefined();
  });
});
