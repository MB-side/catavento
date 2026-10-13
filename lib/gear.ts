// Gear categories (founder request, D73): what each shop says it sells, so people can find a shop
// for a vario, a pod harness or a wing. Shared by the build, the shops page and search.
import type { GearCategory } from "./types";

export type { GearCategory };

export const GEAR_CATEGORIES: readonly GearCategory[] = [
  "paragliders",
  "mini-speed-wings",
  "paramotors",
  "hang-gliders",
  "trikes",
  "harnesses",
  "pod-harnesses",
  "reserves",
  "instruments",
  "helmets-accessories",
  "service",
];

/** Extra words people search with, for each category (search only; never shown as claims). */
export const GEAR_SEARCH_WORDS: Record<GearCategory, string> = {
  paragliders: "paraglider wing glider canopy EN-A EN-B EN-C EN-D",
  "mini-speed-wings": "mini wing speed wing speedflying",
  paramotors: "paramotor PPG paramotor wing motor",
  "hang-gliders": "hang glider delta",
  trikes: "trike microlight weight-shift",
  harnesses: "harness",
  "pod-harnesses": "pod harness cocoon",
  reserves: "reserve parachute rescue",
  instruments: "instrument vario variometer GPS radio flight computer",
  "helmets-accessories": "helmet accessories speed bar carabiner",
  service: "service repair check line trim reserve repack",
};
