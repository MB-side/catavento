// The wind outlook (docs/02 §5.3): Open-Meteo's hourly forecast, fetched by the visitor's own
// browser at view time (never by our servers), batched, and cached in sessionStorage for an hour.
// Times are local to each site (timezone=auto). Client-side only.

export const OPEN_METEO = "https://api.open-meteo.com/v1/forecast";
const CACHE_PREFIX = "catavento.outlook.v1:";
const CACHE_MS = 60 * 60 * 1000;
const BATCH = 25;
export const KMH_TO_KT = 0.539957;

export interface ForecastPoint {
  id: string;
  lat: number;
  lon: number;
}

export interface Forecast {
  times: string[]; // local wall-clock times, "2026-10-13T10:00"
  speed: number[]; // km/h at 10 m
  direction: number[]; // degrees the wind comes from
  gust: number[]; // km/h
}

interface CacheEntry {
  at: number;
  forecast: Forecast;
}

const key = (p: ForecastPoint) => `${CACHE_PREFIX}${p.lat.toFixed(3)},${p.lon.toFixed(3)}`;

function readCache(p: ForecastPoint, now: number): Forecast | undefined {
  try {
    const raw = window.sessionStorage.getItem(key(p));
    if (!raw) return undefined;
    const entry = JSON.parse(raw) as CacheEntry;
    return now - entry.at < CACHE_MS ? entry.forecast : undefined;
  } catch {
    return undefined;
  }
}

function writeCache(p: ForecastPoint, forecast: Forecast, now: number): void {
  try {
    window.sessionStorage.setItem(
      key(p),
      JSON.stringify({ at: now, forecast } satisfies CacheEntry),
    );
  } catch {
    // Storage full or blocked: the outlook still shows, it just isn't cached.
  }
}

interface OpenMeteoResponse {
  hourly?: {
    time: string[];
    wind_speed_10m: (number | null)[];
    wind_direction_10m: (number | null)[];
    wind_gusts_10m: (number | null)[];
  };
}

export function forecastUrl(points: ForecastPoint[]): string {
  const params = new URLSearchParams({
    latitude: points.map((p) => p.lat.toFixed(4)).join(","),
    longitude: points.map((p) => p.lon.toFixed(4)).join(","),
    hourly: "wind_speed_10m,wind_direction_10m,wind_gusts_10m",
    wind_speed_unit: "kmh",
    timezone: "auto",
    forecast_days: "3",
  });
  return `${OPEN_METEO}?${params.toString()}`;
}

export function toForecast(r: OpenMeteoResponse): Forecast | undefined {
  const h = r.hourly;
  if (!h?.time?.length) return undefined;
  return {
    times: h.time,
    speed: h.wind_speed_10m.map((v) => v ?? Number.NaN),
    direction: h.wind_direction_10m.map((v) => v ?? Number.NaN),
    gust: h.wind_gusts_10m.map((v) => v ?? Number.NaN),
  };
}

/** Forecasts for many points: cached ones first, the rest in batches. Throws if a fetch fails. */
export async function fetchForecasts(
  points: ForecastPoint[],
  fetchImpl: typeof fetch = fetch,
): Promise<Map<string, Forecast>> {
  const now = Date.now();
  const out = new Map<string, Forecast>();
  const missing: ForecastPoint[] = [];
  for (const p of points) {
    const cached = readCache(p, now);
    if (cached) out.set(p.id, cached);
    else missing.push(p);
  }
  for (let i = 0; i < missing.length; i += BATCH) {
    const batch = missing.slice(i, i + BATCH);
    const res = await fetchImpl(forecastUrl(batch));
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const body = (await res.json()) as OpenMeteoResponse | OpenMeteoResponse[];
    const list = Array.isArray(body) ? body : [body];
    batch.forEach((p, j) => {
      const f = list[j] ? toForecast(list[j]) : undefined;
      if (f) {
        out.set(p.id, f);
        writeCache(p, f, now);
      }
    });
  }
  return out;
}

export interface OutlookCellData {
  time: string; // "2026-10-13T10:00"
  hour: number;
  speed: number; // km/h
  gust: number;
  direction: number;
}

export interface OutlookDay {
  date: string; // "2026-10-13"
  cells: (OutlookCellData | undefined)[]; // one per requested hour, undefined when missing
}

/** The first three days of a forecast, at the given local hours (e.g. [10, 14]). */
export function pickDays(forecast: Forecast, hours: number[], days = 3): OutlookDay[] {
  const dates = [...new Set(forecast.times.map((t) => t.slice(0, 10)))].slice(0, days);
  return dates.map((date) => ({
    date,
    cells: hours.map((hour) => {
      const time = `${date}T${String(hour).padStart(2, "0")}:00`;
      const i = forecast.times.indexOf(time);
      if (i < 0) return undefined;
      const speed = forecast.speed[i] ?? Number.NaN;
      const direction = forecast.direction[i] ?? Number.NaN;
      if (!Number.isFinite(speed) || !Number.isFinite(direction)) return undefined;
      return { time, hour, speed, direction, gust: forecast.gust[i] ?? Number.NaN };
    }),
  }));
}

/** km/h → the visitor's unit, rounded. */
export function speedIn(kmh: number, units: "kmh" | "kt"): number {
  return Math.round(units === "kt" ? kmh * KMH_TO_KT : kmh);
}
