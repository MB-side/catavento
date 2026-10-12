import { describe, expect, it } from "vitest";
import type { Provider } from "@/lib/types";
import {
  assignOrgIds,
  mapDirectory,
  mapStations,
  orgVerification,
  providerForUrl,
  regionFromState,
  safeSummary,
  type CsvRow,
} from "./seed";

const providers = new Map<string, Provider>(
  ["safa", "nzhgpa", "org-websites", "assoc"].map((id) => [
    id,
    {
      id,
      name: id,
      tier: "green",
      licence: "facts",
      attribution: id,
      uses: "x",
      method: "x",
      schedule: "x",
      countries: ["*"],
      permissionStatus: "not_requested",
      enabled: true,
    },
  ]),
);

function row(fields: Partial<CsvRow>): CsvRow {
  return {
    id: "X-1",
    name: "Test Org",
    category: "school",
    subcategory: "",
    disciplines: "PG;HG",
    country: "AU",
    state: "NSW",
    locality: "",
    postcode: "",
    website: "https://example.org",
    email: "",
    phone: "",
    key_people: "",
    offerings_summary: "",
    brands_or_notes: "",
    source_url: "https://safa.asn.au/learn-to-fly/flight-schools/",
    in_safa_school_directory: "yes",
    verification_status: "listed_by_SAFA_page_modified_2024-06-13",
    last_checked: "2026-10-08",
    notes: "",
    ...fields,
  };
}

describe("seed helpers", () => {
  it("maps states to ISO region codes", () => {
    expect(regionFromState("AU", "NSW")).toBe("AU-NSW");
    expect(regionFromState("AU", "NSW;ACT")).toBe("AU-NSW");
    expect(regionFromState("AU", "")).toBeUndefined();
  });

  it("maps verification values (docs/10 C4); notes asking to verify win", () => {
    expect(orgVerification("listed_by_SAFA_club_directory", "")).toBe("listed_by_national_body");
    expect(orgVerification("listed_by_national_body", "")).toBe("listed_by_national_body");
    expect(orgVerification("verified_public_source", "State not captured; verify")).toBe("needs_verification");
    expect(orgVerification("verified_public_source", "")).toBe("verified_public_source");
  });

  it("attributes source addresses to the right provider", () => {
    expect(providerForUrl("https://safa.asn.au/local-clubs/")).toBe("safa");
    expect(providerForUrl("https://nzhgpa.org.nz/local-clubs/")).toBe("nzhgpa");
    expect(providerForUrl("https://www.vhpa.org.au/schools.html")).toBe("assoc");
    expect(providerForUrl("https://www.flymanilla.com/")).toBe("org-websites");
  });

  it("drops summaries that break the wording rules", () => {
    expect(safeSummary("Per-site flyability forecast")).toBe("Per-site flyability forecast");
    expect(safeSummary("Is it safe today?")).toBeUndefined();
    expect(safeSummary("  ")).toBeUndefined();
  });
});

describe("mapDirectory", () => {
  it("imports organisations with mapped fields", () => {
    const { orgs } = mapDirectory([row({})], providers);
    expect(orgs).toHaveLength(1);
    expect(orgs[0]).toMatchObject({
      legacyId: "X-1",
      kind: "school",
      disciplines: ["PG", "HG"],
      country: "AU",
      regionCode: "AU-NSW",
      nationalBodyListed: true,
      verificationStatus: "listed_by_national_body",
      lastVerified: "2026-10-08",
      sources: [{ providerId: "safa", licence: "facts" }],
    });
  });

  it("skips benchmarks and turns tools into resources", () => {
    const { orgs, resources } = mapDirectory(
      [
        row({ id: "BEN-1", category: "overseas_benchmark", country: "" }),
        row({ id: "INF-1", name: "A Tool", category: "info_tool", subcategory: "sites" }),
      ],
      providers,
    );
    expect(orgs).toHaveLength(0);
    expect(resources).toEqual([
      expect.objectContaining({ id: "resource:a-tool", legacyId: "INF-1", category: "sites" }),
    ]);
  });

  it("imports flight parks by subcategory", () => {
    const { orgs } = mapDirectory(
      [row({ category: "service_centre", subcategory: "flight_park", country: "NZ", state: "" })],
      providers,
    );
    expect(orgs[0]?.kind).toBe("flight_park");
    expect(orgs[0]?.regionCode).toBeUndefined();
  });

  it("refuses rows without a country or a source, with a warning", () => {
    const { orgs, warnings } = mapDirectory(
      [row({ country: "" }), row({ source_url: "", website: "" })],
      providers,
    );
    expect(orgs).toHaveLength(0);
    expect(warnings.map((w) => w.code)).toEqual(["no-country", "no-source"]);
  });
});

describe("assignOrgIds", () => {
  it("keeps bracketed names only when they would clash", () => {
    const { orgs } = mapDirectory(
      [
        row({ id: "A", name: "SkySurf Paragliding (Canberra)" }),
        row({ id: "B", name: "SkySurf Paragliding (Wollongong)" }),
        row({ id: "C", name: "Sydney Hang Gliding Club Inc" }),
      ],
      providers,
    );
    expect(assignOrgIds(orgs).map((o) => o.id)).toEqual([
      "org:au:skysurf-paragliding-canberra",
      "org:au:skysurf-paragliding-wollongong",
      "org:au:sydney-hang-gliding-club",
    ]);
  });
});

describe("mapStations", () => {
  const base = {
    station_id: "S-1",
    provider: "freeflightwx",
    provider_ref: "acthpa/springhill",
    name: "Spring Hill",
    country: "AU",
    url: "https://freeflightwx.com/acthpa/springhill/index.php",
    verification_status: "listed_on_provider_index",
  };

  it("maps providers and keeps embeds and feeds off", () => {
    const { stations } = mapStations([base]);
    expect(stations[0]).toMatchObject({
      id: "station:freeflightwx:acthpa-springhill",
      providerId: "freeflightwx",
      embedAllowed: false,
      feedAllowed: false,
    });
    expect(stations[0]?.hidden).toBeUndefined();
  });

  it("hides name-only, address-less and BOM rows (docs/04 §6)", () => {
    const { stations } = mapStations([
      { ...base, station_id: "H", provider: "holfuy", provider_ref: "1", verification_status: "needs_verification_name_only" },
      { ...base, station_id: "C", provider: "club_site", provider_ref: "", url: "", verification_status: "mentioned_in_site_guide_url_not_captured" },
      { ...base, station_id: "B", provider: "bom_aws", provider_ref: "IDN60920", url: "", verification_status: "documented_by_third_party" },
    ]);
    expect(stations.every((s) => s.hidden === true)).toBe(true);
    expect(stations.map((s) => s.providerId)).toEqual(["holfuy", "club-stations", "bom"]);
  });
});
