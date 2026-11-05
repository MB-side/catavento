// Brands grouped by what they make (founder request, D98), so people can find the brands for their
// kind of flying or the gear they need. Facts only, from each brand's own website: no rankings.
import type { Brand, BrandMake } from "./types";

export type BrandGroupKey =
  | "paragliders"
  | "harnesses-reserves"
  | "hang-gliders"
  | "paramotoring"
  | "speed-wings"
  | "instruments"
  | "radios"
  | "helmets"
  | "accessories"
  | "microlight";

export interface BrandGroup {
  key: BrandGroupKey;
  makes: readonly BrandMake[];
}

/** Main equipment (D95): display order, and what a brand must make to appear in each group. */
export const MAIN_GROUPS: readonly BrandGroup[] = [
  { key: "paragliders", makes: ["paragliders"] },
  { key: "harnesses-reserves", makes: ["harnesses", "reserves"] },
  { key: "hang-gliders", makes: ["hang-gliders"] },
  { key: "paramotoring", makes: ["paramotors", "engines", "paramotor-wings"] },
  { key: "speed-wings", makes: ["speed-wings"] },
];

/** Instruments, radios, helmets and other gear. */
export const OTHER_GROUPS: readonly BrandGroup[] = [
  { key: "instruments", makes: ["instruments"] },
  { key: "radios", makes: ["radios"] },
  { key: "helmets", makes: ["helmets"] },
  { key: "accessories", makes: ["accessories"] },
  { key: "microlight", makes: ["microlight"] },
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
  "instruments",
  "radios",
  "helmets",
  "accessories",
  "microlight",
];

export const sortMakes = (makes: readonly BrandMake[]): BrandMake[] =>
  [...makes].sort((a, b) => MAKES_ORDER.indexOf(a) - MAKES_ORDER.indexOf(b));

/**
 * Each group with its brands, A to Z. A brand appears in every group it makes something for;
 * empty groups are left out.
 */
export function groupBrands<T extends Pick<Brand, "name" | "makes">>(
  brands: readonly T[],
  groups: readonly BrandGroup[] = MAIN_GROUPS,
): { key: BrandGroupKey; brands: T[] }[] {
  return groups
    .map((g) => ({
      key: g.key,
      brands: brands
        .filter((b) => (b.makes ?? []).some((m) => g.makes.includes(m)))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((g) => g.brands.length > 0);
}
