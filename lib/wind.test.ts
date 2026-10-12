import { describe, expect, it } from "vitest";
import { classifyWind, compassPoint, distanceToArc, mergeArcs, parseWindRange } from "./wind";

describe("parseWindRange: docs/05 §5.1 examples", () => {
  it.each([
    ["North East", [{ fromDeg: 22.5, toDeg: 67.5 }], "NNE–ENE"],
    ["South to South East", [{ fromDeg: 135, toDeg: 180 }], "S–SE"],
    ["E-NE", [{ fromDeg: 45, toDeg: 90 }], "E–NE"],
    ["SSW to SSE", [{ fromDeg: 157.5, toDeg: 202.5 }], "SSW–SSE"],
    ["NW- WSW (best WNW)", [{ fromDeg: 247.5, toDeg: 315 }], "NW–WSW"],
  ])("%s", (text, ranges, label) => {
    expect(parseWindRange(text)).toEqual({ ranges, label, parsed: true });
  });

  it("reads All, Any and Various as every direction", () => {
    for (const t of ["All", "any", "Various"]) {
      expect(parseWindRange(t)).toEqual({ ranges: "all", label: "All", parsed: true });
    }
  });
});

describe("parseWindRange: more forms from the Site Guide", () => {
  it("wraps through north", () => {
    expect(parseWindRange("NW-NE").ranges).toEqual([{ fromDeg: 315, toDeg: 45 }]);
  });

  it("merges neighbouring points into one arc", () => {
    expect(parseWindRange("W,SW").ranges).toEqual([{ fromDeg: 202.5, toDeg: 292.5 }]);
  });

  it("keeps separate arcs apart", () => {
    expect(parseWindRange("N, S").ranges).toEqual([
      { fromDeg: 157.5, toDeg: 202.5 },
      { fromDeg: 337.5, toDeg: 22.5 },
    ]);
  });

  it("gives 16-point names a narrower arc", () => {
    expect(parseWindRange("NNE")).toEqual({
      ranges: [{ fromDeg: 11.25, toDeg: 33.75 }],
      label: "NNE",
      parsed: true,
    });
  });

  it("follows a sweep through three or more points", () => {
    expect(parseWindRange("SW-W-NW")).toEqual({
      ranges: [{ fromDeg: 225, toDeg: 315 }],
      label: "SW–W–NW",
      parsed: true,
    });
    expect(parseWindRange("SW-S-SE").ranges).toEqual([{ fromDeg: 135, toDeg: 225 }]);
    expect(parseWindRange("SW-NW-NE").ranges).toEqual([{ fromDeg: 225, toDeg: 45 }]);
    expect(parseWindRange("S - SSW - SW").ranges).toEqual([{ fromDeg: 180, toDeg: 225 }]);
  });

  it("ignores speed and launch notes after the directions", () => {
    expect(parseWindRange("NW at 10-15kn").ranges).toEqual([{ fromDeg: 292.5, toDeg: 337.5 }]);
    expect(parseWindRange("ESE to ENE, soarable over 10 knots").ranges).toEqual([
      { fromDeg: 67.5, toDeg: 112.5 },
    ]);
    expect(parseWindRange("N-NE Launch").ranges).toEqual([{ fromDeg: 0, toDeg: 45 }]);
    expect(parseWindRange("S - SSE (175° – 135° True), soarable over 10 knots").ranges).toEqual([
      { fromDeg: 157.5, toDeg: 180 },
    ]);
    expect(
      parseWindRange("E to ENE (Ideally ENE 10 knots) • Soarable over 10 knots").ranges,
    ).toEqual([{ fromDeg: 67.5, toDeg: 90 }]);
  });

  it("never guesses from prose", () => {
    for (const t of [
      "Main ridge SW-SE, small W face. Best ridge lift in due S.",
      "Good for afternoon sea breeze",
      "West; HG < 15 knots, PG < 10 knots",
      "Several. E/NE, ~150m height difference",
      "PG SE to ENE 5-15kt / HG: ESE through to ENE 4-20kt.",
      "",
      undefined,
    ]) {
      expect(parseWindRange(t)).toEqual({
        ranges: [],
        label: "See official details",
        parsed: false,
      });
    }
  });
});

describe("mergeArcs", () => {
  it("joins an arc that wraps onto the first one", () => {
    expect(
      mergeArcs([
        { fromDeg: 0, toDeg: 30 },
        { fromDeg: 330, toDeg: 360 },
      ]),
    ).toEqual([{ fromDeg: 330, toDeg: 30 }]);
  });
});

describe("classifyWind (docs/02 §5.3)", () => {
  const ne = [{ fromDeg: 22.5, toDeg: 67.5 }];

  it("calls under 5 km/h light, whatever the direction", () => {
    expect(classifyWind(45, 4.9, ne)).toBe("light");
  });

  it("separates within, marginal (≤ 22.5° outside) and outside", () => {
    expect(classifyWind(45, 20, ne)).toBe("within");
    expect(classifyWind(22.5, 20, ne)).toBe("within");
    expect(classifyWind(80, 20, ne)).toBe("marginal");
    expect(classifyWind(90, 20, ne)).toBe("marginal");
    expect(classifyWind(91, 20, ne)).toBe("outside");
    expect(classifyWind(359, 20, ne)).toBe("outside");
  });

  it("handles ranges that wrap through north", () => {
    const north = [{ fromDeg: 315, toDeg: 45 }];
    expect(classifyWind(0, 15, north)).toBe("within");
    expect(classifyWind(300, 15, north)).toBe("marginal");
    expect(classifyWind(180, 15, north)).toBe("outside");
  });

  it("treats 'all' as within and an unknown range as outside", () => {
    expect(classifyWind(200, 15, "all")).toBe("within");
    expect(classifyWind(200, 15, [])).toBe("outside");
  });
});

describe("helpers", () => {
  it("measures distance to an arc", () => {
    expect(distanceToArc(10, { fromDeg: 22.5, toDeg: 67.5 })).toBe(12.5);
    expect(distanceToArc(50, { fromDeg: 22.5, toDeg: 67.5 })).toBe(0);
  });

  it("names bearings", () => {
    expect(compassPoint(0)).toBe("N");
    expect(compassPoint(68)).toBe("ENE");
    expect(compassPoint(359)).toBe("N");
  });
});
