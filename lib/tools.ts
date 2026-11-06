// Pilot tools (D99): the order of the groups on the Pilot tools page, and the Paraglidable link
// that opens its map over a European country.
import type { PilotTool, ToolGroup } from "./types";

export const TOOL_GROUPS: readonly ToolGroup[] = [
  "forecasts",
  "live-wind",
  "sites",
  "flights",
  "airspace",
  "logbooks",
  "travel",
  "learning",
];

/** Tools by group, in display order and file order within each; empty groups left out. */
export function groupTools(tools: readonly PilotTool[]): { key: ToolGroup; tools: PilotTool[] }[] {
  return TOOL_GROUPS.map((key) => ({ key, tools: tools.filter((x) => x.group === key) })).filter(
    (g) => g.tools.length > 0,
  );
}

const round = (n: number) => Number(n.toFixed(4));

/**
 * Paraglidable's forecast map, centred on a point (its own link format). It covers Europe only:
 * checked 2026-11-06, it showed nothing for Australia or New Zealand.
 */
export const paraglidableHref = (lat: number, lon: number, zoom = 6): string =>
  `https://paraglidable.com/?lat=${round(lat)}&lon=${round(lon)}&zoom=${zoom}`;

/** The middle of a set of points (their average), or undefined for none. */
export function centreOf(
  points: readonly { lat: number; lon: number }[],
): { lat: number; lon: number } | undefined {
  if (points.length === 0) return undefined;
  const sum = points.reduce((a, p) => ({ lat: a.lat + p.lat, lon: a.lon + p.lon }), {
    lat: 0,
    lon: 0,
  });
  return { lat: sum.lat / points.length, lon: sum.lon / points.length };
}
