// Wind ranges and classification (docs/05 §5.1–5.2, docs/02 §5.3). Shared by ingest and the UI;
// pure functions only. Bearings are degrees clockwise from north; an arc runs clockwise from
// `fromDeg` to `toDeg` and may wrap through north (e.g. 337.5 → 22.5).
import type { WindArc } from "./types";

const POINTS_16 = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
] as const;
type Point = (typeof POINTS_16)[number];

/** The 16 compass points, clockwise from north, for direction pickers. */
export const COMPASS_POINTS: readonly string[] = POINTS_16;

/** Whether a site's published range takes a wind from this bearing (inside an arc, or "all"). */
export function takesWindFrom(ranges: WindArc[] | "all", bearing: number): boolean {
  return ranges === "all" || ranges.some((a) => distanceToArc(bearing, a) === 0);
}

const BEARING = new Map<string, number>(POINTS_16.map((p, i) => [p, i * 22.5]));
const EIGHT_POINT = new Set(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]);

const WORDS: [RegExp, string][] = [
  [/\bnorth\s*-?\s*north\s*-?\s*east\b/g, "NNE"],
  [/\beast\s*-?\s*north\s*-?\s*east\b/g, "ENE"],
  [/\beast\s*-?\s*south\s*-?\s*east\b/g, "ESE"],
  [/\bsouth\s*-?\s*south\s*-?\s*east\b/g, "SSE"],
  [/\bsouth\s*-?\s*south\s*-?\s*west\b/g, "SSW"],
  [/\bwest\s*-?\s*south\s*-?\s*west\b/g, "WSW"],
  [/\bwest\s*-?\s*north\s*-?\s*west\b/g, "WNW"],
  [/\bnorth\s*-?\s*north\s*-?\s*west\b/g, "NNW"],
  [/\bnorth\s*-?\s*east\w*/g, "NE"],
  [/\bsouth\s*-?\s*east\w*/g, "SE"],
  [/\bsouth\s*-?\s*west\w*/g, "SW"],
  [/\bnorth\s*-?\s*west\w*/g, "NW"],
  [/\bnorth\w*/g, "N"],
  [/\beast\w*/g, "E"],
  [/\bsouth\w*/g, "S"],
  [/\bwest\w*/g, "W"],
];

export interface ParsedWind {
  ranges: WindArc[] | "all";
  label: string;
  parsed: boolean;
}

export const UNPARSED_LABEL = "See official details";

const norm = (deg: number) => ((deg % 360) + 360) % 360;

/** Clockwise distance from a to b, 0–360. */
const cw = (a: number, b: number) => norm(b - a);

function pointArc(p: Point): WindArc {
  const half = EIGHT_POINT.has(p) ? 22.5 : 11.25;
  const b = BEARING.get(p) ?? 0;
  return { fromDeg: norm(b - half), toDeg: norm(b + half) };
}

/** The shorter way round between two bearings, no padding (docs/05 §5.1). */
function rangeArc(a: Point, b: Point): WindArc {
  const ba = BEARING.get(a) ?? 0;
  const bb = BEARING.get(b) ?? 0;
  return cw(ba, bb) <= 180 ? { fromDeg: ba, toDeg: bb } : { fromDeg: bb, toDeg: ba };
}

/** "NNW–ESE, SSW" style label for arcs, naming each end by its nearest 16-point direction. */
export function labelArcs(arcs: WindArc[] | "all"): string {
  if (arcs === "all") return "All";
  return arcs.map((a) => `${nameAt(a.fromDeg, "from")}–${nameAt(a.toDeg, "to")}`).join(", ");
}

/**
 * The nearest 16-point name. An arc end exactly halfway between two names is named inward
 * (`end` "from" rounds clockwise, "to" anticlockwise), so a label never claims more than the arc.
 */
function nameAt(deg: number, end?: "from" | "to"): string {
  const x = norm(deg) / 22.5;
  const half = Math.abs(x - Math.floor(x) - 0.5) < 1e-9;
  const i =
    (half && end === "from" ? Math.ceil(x) : half && end === "to" ? Math.floor(x) : Math.round(x)) %
    16;
  return POINTS_16[i] ?? "N";
}

/** Arcs that together cover every direction, e.g. all eight compass points. */
export function coversAll(arcs: WindArc[]): boolean {
  const merged = mergeArcs(arcs);
  return merged.length === 1 && merged[0]?.fromDeg === 0 && merged[0]?.toDeg === 360;
}

/** Merges overlapping or touching arcs on the circle. A full circle comes back as 0–360. */
export function mergeArcs(arcs: WindArc[]): WindArc[] {
  if (arcs.length <= 1) return arcs;
  // Unroll each arc into [start, end] with end >= start, then merge on a line, then wrap.
  const spans = arcs
    .map((a) => [a.fromDeg, a.fromDeg + (cw(a.fromDeg, a.toDeg) || 360)] as [number, number])
    .sort((x, y) => x[0] - y[0]);
  const merged: [number, number][] = [];
  for (const s of spans) {
    const last = merged.at(-1);
    if (last && s[0] <= last[1]) last[1] = Math.max(last[1], s[1]);
    else merged.push([...s]);
  }
  // Join the last span with the first if it wraps past 360 onto it.
  const first = merged[0];
  const last = merged.at(-1);
  if (merged.length > 1 && first && last && last[1] - 360 >= first[0]) {
    first[0] = last[0] - 360;
    first[1] = Math.max(first[1], last[1] - 360);
    merged.pop();
  }
  if (merged.some(([a, b]) => b - a >= 360)) return [{ fromDeg: 0, toDeg: 360 }];
  return merged.map(([a, b]) => ({ fromDeg: norm(a), toDeg: norm(b) }));
}

/**
 * Reads a published wind-direction text, e.g. "North East", "S to SE", "NW- WSW (best WNW)",
 * "W, SW", "All", "NNE-E.", "SE but will tolerate ESE". Speed notes are dropped (speeds are never
 * judged). Text that isn't purely directions (prose) is not guessed at: it returns no ranges and the
 * label "See official details" (docs/05 §5.1). Also refused: separate directions for paragliders
 * and hang gliders ("PG SE to ENE / HG ESE to ENE"), and "light" qualifiers ("E or light NE"),
 * since the outlook judges direction only.
 */
export function parseWindRange(text: string | undefined): ParsedWind {
  const unparsed: ParsedWind = { ranges: [], label: UNPARSED_LABEL, parsed: false };
  if (!text) return unparsed;
  let t = text
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/\([^)]*\)/g, " ")
    .trim();
  if (/\b(pg|hg)\b\s*:?\s*(n|s|e|w|north|south|east|west)/.test(t)) return unparsed;
  if (
    /^(all|any|various)\b[\s\w]*$/.test(t) &&
    !/\b(n|e|s|w)\b/.test(t.replace(/^(all|any|various)/, ""))
  ) {
    return { ranges: "all", label: "All", parsed: true };
  }
  // Drop speed and launch notes that follow the directions, e.g. "NW at 10-15kn",
  // "ESE to ENE, soarable over 10 knots", "N-NE Launch". Anything else left over means prose.
  t = t
    .replace(/\++/g, " ")
    .replace(/[<>~]?\s*\d+(\.\d+)?\s*((-|to)\s*\d+(\.\d+)?)?\s*(knots|kts?|kn|km\/?h|kmh|°)/g, " ")
    .replace(/\bup to\b/g, " ")
    .replace(/\b(but|or)\b/g, ",")
    .replace(/[.:]/g, " ")
    .replace(
      /\b(soarable|ideal(ly)?|launch(es)?|faces?|at|over|under|true|hg|pg|strength|thermic|possible|maximum|minimum|various|is|can|take|will|tolerate)\b/g,
      " ",
    );
  for (const [re, p] of WORDS) t = t.replace(re, ` ${p} `);
  t = t
    .replace(/\bthrough\b|\bto\b|–|—/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  const parts = t
    .split(/,|;|\/|&|•|\band\b/)
    .map((s) => s.trim().replace(/^-+\s*|\s*-+$/g, ""))
    .filter(Boolean);
  if (parts.length === 0) return unparsed;

  const arcs: WindArc[] = [];
  const labels: string[] = [];
  for (const part of parts) {
    // A sweep through three or more points, e.g. "SW-W-NW": from the first to the last, the way
    // that passes through the middle ones.
    const chain = part.split(/\s*-\s*/).map((x) => x.toUpperCase());
    if (chain.length >= 3) {
      const pts = chain as Point[];
      if (!pts.every((x) => BEARING.has(x))) return unparsed;
      const first = BEARING.get(pts[0] as Point) ?? 0;
      const last = BEARING.get(pts[pts.length - 1] as Point) ?? 0;
      const middle = pts.slice(1, -1).map((x) => BEARING.get(x) ?? 0);
      const span = cw(first, last);
      const clockwise = middle.every((m) => cw(first, m) <= span);
      const anticlockwise = middle.every((m) => cw(last, m) <= cw(last, first));
      if (clockwise === anticlockwise) return unparsed; // ambiguous or contradictory
      arcs.push(clockwise ? { fromDeg: first, toDeg: last } : { fromDeg: last, toDeg: first });
      labels.push(pts.join("–"));
      continue;
    }
    const range = /^([a-z]{1,3})\s*-\s*([a-z]{1,3})$/i.exec(part);
    if (range) {
      const a = range[1]?.toUpperCase() as Point;
      const b = range[2]?.toUpperCase() as Point;
      if (!BEARING.has(a) || !BEARING.has(b)) return unparsed;
      arcs.push(rangeArc(a, b));
      labels.push(`${a}–${b}`);
      continue;
    }
    const p = part.toUpperCase() as Point;
    if (!/^[A-Z]{1,3}$/.test(p) || !BEARING.has(p)) return unparsed;
    const arc = pointArc(p);
    arcs.push(arc);
    labels.push(EIGHT_POINT.has(p) ? `${nameAt(arc.fromDeg)}–${nameAt(arc.toDeg)}` : p);
  }
  const merged = mergeArcs(arcs);
  if (coversAll(arcs)) return { ranges: "all", label: "All", parsed: true };
  // Several pieces that join up are labelled as the arcs they make, e.g. "N, NE, E" → "NNW–ESE".
  const label =
    parts.length > 1 && merged.length < arcs.length ? labelArcs(merged) : labels.join(", ");
  return { ranges: merged, label, parsed: true };
}

export type WindClass = "within" | "marginal" | "outside" | "light";

/** Smallest angle from a bearing to an arc (0 when inside). */
export function distanceToArc(dir: number, arc: WindArc): number {
  const d = norm(dir);
  if (cw(arc.fromDeg, d) <= cw(arc.fromDeg, arc.toDeg)) return 0;
  return Math.min(cw(d, arc.fromDeg), cw(arc.toDeg, d));
}

export const LIGHT_WIND_KMH = 5;
export const MARGINAL_DEG = 22.5;

/**
 * Forecast direction vs the published range (docs/02 §5.3). Never judges speed beyond calling
 * under 5 km/h "light" (direction not meaningful).
 */
export function classifyWind(
  dirDeg: number,
  speedKmh: number,
  ranges: WindArc[] | "all",
  /** Directions a source rates "possible" rather than good: marginal, never within (D81). */
  marginal: WindArc[] = [],
): WindClass {
  if (speedKmh < LIGHT_WIND_KMH) return "light";
  if (ranges === "all") return "within";
  const nearest = ranges.length
    ? Math.min(...ranges.map((r) => distanceToArc(dirDeg, r)))
    : Infinity;
  if (nearest === 0) return "within";
  if (marginal.some((r) => distanceToArc(dirDeg, r) === 0)) return "marginal";
  return nearest <= MARGINAL_DEG ? "marginal" : "outside";
}

/** "NE", "SSW"… for a bearing (16-point). */
export function compassPoint(deg: number): string {
  return nameAt(deg);
}
