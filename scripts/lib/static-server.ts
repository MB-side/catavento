// Minimal static server for out/ that behaves like GitHub Pages: serves the site under basePath,
// maps /dir/ to /dir/index.html, gzips text, and returns 404.html for anything missing. Used by Playwright
// and the link checker so tests exercise the same URLs as the live site.
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import path from "node:path";
import { createGzip } from "node:zlib";

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json",
  ".xml": "application/xml",
};

function resolveFile(root: string, urlPath: string): string | undefined {
  const decoded = decodeURIComponent(urlPath);
  const candidate = path.normalize(path.join(root, decoded));
  if (!candidate.startsWith(root)) return undefined; // no escaping the out/ folder
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  const index = path.join(candidate, "index.html");
  if (existsSync(index)) return index;
  return undefined;
}

export function startStaticServer(options: {
  root: string;
  basePath: string;
  port: number;
}): Promise<Server> {
  const root = path.resolve(options.root);
  const base = options.basePath;
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    let pathname = url.pathname;

    if (base && pathname === base) {
      res.writeHead(301, { Location: `${base}/` }).end();
      return;
    }
    if (base) {
      if (!pathname.startsWith(`${base}/`)) {
        res.writeHead(404, { "Content-Type": TYPES[".html"] }).end("Not found");
        return;
      }
      pathname = pathname.slice(base.length);
    }

    // GitHub Pages redirects /dir to /dir/ when dir/index.html exists.
    if (!pathname.endsWith("/") && !path.extname(pathname)) {
      const dirIndex = path.join(root, pathname, "index.html");
      if (existsSync(dirIndex)) {
        res.writeHead(301, { Location: `${base}${pathname}/${url.search}` }).end();
        return;
      }
    }

    const file = resolveFile(root, pathname);
    if (file) {
      const type = TYPES[path.extname(file)] ?? "application/octet-stream";
      // GitHub Pages compresses text, so measurements here should too.
      const gzip =
        /text|json|javascript|xml|svg|manifest/.test(type) &&
        /\bgzip\b/.test(String(req.headers["accept-encoding"] ?? ""));
      res.writeHead(200, {
        "Content-Type": type,
        ...(gzip ? { "Content-Encoding": "gzip", Vary: "Accept-Encoding" } : {}),
      });
      const stream = createReadStream(file);
      if (gzip) stream.pipe(createGzip()).pipe(res);
      else stream.pipe(res);
      return;
    }
    const notFound = path.join(root, "404.html");
    res.writeHead(404, { "Content-Type": TYPES[".html"] });
    if (existsSync(notFound)) createReadStream(notFound).pipe(res);
    else res.end("Not found");
  });

  return new Promise((resolve) => server.listen(options.port, () => resolve(server)));
}
