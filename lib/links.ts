// Outbound link builders: the correction form and the embedded wind map. Pure functions.
import { siteConfig } from "@/site.config";
import type { Country } from "./types";

/**
 * The correction form with the page address (and record ID, on record pages) filled in, so
 * reports arrive tied to the right place (docs/02 §5.1).
 */
export function correctionFormUrl(
  pageUrl: string,
  recordId?: string,
  form: { url: string; pageField: string; recordField: string } = siteConfig.correctionForm,
): string {
  const params = new URLSearchParams({ usp: "pp_url", [form.pageField]: pageUrl });
  if (recordId) params.set(form.recordField, recordId);
  return `${form.url}?${params.toString()}`;
}

const WINDY_UNITS: Record<Country["defaultUnits"]["speed"], string> = {
  kmh: "km/h",
  kt: "kt",
  mph: "mph",
};

/**
 * Windy's standard embedded wind map (embed.windy.com/embed2.html), unmodified, centred on a
 * country or site. Windy's logo stays visible and links to windy.com, as Windy asks (D44).
 */
export function windyEmbedUrl(view: {
  lat: number;
  lon: number;
  zoom: number;
  speedUnit: Country["defaultUnits"]["speed"];
}): string {
  const params = new URLSearchParams({
    lat: view.lat.toFixed(3),
    lon: view.lon.toFixed(3),
    detailLat: view.lat.toFixed(3),
    detailLon: view.lon.toFixed(3),
    zoom: String(view.zoom),
    level: "surface",
    overlay: "wind",
    product: "ecmwf",
    menu: "",
    message: "true",
    marker: "",
    calendar: "now",
    pressure: "",
    type: "map",
    location: "coordinates",
    detail: "",
    metricWind: WINDY_UNITS[view.speedUnit],
    metricTemp: "°C",
    radarRange: "-1",
  });
  return `https://embed.windy.com/embed2.html?${params.toString()}`;
}
