# 04 · Data Model (Iteration 1)

**Status:** current · **Last updated:** 12 Oct 2026

All types live in `lib/types.ts` with matching Zod schemas in `lib/schemas.ts`. The app reads only `data/generated/*.json` through `lib/data`.

## 1. Identifiers

| Entity | ID pattern | Example |
|---|---|---|
| Organisation (any kind) | `org:<country>:<slug>` | `org:au:sydney-paragliding-hang-gliding-club` |
| Site | `site:<country>:<region>:<slug>` | `site:au:nsw:long-reef-ne`, `site:nz:can:port-hills` |
| Launch | `<siteId>:launch:<n>` | `site:au:nsw:long-reef-ne:launch:1` |
| Station | `station:<provider>:<providerRef>` | `station:holfuy:156`, `station:freeflightwx:stanwell` |
| Event | `event:<provider>:<hash>` | `event:safa:3f9a2c` |
| Notice | `notice:<provider>:<hash>` | |
| Provider | `<provider-slug>` | `safa`, `ansg`, `pge`, `open-meteo` |

Slugs are lowercase kebab-case from the name. Once published, an ID must not change; if a name changes, pin the old ID in `data/manual/overrides.yaml` (`pinId`). Seed IDs (e.g. `SCH-001`) are kept as `legacyId`.

## 2. Types

```ts
type CountryCode = string;      // ISO 3166-1 alpha-2, e.g. "AU", "NZ"; must exist in countries.yaml
type RegionCode = string;       // ISO 3166-2, e.g. "AU-NSW", "NZ-CAN"
type StewardRole = "club" | "site_holder" | "flight_park" | "operator" | "landowner" | "municipality" | "national_body" | "none" | "unknown";
type Discipline = "PG" | "HG" | "PPG" | "WM" | "tandem" | "speedflying" | "parakite";
type Tier = "green" | "amber" | "red";
type Licence = "facts" | "cc-by-sa-3.0" | "odbl-1.0" | "cc-by-4.0" | "proprietary" | "unknown";

interface SourceRef {
  providerId: string;          // see docs/05 §4
  url: string;
  fetchedAt: string;           // ISO 8601
  licence: Licence;
  contentHash?: string;
}

interface Provider {
  id: string; name: string; homepage?: string; termsUrl?: string;   // homepage absent for grouped providers
  tier: Tier; licence: Licence; attribution: string;    // exact display text, docs/05 §4
  uses: string; method: string; schedule: string; countries: string[];   // shown on /sources (D41)
  permissionStatus: "not_requested" | "requested" | "granted_link" | "granted_embed" | "granted_feed" | "refused" | "withdrawn";
  enabled: boolean; contact?: string; notes?: string;
  collect?: { everyDays: number; paused?: boolean; pausedReason?: string };   // automatic collection schedule (D49)
}

type OrgKind =
  | "governing_body" | "regional_association" | "club" | "school" | "tandem_operator"
  | "retailer" | "importer_distributor" | "manufacturer" | "service_centre"
  | "flight_park" | "site_holder" | "operator";

interface Organisation {
  id: string; legacyId?: string; slug: string; kind: OrgKind; name: string;
  aliases?: string[];                          // other names used by sources
  disciplines: Discipline[];
  country: CountryCode; regionCode?: RegionCode; locality?: string; postcode?: string;
  location?: { lat: number; lon: number };     // geocoded or published; omit if unknown
  website?: string; emailPublic?: string; phonePublic?: string;   // only as published by the org or its national body
  nationalBodyListed?: boolean;                // appears in the national body's school directory (D40)
  additionalKinds?: OrgKind[];                 // e.g. a school that also runs a shop (D40)
  relatedOrgIds?: string[];                    // same business, separate record (e.g. two bases) (D40)
  summary?: string;                            // our own short words
  brands?: string[];                           // for retailers/importers
  sources: SourceRef[];
  lastVerified: string;                        // ISO date
  verificationStatus: "verified_public_source" | "listed_by_national_body" | "needs_verification" | "owner_confirmed";
  hidden?: boolean;
}

interface Club extends Organisation {
  kind: "club";
  regionalAssociationId?: string;
  siteIds: string[];                           // derived: sites whose stewardOrgId (or alsoAdministeredBy) is this club
  stationIds: string[];
  contacts?: { role: string; name?: string; phone?: string; email?: string; source: SourceRef }[];
  joinUrl?: string; noticesUrl?: string;
  siteAccessNote?: string;                     // e.g. day fee or membership, only if published
}

interface Site {
  id: string; slug: string; name: string; country: CountryCode; regionCode: RegionCode; area?: string;   // area e.g. "Northern Beaches"
  siteGuideUrl?: string;
  typeText?: string; heightText?: string; ratingText?: string; conditionsText?: string;  // as published, short fields only
  windRanges: { fromDeg: number; toDeg: number }[] | "all";   // parsed from conditionsText (docs/05 §5)
  windRangeLabel: string;                      // e.g. "NNE–ENE", "All"
  ratingSystem?: string; ippiLevel?: number;   // e.g. "SAFA", "NZHGPA"; IPPI only where published
  status: "open" | "closed" | "restricted" | "unknown";
  stewardOrgId?: string; stewardRole: StewardRole; stewardNote?: string;   // set only from a steward source, never from a site guide's contact alone (D47)
  listedContact?: ListedContact;               // the contact a site guide lists: a pointer, not proof of stewardship (D47)
  alsoAdministeredBy?: { orgId: string; note?: string }[];   // e.g. the club that publishes a flight park's guide
  siteAccessNote?: string;                     // passes, fees or membership, only if published
  officialGuideUrl?: string;                   // Site Guide page or club guide
  launches: Launch[];
  mainLandingName?: string;                    // name only; notes stay on the Site Guide
  stationIds: string[];                        // curated (data/manual/site-stations.yaml) plus nearest matches
  wtfSlug?: string;                            // Where To Fly slug if known
  disciplines: Discipline[];                   // derived from ratingText where determinable
  layer: "ansg" | "pge" | "manual";            // licence layer; "manual" = compiled by hand from a cited source
  sources: SourceRef[];
  hidden?: boolean;
}

interface ListedContact {
  name: string;                                // the organisation's own name once linked; never a person's name (D48)
  url?: string;
  orgId?: string;                              // linked only on an exact match (docs/05 §5.4)
  providerId: string;
}

interface Launch {
  id: string; name: string;
  lat?: number; lon?: number;
  precision: "exact" | "approximate" | "withheld";
  altitudeM?: number;
}

interface Station {
  id: string; legacyId?: string; providerId: string; providerRef: string; name: string; country: CountryCode;
  url?: string;                                // public live page; required unless hidden (D41)
  lat?: number; lon?: number;
  ownerOrgId?: string; ownerLabel?: string;    // e.g. "club station"
  embedAllowed: boolean; feedAllowed: boolean; // both false in Iteration 1 unless permission recorded
  verificationStatus: "verified_public_source" | "linked_by_club" | "listed_on_provider_index" | "needs_verification";
  hidden?: boolean;
}

interface EventItem {
  id: string; title: string; startDate: string; endDate?: string;
  type: "competition" | "fly_in" | "clinic" | "siv" | "meeting" | "social" | "festival" | "other";
  disciplines: Discipline[];
  locationText?: string; country: CountryCode; regionCode?: RegionCode; location?: { lat: number; lon: number };
  organiserOrgId?: string; url: string; sources: SourceRef[];
}

interface Notice {
  id: string; title: string; date: string; url: string;
  country: CountryCode; scope: "national" | "club" | "site"; orgId?: string; siteIds?: string[];   // country: D41
  sources: SourceRef[];
}

interface Brand { id: string; name: string; website?: string;
  distributors: { orgId: string; role: "official_importer" | "core_importer" | "dealer" | "service_agent" | "certified_service" }[]; }

interface Offering {                           // only published facts
  orgId: string; type: "tandem" | "intro_course" | "licence_course" | "endorsement" | "siv" | "xc_clinic" | "tour" | "guiding" | "service";
  discipline?: Discipline; title: string;
  priceFrom?: number; currency?: string;       // ISO 4217 from the organisation's country (D41)
  priceText?: string; durationText?: string; inclusions?: string[];
  url: string; source: SourceRef;
}

interface Resource {                           // tools and references shown on Sources / Visiting pilots
  id: string; legacyId?: string; name: string; url: string; category: string; summary?: string; providerId?: string; countries?: CountryCode[];
}

type RunStatus = "ok" | "warning" | "blocked" | "failed" | "unchanged";

interface ProviderRun {                        // one provider's latest collection run, shown on /status
  status: RunStatus; startedAt: string; finishedAt: string;
  recordsFound: number; recordsChanged: number; warnings: string[];
  guardDecision?: "accepted" | "accepted_first_run" | "blocked_drop" | "blocked_invalid";
  lastSuccessAt?: string; contentHash?: string;
}

interface BuildReport {                        // data/generated/_report.json
  build: { counts: Record<string, number>; warnings: { code: string; message: string; recordId?: string }[] };
  providers: Record<string, ProviderRun>;
}

interface Country {                            // loaded from data/manual/countries.yaml
  code: CountryCode; name: string; enabled: boolean; default?: boolean;
  regionLabel: string; regions: RegionCode[]; timezones: string[]; currency: string;
  defaultUnits: { speed: "kmh" | "kt" | "mph"; altitude: "m" | "ft" };
  nationalBody: { orgId: string; name: string; url: string; membershipLine: string; visitingPilotsUrl?: string; joinUrl?: string };
  ratingsNote: string; primarySiteSource: string; coverage: "full" | "sample";
}
```

## 3. Files

| File | Contents |
|---|---|
| `data/generated/countries.json` | `Country[]` |
| `data/generated/providers.json` | `Provider[]` (each with `countries[]`) |
| `data/generated/organisations.json` | `Organisation[]` (clubs typed as `Club`) |
| `data/generated/sites.json` | `Site[]` |
| `data/generated/stations.json` | `Station[]` |
| `data/generated/events.json` | `EventItem[]` (future events only, plus last 30 days) |
| `data/generated/notices.json` | `Notice[]` |
| `data/generated/brands.json` | `Brand[]` |
| `data/generated/offerings.json` | `Offering[]` |
| `data/generated/resources.json` | `Resource[]` |
| `data/generated/_report.json` | `BuildReport`: build counts and warnings, plus each provider's latest run |
| `data/ingest/<provider>.json` | Normalised output of each provider's last accepted run (with `fetchedAt` and `contentHash`) |
| `data/ingest/_runs.json` | `ProviderRun` per provider: the record the schedule and `/status` read |
| `data/boundaries/regions-au-nz.geojson` | Natural Earth state and region boundaries for offline region lookup (D51) |

## 4. Manual curation files (`data/manual/`)

All optional; create them as needed. Each entry may carry a `note` and `source` URL.

| File | Purpose | Example |
|---|---|---|
| `providers.yaml` | Provider registry (seeded from `docs/05` §4) | `- id: holfuy  tier: red  enabled: true ...` |
| `overrides.yaml` | Set or hide fields on any record; pin IDs | `site:au:nsw:long-reef-ne: { status: open }` |
| `club-aliases.yaml` | Map a source's spelling, or a web address without `https://www.`, to one organisation in that country (D48) | `AU: { "SPHGC": CLB-024, "flycanungra.com.au": CLB-004 }` |
| `countries.yaml` | Country configuration (provided) | AU and NZ entries |
| `nz-sample-sites.yaml` | Iteration 1 NZ sample sites with stewards (provided) | |
| `site-stewards.yaml` | Force a site's steward and role where parsing can't | `site:au:nsw:manilla-mt-borah: { org: org:au:manilla-sky-sailors, role: club }` |
| `site-stations.yaml` | Curated stations per site (order = display order) | `site:au:nsw:long-reef-ne: [station:club:long-reef]` |
| `wtf-slugs.yaml` | Where To Fly slug per site | `site:au:act:spring-hill: spring_hill` |
| `org-merges.yaml` | Seed rows that are one business: merge a shop into its school, or cross-link separate records (D40) | `merge: [{ from: RTL-004, into: [SCH-021] }]` |
| `brands.yaml` | Brands and their distributors in each country | |
| `offerings.yaml` | Published prices and courses, each with source URL | |
| `events.yaml` | Events not available from a source | |

Precedence: **manual > ingest > seed** (`docs/03` §6).

## 5. Coordinate precision rules

- `exact`: show on map, compute outlook and distances.
- `approximate` (e.g. a source states coordinates are only available to members): **do not show on the map**, no outlook, no "nearby" calculations; site page says "Location available from the club".
- `withheld`: same as approximate, and never store coordinates.

## 6. Seed mapping

### `data/seed/directory.csv` → `Organisation`

| CSV `category` | Action |
|---|---|
| `governing_body`, `regional_association`, `club`, `school`, `tandem_operator`, `retailer`, `importer_distributor`, `manufacturer`, `service_centre` | Import as `Organisation` with matching `kind` |
| `info_tool`, `weather_tool`, `competition_platform`, `community_media`, `booking_marketplace`, `tourism_listing` | Import as `Resource` (and use to seed `providers.yaml` where relevant) |
| `overseas_benchmark`, `domestic_benchmark` | **Do not import** (research only) |

Field mapping: `id → legacyId`, `name`, `disciplines` (semicolon list), `country`, `state` → `regionCode` (`AU-` + state; NZ rows have none until geocoded), `locality`, `postcode`, `website`, `email → emailPublic`, `phone → phonePublic`, `offerings_summary → summary` (rewrite briefly if needed), `brands_or_notes` → `brands` for retailers/importers (parse by hand into `brands.yaml`), `source_url → sources[0]`, `in_safa_school_directory → nationalBodyListed`, `last_checked → lastVerified`, `verification_status` → mapped enum. Rows with notes saying "verify" import with `verificationStatus: needs_verification` and are shown with a "Not yet verified" label. Rows with `subcategory = flight_park` import as kind `flight_park`. Multiple rows for one business (e.g. a school and its shop) become **one** organisation that keeps the school `kind` and lists the others in `additionalKinds`; separate SAFA-listed bases stay separate records linked by `relatedOrgIds` (`data/manual/org-merges.yaml`, D40).

### `data/seed/weather-stations.csv` → `Station`

Import all rows. Rows with `verification_status = needs_verification_name_only` import with `hidden: true` until verified. `embedAllowed` and `feedAllowed` are `false` for all rows. Provider `bom_aws` rows describe state feeds, not stations; keep them for Iteration 2 and do not display.

## 7. Derived fields (computed in `build-data.ts`)

- `Club.siteIds` from `Site.stewardOrgId` (role `club`) and `alsoAdministeredBy`
- Nearest exact-coordinate stations to each launch (on site ≤ 200 m, nearby ≤ 2 km) appended after curated ones, labelled with distance
- Nearby lists for site pages: organisations within 100 km (tandem operators and schools), events within 200 km, other sites of the same club
- Search index documents

## 8. Iteration 2 mapping (for awareness)

Each type maps to a Postgres table of the same name (snake_case), with `location`/`lat,lon` becoming PostGIS `geography(Point)`, `sources` becoming a `source_refs` table, and arrays of IDs becoming join tables. Do not introduce shapes that cannot map this way.
