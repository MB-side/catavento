// URL helpers that respect basePath (CLAUDE.md: never hard-code "/").
// next/link and next/navigation add basePath themselves; use these only for plain URLs:
// fetch() calls, absolute URLs in metadata, JSON-LD and share links.
import { siteConfig } from "@/site.config";

function normalise(pathname: string): string {
  if (pathname === "" || pathname === "/") return "/";
  const withLeading = pathname.startsWith("/") ? pathname : `/${pathname}`;
  // trailingSlash: true in next.config, except for file paths such as /data/sites.json
  const last = withLeading.split("/").pop() ?? "";
  return last.includes(".") || withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

/** "/clubs" → "/catavento/clubs/" (or "/clubs/" when basePath is empty). */
export function withBasePath(pathname: string, basePath: string = siteConfig.basePath): string {
  const path = normalise(pathname);
  return path === "/" ? `${basePath}/` : `${basePath}${path}`;
}

/** "/clubs" → "https://mb-side.github.io/catavento/clubs/" */
export function absoluteUrl(pathname: string, siteUrl: string = siteConfig.siteUrl): string {
  const path = normalise(pathname);
  return `${siteUrl.replace(/\/$/, "")}${path}`;
}
