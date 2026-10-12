import { describe, expect, it } from "vitest";
import {
  fetchForecasts,
  forecastUrl,
  pickDays,
  speedIn,
  toForecast,
  type Forecast,
} from "./outlook";

const times = ["2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16"].flatMap((d) =>
  Array.from({ length: 24 }, (_, h) => `${d}T${String(h).padStart(2, "0")}:00`),
);
const response = {
  hourly: {
    time: times,
    wind_speed_10m: times.map((_, i) => i % 24),
    wind_direction_10m: times.map(() => 90),
    wind_gusts_10m: times.map(() => 30),
  },
};

describe("forecastUrl", () => {
  it("asks Open-Meteo for wind at several points, in km/h and local time, for 3 days", () => {
    const url = new URL(
      forecastUrl([
        { id: "a", lat: -33.1, lon: 151.2 },
        { id: "b", lat: -35, lon: 149 },
      ]),
    );
    expect(url.origin + url.pathname).toBe("https://api.open-meteo.com/v1/forecast");
    expect(url.searchParams.get("latitude")).toBe("-33.1000,-35.0000");
    expect(url.searchParams.get("hourly")).toBe("wind_speed_10m,wind_direction_10m,wind_gusts_10m");
    expect(url.searchParams.get("timezone")).toBe("auto");
    expect(url.searchParams.get("forecast_days")).toBe("3");
  });
});

describe("pickDays", () => {
  const forecast = toForecast(response) as Forecast;

  it("takes the first three days at the requested local hours", () => {
    const days = pickDays(forecast, [10, 14]);
    expect(days.map((d) => d.date)).toEqual(["2026-10-13", "2026-10-14", "2026-10-15"]);
    expect(days[0]?.cells.map((c) => [c?.hour, c?.speed, c?.direction])).toEqual([
      [10, 10, 90],
      [14, 14, 90],
    ]);
  });

  it("leaves a gap where the forecast has no value", () => {
    const gappy = { ...forecast, speed: forecast.speed.map((v, i) => (i === 10 ? Number.NaN : v)) };
    expect(pickDays(gappy, [10])[0]?.cells[0]).toBeUndefined();
  });
});

describe("speedIn", () => {
  it("converts km/h to knots when asked", () => {
    expect(speedIn(20, "kmh")).toBe(20);
    expect(speedIn(20, "kt")).toBe(11);
  });
});

describe("fetchForecasts", () => {
  it("fetches in one batch and maps each answer to its point", async () => {
    const calls: string[] = [];
    const fake = (async (url: string) => {
      calls.push(url);
      return new Response(JSON.stringify([response, response]), { status: 200 });
    }) as unknown as typeof fetch;
    const out = await fetchForecasts(
      [
        { id: "a", lat: -33, lon: 151 },
        { id: "b", lat: -35, lon: 149 },
      ],
      fake,
    );
    expect(calls).toHaveLength(1);
    expect([...out.keys()]).toEqual(["a", "b"]);
  });

  it("throws when Open-Meteo answers with an error, so the page can say so", async () => {
    const fake = (async () => new Response("", { status: 429 })) as unknown as typeof fetch;
    await expect(fetchForecasts([{ id: "a", lat: 1, lon: 1 }], fake)).rejects.toThrow(
      "Open-Meteo 429",
    );
  });
});
