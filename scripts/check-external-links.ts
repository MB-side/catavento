// A non-blocking report of broken outside links (docs/02 §8 M7), checked politely with the same
// fetcher as the collectors: robots.txt obeyed, one request at a time per website, 3 s apart.
// Usage: pnpm check:external   (takes a while: the slowest website sets the pace)
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
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
  const brokenLinks: { url: string; page: string; error: string }[] = [];
  const skipped: string[] = [];
  let done = 0;
  // A network failure (no HTTP answer at all) is often a one-off timeout, so it's retried once,
  // a minute later, before the link counts as broken (D80).
  const attempt = async (url: string): Promise<void> => {
    try {
      await fetcher.get(url);
    } catch (error) {
      if (
        error instanceof RobotsDisallowedError ||
        /^HTTP \d/.test(String((error as Error).message))
      )
        throw error;
      await new Promise((resolve) => setTimeout(resolve, 60_000));
      await fetcher.get(url);
    }
  };
  await Promise.all(
    [...where].map(async ([url, page]) => {
      try {
        await attempt(url);
      } catch (error) {
        if (error instanceof RobotsDisallowedError) skipped.push(url);
        else {
          const message = error instanceof Error ? error.message : String(error);
          broken.push(`${message}  (on /${page})`);
          brokenLinks.push({ url, page, error: message.replace(` for ${url}`, "") });
        }
      }
      if (++done % 50 === 0) console.log(`  ${done} of ${where.size} checked`);
    }),
  );
  for (const b of broken.sort()) console.log(`✗ ${b}`);
  // --json <file>: save the report for the daily health check (D79).
  const jsonIndex = process.argv.indexOf("--json");
  const jsonPath = jsonIndex >= 0 ? process.argv[jsonIndex + 1] : undefined;
  if (jsonPath) {
    mkdirSync(path.dirname(jsonPath), { recursive: true });
    const report = {
      checkedAt: new Date().toISOString(),
      total: where.size,
      broken: brokenLinks.sort((a, b) => a.url.localeCompare(b.url)),
    };
    writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  }
  console.log(
    `check-external: ${where.size} outside links, ${broken.length} broken, ${skipped.length} not checked (robots.txt).`,
  );
}

void main();
