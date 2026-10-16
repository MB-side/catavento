import { describe, expect, it } from "vitest";
import { mainGroup } from "./map-view";

const p = (lat: number, lon: number) => ({ lat, lon });

describe("mainGroup", () => {
  it("leaves out far territories, such as France's Réunion and Caribbean sites", () => {
    const mainland = [p(45.9, 6.1), p(43.1, -0.6), p(48.8, 2.3), p(44.6, 6.4)];
    const overseas = [p(-21.1, 55.5), p(16.2, -61.6)];
    expect(mainGroup([...mainland, ...overseas])).toEqual(mainland);
  });
  it("keeps a whole country together, such as Perth with eastern Australia", () => {
    const au = [
      p(-31.9, 115.9),
      p(-34.9, 138.6),
      p(-33.9, 151.2),
      p(-27.5, 153.0),
      p(-42.9, 147.3),
    ];
    expect(mainGroup(au)).toEqual(au);
  });
  it("returns small lists unchanged", () => {
    expect(mainGroup([p(1, 1)])).toEqual([p(1, 1)]);
    expect(mainGroup([])).toEqual([]);
  });
});
