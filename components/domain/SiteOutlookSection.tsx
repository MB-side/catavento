"use client";

// The site page's "Next 3 days" grid (docs/02 §5.4 item 5), fetched by the visitor's browser.
import { OutlookLegend, SiteOutlook, useForecasts } from "@/components/domain/Outlook";
import type { WindArc } from "@/lib/types";

export function SiteOutlookSection({
  id,
  lat,
  lon,
  ranges,
  marginal,
  rated,
  wtfHref,
}: {
  id: string;
  lat: number;
  lon: number;
  ranges: WindArc[] | "all";
  marginal?: WindArc[];
  rated: boolean;
  wtfHref: string;
}) {
  const point = { id, lat, lon };
  const state = useForecasts([point]);
  return (
    <div className="mt-3 flex flex-col gap-2">
      <SiteOutlook
        point={point}
        ranges={ranges}
        marginal={marginal}
        rated={rated}
        state={state}
        wtfHref={wtfHref}
      />
      <OutlookLegend rated={rated} />
    </div>
  );
}
