// Where a map opens (D90). A country's sites can include far-off territories (France's include
// Réunion and the Caribbean), which would zoom the map out to the whole world. Pure functions.

export interface LatLon {
  lat: number;
  lon: number;
}

const CELL = 10; // degrees
const REACH = 2; // cells: groups closer than about 20 to 30 degrees join up

/**
 * The points in the largest geographic group: points are bucketed into 10-degree cells, and cells
 * within two cells of each other join the same group. Whole countries stay whole (Perth joins
 * eastern Australia); far territories (Réunion for France, Hawaii for the US) don't.
 */
export function mainGroup<T extends LatLon>(points: T[]): T[] {
  if (points.length < 2) return points;
  const key = (p: LatLon) => `${Math.floor(p.lon / CELL)},${Math.floor(p.lat / CELL)}`;
  const cells = new Map<string, T[]>();
  for (const p of points) cells.set(key(p), [...(cells.get(key(p)) ?? []), p]);
  const keys = [...cells.keys()];
  const xy = new Map(keys.map((k) => [k, k.split(",").map(Number) as [number, number]]));
  const group = new Map<string, number>();
  let next = 0;
  for (const start of keys) {
    if (group.has(start)) continue;
    const id = next++;
    group.set(start, id);
    const queue = [start];
    while (queue.length > 0) {
      const [x, y] = xy.get(queue.pop() as string) as [number, number];
      for (const k of keys) {
        const [cx, cy] = xy.get(k) as [number, number];
        if (!group.has(k) && Math.abs(cx - x) <= REACH && Math.abs(cy - y) <= REACH) {
          group.set(k, id);
          queue.push(k);
        }
      }
    }
  }
  const sizes = new Map<number, number>();
  for (const [k, id] of group) sizes.set(id, (sizes.get(id) ?? 0) + (cells.get(k)?.length ?? 0));
  const biggest = [...sizes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  return points.filter((p) => group.get(key(p)) === biggest);
}
