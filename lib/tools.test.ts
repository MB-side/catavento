import { describe, expect, it } from "vitest";
import { centreOf, groupTools, paraglidableHref } from "./tools";
import type { PilotTool } from "./types";

const tool = (name: string, group: PilotTool["group"]): PilotTool => ({
  id: `tool:${name.toLowerCase()}`,
  name,
  url: "https://example.com/",
  group,
  summary: "x",
  checked: "2026-11-06",
});

describe("groupTools", () => {
  it("orders groups for the page, keeps file order inside each, and drops empty groups", () => {
    const groups = groupTools([
      tool("Log", "logbooks"),
      tool("B", "forecasts"),
      tool("A", "forecasts"),
    ]);
    expect(groups.map((g) => g.key)).toEqual(["forecasts", "logbooks"]);
    expect(groups[0]?.tools.map((x) => x.name)).toEqual(["B", "A"]);
  });
});

describe("Paraglidable links", () => {
  it("centre the map on a point, rounded to four decimals", () => {
    expect(paraglidableHref(46.123456, 8.987654)).toBe(
      "https://paraglidable.com/?lat=46.1235&lon=8.9877&zoom=6",
    );
  });
  it("find the middle of a set of points", () => {
    expect(
      centreOf([
        { lat: 44, lon: 6 },
        { lat: 48, lon: 8 },
      ]),
    ).toEqual({ lat: 46, lon: 7 });
    expect(centreOf([])).toBeUndefined();
  });
});
