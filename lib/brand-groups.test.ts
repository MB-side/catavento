import { describe, expect, it } from "vitest";
import { groupBrands, sortMakes } from "./brand-groups";
import type { BrandMake } from "./types";

const b = (name: string, makes?: BrandMake[]) => ({ name, makes });

describe("groupBrands", () => {
  it("puts a brand in every group it makes something for, A to Z, and drops empty groups", () => {
    const groups = groupBrands([
      b("Zeta", ["paragliders", "reserves"]),
      b("Alpha", ["paragliders"]),
      b("Motor", ["engines"]),
      b("Unknown"),
    ]);
    expect(groups.map((g) => g.key)).toEqual(["paragliders", "harnesses-reserves", "paramotoring"]);
    expect(groups[0]?.brands.map((x) => x.name)).toEqual(["Alpha", "Zeta"]);
    expect(groups[1]?.brands.map((x) => x.name)).toEqual(["Zeta"]);
    expect(groups.flatMap((g) => g.brands).some((x) => x.name === "Unknown")).toBe(false);
  });

  it("counts paramotor wings as paramotoring", () => {
    expect(groupBrands([b("Wing", ["paramotor-wings"])]).map((g) => g.key)).toEqual([
      "paramotoring",
    ]);
  });
});

describe("sortMakes", () => {
  it("orders labels to match the groups", () => {
    expect(sortMakes(["speed-wings", "reserves", "paragliders"])).toEqual([
      "paragliders",
      "reserves",
      "speed-wings",
    ]);
  });
});
