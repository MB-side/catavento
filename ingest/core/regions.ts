// Which state or region a point is in, from Natural Earth boundaries (public domain) stored in
// data/boundaries. Works offline: no lookup service is called (Nominatim's robots.txt forbids
// automated reverse lookups, so we don't use it).
import { readFileSync } from "node:fs";
import path from "node:path";
import { distanceKm, type LatLon } from "@/lib/geo";

type Ring = [number, number][];
interface RegionShape {
  code: string;
  polygons: Ring[][];
}

/** Ray casting on [lon, lat] rings; holes (rings after the first) are subtracted. */
function inRing(lon: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i] as [number, number];
    const [xj, yj] = ring[j] as [number, number];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function inPolygon(p: LatLon, polygon: Ring[]): boolean {
  const [outer, ...holes] = polygon;
  if (!outer || !inRing(p.lon, p.lat, outer)) return false;
  return !holes.some((h) => inRing(p.lon, p.lat, h));
}

export class RegionLookup {
  constructor(private readonly shapes: RegionShape[]) {}

  static fromFile(
    file = path.join(process.cwd(), "data", "boundaries", "regions-au-nz.geojson"),
  ): RegionLookup {
    const fc = JSON.parse(readFileSync(file, "utf8")) as {
      features: { properties: { code: string }; geometry: { coordinates: Ring[][] } }[];
    };
    return new RegionLookup(
      fc.features.map((f) => ({ code: f.properties.code, polygons: f.geometry.coordinates })),
    );
  }

  /**
   * The region containing the point, limited to `allowed` codes (from countries.yaml). Points just
   * off a simplified coastline (beach and cliff launches) fall back to the nearest region within
   * `maxKm`.
   */
  regionFor(p: LatLon, allowed: ReadonlySet<string>, maxKm = 25): string | undefined {
    const candidates = this.shapes.filter((s) => allowed.has(s.code));
    const hit = candidates.find((s) => s.polygons.some((poly) => inPolygon(p, poly)));
    if (hit) return hit.code;
    let best: { code: string; km: number } | undefined;
    for (const s of candidates) {
      for (const poly of s.polygons) {
        for (const [lon, lat] of poly[0] ?? []) {
          const km = distanceKm(p, { lat, lon });
          if (!best || km < best.km) best = { code: s.code, km };
        }
      }
    }
    return best && best.km <= maxKm ? best.code : undefined;
  }
}
