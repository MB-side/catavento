"use client";

// The sites map (docs/02 §5.5): MapLibre with OpenFreeMap tiles (D61), loaded only when the
// visitor opens it. Launches are clustered; tapping one shows the site with a link to its page.
// The list beside it stays the main, accessible interface; if the map fails, the list still works.
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { t } from "@/lib/messages";
import { withBasePath } from "@/lib/paths";
import type { SiteSummary } from "@/lib/site-summary";

export const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

const COLOURS = { site: "#1f4fbf", community: "#b8460b", cluster: "#0f1b26" };

function popupContent(s: SiteSummary): HTMLElement {
  // Built from DOM nodes, never HTML strings, so names can't inject markup.
  const box = document.createElement("div");
  const link = document.createElement("a");
  link.href = withBasePath(s.href);
  link.textContent = s.name;
  link.style.fontWeight = "700";
  box.append(link);
  const line = document.createElement("div");
  line.textContent = [s.regionName, s.windParsed ? s.windLabel : undefined]
    .filter(Boolean)
    .join(" · ");
  box.append(line);
  const who = s.steward
    ? t("sitesList.managedBy", { name: s.steward })
    : s.contact
      ? t("sitesList.contact", { name: s.contact })
      : "";
  if (who) {
    const p = document.createElement("div");
    p.textContent = who;
    box.append(p);
  }
  if (s.community) {
    const c = document.createElement("div");
    c.textContent = t("sitesList.community");
    c.style.fontStyle = "italic";
    box.append(c);
  }
  return box;
}

export default function SitesMap({ sites }: { sites: SiteSummary[] }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [failed, setFailed] = useState(false);

  const located = sites.filter((s) => s.lat !== undefined && s.lon !== undefined);
  const data: Parameters<GeoJSONSource["setData"]>[0] = {
    type: "FeatureCollection",
    features: located.map((s) => ({
      type: "Feature",
      id: s.id,
      geometry: { type: "Point", coordinates: [s.lon as number, s.lat as number] },
      properties: { id: s.id, community: s.community },
    })),
  };
  const byId = new Map(located.map((s) => [s.id, s]));

  useEffect(() => {
    if (!container.current || mapRef.current) return;
    let map: MapLibreMap;
    try {
      map = new maplibregl.Map({
        container: container.current,
        style: MAP_STYLE,
        center: [134, -27.5],
        zoom: 3,
        attributionControl: { compact: true },
        cooperativeGestures: true,
      });
    } catch {
      // No WebGL, for example: report it on the next frame, outside this effect.
      requestAnimationFrame(() => setFailed(true));
      return;
    }
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("error", (e) => {
      // Tile and style failures: say so once and leave the list to do the work.
      if (!map.isStyleLoaded() || /style|source/i.test(String(e.error?.message ?? "")))
        setFailed(true);
    });
    map.on("load", () => {
      map.addSource("sites", {
        type: "geojson",
        data,
        cluster: true,
        clusterRadius: 40,
        clusterMaxZoom: 11,
      });
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "sites",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": COLOURS.cluster,
          "circle-radius": ["step", ["get", "point_count"], 14, 10, 18, 50, 24],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "sites",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 12,
          "text-font": ["Noto Sans Bold"],
        },
        paint: { "text-color": "#ffffff" },
      });
      map.addLayer({
        id: "site-points",
        type: "circle",
        source: "sites",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["case", ["get", "community"], COLOURS.community, COLOURS.site],
          "circle-radius": 7,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
      map.on("click", "clusters", async (e) => {
        const feature = e.features?.[0];
        const clusterId = feature?.properties?.cluster_id as number | undefined;
        if (!feature || clusterId === undefined || feature.geometry.type !== "Point") return;
        const zoom = await (map.getSource("sites") as GeoJSONSource).getClusterExpansionZoom(
          clusterId,
        );
        map.easeTo({ center: feature.geometry.coordinates as [number, number], zoom });
      });
      map.on("click", "site-points", (e) => {
        const feature = e.features?.[0];
        const site = byId.get(String(feature?.properties?.id));
        if (!site || !feature || feature.geometry.type !== "Point") return;
        new maplibregl.Popup({ offset: 10 })
          .setLngLat(feature.geometry.coordinates as [number, number])
          .setDOMContent(popupContent(site))
          .addTo(map);
      });
      for (const layer of ["clusters", "site-points"]) {
        map.on("mouseenter", layer, () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = ""));
      }
      fit(map, located);
    });
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // The map is created once; filter changes update its data below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource("sites") as GeoJSONSource | undefined;
    if (!map || !source) return;
    source.setData(data);
    fit(map, located);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sites]);

  if (failed) return <p className="p-4 text-muted">{t("sitesList.mapFailed")}</p>;
  return (
    <div
      ref={container}
      role="region"
      aria-label={t("sitesList.mapLabel")}
      className="h-[60vh] min-h-[320px] w-full lg:h-[520px]"
      data-testid="sites-map"
    />
  );
}

function fit(map: MapLibreMap, sites: SiteSummary[]) {
  if (sites.length === 0) return;
  const bounds = new maplibregl.LngLatBounds();
  for (const s of sites) bounds.extend([s.lon as number, s.lat as number]);
  map.fitBounds(bounds, { padding: 40, maxZoom: 11, duration: 0 });
}
