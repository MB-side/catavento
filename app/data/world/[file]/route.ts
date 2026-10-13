// /data/world/<region>.json: the sites an overview region's map shows (D83), built at export time.
// A separate file keeps thousands of map points out of the page itself.
import { getOverviewRegion, getOverviewRegions, getOverviewSites } from "@/lib/data";
import { toMapSite } from "@/lib/overview";

export const dynamic = "force-static";

export function generateStaticParams(): { file: string }[] {
  return getOverviewRegions().map((r) => ({ file: `${r.slug}.json` }));
}

export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }): Promise<Response> {
  const { file } = await params;
  const region = getOverviewRegion(file.replace(/\.json$/, ""));
  if (!region) return new Response("Not found", { status: 404 });
  const codes = new Set(region.countries.map((c) => c.code));
  const sites = getOverviewSites().filter((s) => codes.has(s.country));
  return Response.json(sites.map((s) => toMapSite(region, s)));
}
