"use client";

// One outlook helper for a whole overview list (D83). Each entry has a plain "Show the next
// 3 days" button and an empty slot; on a click this looks the site up in the region's map file and
// shows its outlook in that slot. One component instead of one per site keeps long lists light,
// and nothing asks the forecast service about a site until someone wants it.
import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SiteOutlookSection } from "@/components/domain/SiteOutlookSection";
import type { MapSite } from "@/lib/overview";
import { withBasePath } from "@/lib/paths";

let cache: Promise<Map<string, MapSite>> | undefined;
function lookupTable(dataPath: string): Promise<Map<string, MapSite>> {
  cache ??= fetch(withBasePath(dataPath))
    .then((r) => r.json() as Promise<MapSite[]>)
    .then((rows) => new Map(rows.map((m) => [m.i, m])));
  return cache;
}

export function OverviewOutlooks({
  dataPath,
  children,
}: {
  dataPath: string;
  children: React.ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<{ site: MapSite; slot: Element }[]>([]);

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      const button = (e.target as Element).closest("button[data-outlook]");
      if (!(button instanceof HTMLButtonElement) || !root.current) return;
      const id = button.dataset.outlook ?? "";
      const slot = root.current.querySelector(`[data-outlook-slot="${CSS.escape(id)}"]`);
      if (!slot) return;
      button.hidden = true;
      void lookupTable(dataPath).then((table) => {
        const site = table.get(id);
        if (site)
          setOpen((list) => (list.some((o) => o.site.i === id) ? list : [...list, { site, slot }]));
      });
    },
    [dataPath],
  );

  return (
    // The click is handled for the buttons inside, which are real buttons (keyboard included).
    <div ref={root} onClick={onClick}>
      {children}
      {open.map(({ site, slot }) =>
        createPortal(
          <SiteOutlookSection
            id={site.i}
            lat={site.a}
            lon={site.o}
            ranges={site.r ?? []}
            marginal={site.m}
            rated={!!site.w}
            wtfHref="https://wheretofly.info/"
          />,
          slot,
          site.i,
        ),
      )}
    </div>
  );
}
