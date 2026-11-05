// Main equipment brands grouped by what they make (founder request, D98), so people can find the
// brands for their kind of flying. Facts only, from each brand's own website: no rankings.
import type { Brand, BrandMake } from "./types";

export type BrandGroupKey =
  "paragliders" | "harnesses-reserves" | "hang-gliders" | "paramotoring" | "speed-wings";

/** Display order of the groups, and what a brand must make to appear in each. */
export const BRAND_GROUPS: readonly { key: BrandGroupKey; makes: readonly BrandMake[] }[] = [
  { key: "paragliders", makes: ["paragliders"] },
  { key: "harnesses-reserves", makes: ["harnesses", "reserves"] },
  { key: "hang-gliders", makes: ["hang-gliders"] },
  { key: "paramotoring", makes: ["paramotors", "engines", "paramotor-wings"] },
  { key: "speed-wings", makes: ["speed-wings"] },
];

/** Order the "makes" labels on a brand card, matching the groups. */
export const MAKES_ORDER: readonly BrandMake[] = [
  "paragliders",
  "harnesses",
  "reserves",
  "hang-gliders",
  "paramotors",
  "engines",
  "paramotor-wings",
  "speed-wings",
];

export const sortMakes = (makes: readonly BrandMake[]): BrandMake[] =>
  [...makes].sort((a, b) => MAKES_ORDER.indexOf(a) - MAKES_ORDER.indexOf(b));

/**
 * Each group with its brands, A to Z. A brand appears in every group it makes something for;
 * empty groups are left out.
 */
export function groupBrands<T extends Pick<Brand, "name" | "makes">>(
  brands: readonly T[],
): { key: BrandGroupKey; brands: T[] }[] {
  return BRAND_GROUPS.map((g) => ({
    key: g.key,
    brands: brands
      .filter((b) => (b.makes ?? []).some((m) => g.makes.includes(m)))
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((g) => g.brands.length > 0);
}
