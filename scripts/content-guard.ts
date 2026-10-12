// Fails the build if any page in out/ contains banned wording (see scripts/lib/content-guard.ts).
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { checkHtml } from "./lib/content-guard";

const OUT_DIR = path.join(process.cwd(), "out");

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return name === "_next" ? [] : htmlFiles(full);
    return name.endsWith(".html") ? [full] : [];
  });
}

const files = htmlFiles(OUT_DIR);
if (files.length === 0) {
  console.error("content-guard: no HTML files in out/. Run the build first.");
  process.exit(1);
}

let failures = 0;
for (const file of files) {
  for (const hit of checkHtml(readFileSync(file, "utf8"))) {
    failures++;
    console.error(`✗ ${path.relative(OUT_DIR, file)}: ${hit.why}\n    …${hit.excerpt}…`);
  }
}

if (failures > 0) {
  console.error(`content-guard: ${failures} problem(s) in ${files.length} pages.`);
  process.exit(1);
}
console.log(`content-guard: ${files.length} pages checked, no banned wording.`);
