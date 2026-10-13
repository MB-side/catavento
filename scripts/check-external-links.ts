// A non-blocking report of broken outside links (docs/02 §8 M7), checked politely with the same
// fetcher as the collectors: robots.txt obeyed, one request at a time per website, 3 s apart.
// Usage: pnpm check:external   (takes a while: the slowest website sets the pace)
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { PoliteFetcher, RobotsDisallowedError } from "../ingest/core/fetcher";
import { siteConfig } from "../site.config";

// Our own pages, the shared Google Forms and red-tier hosts (never visited) are skipped.
const SKIP = [
  new URL(siteConfig.siteUrl).host,
  "docs.google.com",
  "www.facebook.com",
  "m.facebook.com",
  "facebook.com",
];

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? htmlFiles(p) : p.endsWith(".html") ? [p] : [];
  });
}

async function main(): Promise<void> {
  const where = new Map<string, string>();
  for (const file of htmlFiles("out")) {
    for (const m of readFileSync(file, "utf8").matchAll(/href="(https?:\/\/[^"]+)"/g)) {
      const url = (m[1] as string).replace(/&amp;/g, "&");
      if (!SKIP.includes(new URL(url).host) && !where.has(url))
        where.set(url, path.relative("out", file));
    }
  }
  const fetcher = new PoliteFetcher();
  const broken: string[] = [];
  const skipped: string[] = [];
  let done = 0;
  await Promise.all(
    [...where].map(async ([url, page]) => {
      try {
        await fetcher.get(url);
      } catch (error) {
        if (error instanceof RobotsDisallowedError) skipped.push(url);
        else
          broken.push(`${error instanceof Error ? error.message : String(error)}  (on /${page})`);
      }
      if (++done % 50 === 0) console.log(`  ${done} of ${where.size} checked`);
    }),
  );
  for (const b of broken.sort()) console.log(`✗ ${b}`);
  console.log(
    `check-external: ${where.size} outside links, ${broken.length} broken, ${skipped.length} not checked (robots.txt).`,
  );
}

void main();
