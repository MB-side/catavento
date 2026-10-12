import { describe, expect, it } from "vitest";
import { distanceKm, distanceM } from "./geo";

describe("distance", () => {
  it("is zero for the same point and symmetric", () => {
    const a = { lat: -33.74, lon: 151.31 };
    expect(distanceKm(a, a)).toBe(0);
    const b = { lat: -34.19, lon: 150.98 };
    expect(distanceKm(a, b)).toBeCloseTo(distanceKm(b, a), 9);
  });

  it("matches known distances", () => {
    // Sydney to Melbourne CBD is about 714 km.
    expect(
      distanceKm({ lat: -33.8688, lon: 151.2093 }, { lat: -37.8136, lon: 144.9631 }),
    ).toBeCloseTo(714, -1);
    // 0.001° of latitude is about 111 m.
    expect(distanceM({ lat: -30, lon: 150 }, { lat: -30.001, lon: 150 })).toBeCloseTo(111, 0);
  });
});
