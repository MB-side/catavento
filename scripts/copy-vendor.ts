// Copies browser files that a dependency loads at run time into public/vendor/, so they ship with the
// static site and always match the installed version (D92). Run before `next dev` and `next build`.
//   MapLibre 6 runs its map work in a separate worker script, which it can't find inside our bundle.
import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const out = path.join(process.cwd(), "public", "vendor");
mkdirSync(out, { recursive: true });
copyFileSync(
  path.join(process.cwd(), "node_modules", "maplibre-gl", "dist", "maplibre-gl-worker.mjs"),
  path.join(out, "maplibre-gl-worker.js"),
);
console.log("copy-vendor: maplibre-gl-worker.js");
