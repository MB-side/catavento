import { describe, expect, it } from "vitest";
import { siteConfig } from "@/site.config";
import { countryFromPath } from "./country-codes";
import { getAllCountries, getCountry, getEnabledCountries, parseCountries } from "./country";

describe("countries.yaml", () => {
  it("is valid and has exactly one default country, matching site.config", () => {
    const countries = getAllCountries();
    const defaults = countries.filter((c) => c.default);
    expect(defaults).toHaveLength(1);
    expect(defaults[0]?.code).toBe(siteConfig.defaultCountry);
  });

  it("contains every country enabled in site.config", () => {
    const codes = getEnabledCountries().map((c) => c.code);
    expect(codes).toEqual([...siteConfig.enabledCountries]);
  });

  it("maps the national body legacy ID to orgId and drops empty URLs", () => {
    const au = getCountry("au");
    expect(au?.nationalBody.orgId).toBe("GOV-001");
    expect(au?.nationalBody.joinUrl).toBeUndefined();
  });

  it("uses each country's own membership line", () => {
    expect(getCountry("AU")?.nationalBody.membershipLine).toMatch(/SAFA/);
    expect(getCountry("NZ")?.nationalBody.membershipLine).not.toMatch(/SAFA/);
  });

  it("rejects a malformed file", () => {
    expect(() => parseCountries("- code: australia\n")).toThrow();
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
