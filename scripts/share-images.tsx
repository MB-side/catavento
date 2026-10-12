// Writes a 1200×630 share image for every site into out/og/ after `next build` (docs/02 §5.11).
// Done here rather than with Next's opengraph-image files because a static export names those
// without ".png", which GitHub Pages wouldn't serve as images.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { z } from "zod";
import { SHARE_IMAGE_SIZE, SiteShareImage } from "@/components/domain/SiteShareImage";
import { t } from "@/lib/messages";
import { anyOrganisationSchema, countrySchema, siteSchema } from "@/lib/schemas";
import { siteShareImagePath } from "@/lib/share";
import { siteConfig } from "@/site.config";

const root = process.cwd();
const read = (file: string): unknown =>
  JSON.parse(readFileSync(path.join(root, "data", "generated", file), "utf8"));

async function main(): Promise<void> {
  const sites = z
    .array(siteSchema)
    .parse(read("sites.json"))
    .filter((s) => !s.hidden);
  const countries = z.array(countrySchema).parse(read("countries.json"));
  const orgs = z.array(anyOrganisationSchema).parse(read("organisations.json"));
  const enabled = new Set<string>(siteConfig.enabledCountries);
  let written = 0;
  for (const site of sites) {
    const country = countries.find((c) => c.code === site.country);
    if (!country || !enabled.has(country.code)) continue;
    const steward = orgs.find((o) => o.id === site.stewardOrgId);
    const parsed = site.windRanges === "all" || site.windRanges.length > 0;
    const image = new ImageResponse(
      SiteShareImage({
        brand: { name: siteConfig.name, descriptor: siteConfig.descriptor },
        name: site.name,
        region: country.regionNames[site.regionCode] ?? site.regionCode,
        details: [
          parsed ? t("site.wind.published", { label: site.windRangeLabel }) : undefined,
          site.ratingText,
        ].filter((x): x is string => !!x),
        managedBy: steward ? t("sitesList.managedBy", { name: steward.name }) : undefined,
        ranges: site.windRanges,
        footer: t("site.shareFooter"),
      }),
      SHARE_IMAGE_SIZE,
    );
    const file = path.join(root, "out", siteShareImagePath(site));
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, Buffer.from(await image.arrayBuffer()));
    written++;
  }
  console.log(`share-images: ${written} site images written to out/og/sites/`);
}

void main();
