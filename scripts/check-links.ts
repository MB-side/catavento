// Crawls the built site and fails on broken internal links (docs/03 §8).
// External links are skipped; a non-blocking external report is added before consultation (M7).
import { LinkChecker } from "linkinator";
import { siteConfig } from "../site.config";
import { startStaticServer } from "./lib/static-server";

async function main(): Promise<number> {
  const port = 4174;
  const start = `http://localhost:${port}${siteConfig.basePath}/`;
  const server = await startStaticServer({ root: "out", basePath: siteConfig.basePath, port });

  const checker = new LinkChecker();
  const result = await checker.check({
    path: start,
    recurse: true,
    linksToSkip: (link: string) => Promise.resolve(!link.startsWith(`http://localhost:${port}`)),
  });
  server.close();

  const broken = result.links.filter((l) => l.state === "BROKEN");
  for (const link of broken) {
    console.error(`✗ ${link.status ?? "?"} ${link.url}  (on ${link.parent ?? "start page"})`);
  }
  console.log(
    `check-links: ${result.links.length} internal links checked, ${broken.length} broken.`,
  );
  return broken.length > 0 ? 1 : 0;
}

void main().then((code) => process.exit(code));
