// Page metadata and JSON-LD builders (docs/02 §7, docs/01 §8).
import type { Metadata } from "next";
import { siteConfig } from "@/site.config";
import { absoluteUrl } from "./paths";

/** Title for the home page: "Catavento · Paragliding and hang gliding in Australia, all in one place". */
export const homeTitle = `${siteConfig.name} · ${siteConfig.titleDescriptor}`;

/** Robots directive for every page; indexing stays off until consultation launch. */
export const robots: Metadata["robots"] = siteConfig.allowIndexing
  ? { index: true, follow: true }
  : { index: false, follow: false };

interface PageMetaInput {
  /** Page title without the site name; the layout template adds " | Catavento". */
  title: string;
  description: string;
  /** Route path without basePath, e.g. "/au/clubs". */
  path: string;
  /** A share image path without basePath, e.g. "/og/sites/au/nsw/long-reef-ne.png" (1200×630). */
  image?: { path: string; alt: string };
}

export function pageMetadata({ title, description, path, image }: PageMetaInput): Metadata {
  const url = absoluteUrl(path);
  const images = image
    ? [{ url: absoluteUrl(image.path), width: 1200, height: 630, alt: image.alt }]
    : undefined;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url,
      siteName: siteConfig.name,
      type: "website",
      ...(images ? { images } : {}),
    },
    ...(images ? { twitter: { card: "summary_large_image", images } } : {}),
  };
}

/** Organization JSON-LD for every page. */
export function organizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    description: siteConfig.descriptor,
    url: absoluteUrl("/"),
    email: siteConfig.contactEmail,
  };
}

/** Serialises JSON-LD for a <script> tag, escaping "<" so content can't close the tag. */
export function jsonLdScript(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
