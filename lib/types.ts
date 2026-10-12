// All shared data types (docs/04 §2). Zod schemas mirroring these live in lib/schemas.ts.
// Deviations from docs/04, recorded in docs/10 (D39–D41): country-neutral names
// (nationalBodyListed, listed_by_national_body), additionalKinds and relatedOrgIds on organisations,
// country on Station and Notice, display fields on Provider, optional Station.url for hidden rows,
// and Offering.priceFrom + currency instead of priceFromAud.

/** ISO 3166-1 alpha-2, e.g. "AU", "NZ"; must exist in countries.yaml. */
export type CountryCode = string;
/** ISO 3166-2, e.g. "AU-NSW", "NZ-CAN". */
export type RegionCode = string;

export type SpeedUnit = "kmh" | "kt" | "mph";
export type AltitudeUnit = "m" | "ft";

export type StewardRole =
  | "club"
  | "site_holder"
  | "flight_park"
  | "operator"
  | "landowner"
  | "municipality"
  | "national_body"
  | "none"
  | "unknown";
export type Discipline = "PG" | "HG" | "PPG" | "WM" | "tandem" | "speedflying" | "parakite";
export type Tier = "green" | "amber" | "red";
export type Licence =
  "facts" | "cc-by-sa-3.0" | "odbl-1.0" | "cc-by-4.0" | "proprietary" | "unknown";

export interface SourceRef {
  providerId: string;
  url: string;
  fetchedAt: string; // ISO 8601 date or date-time
  licence: Licence;
  contentHash?: string;
}

export type PermissionStatus =
  | "not_requested"
  | "requested"
  | "granted_link"
  | "granted_embed"
  | "granted_feed"
  | "refused"
  | "withdrawn";

export interface Provider {
  id: string;
  name: string;
  homepage?: string; // absent for grouped providers (e.g. "club websites")
  termsUrl?: string;
  tier: Tier;
  licence: Licence;
  attribution: string; // exact display text (docs/05 §4.1); {name} placeholders filled per record
  uses: string; // what we take from it, in plain words
  method: string;
  schedule: string;
  countries: string[]; // country codes, or "*" for global providers
  permissionStatus: PermissionStatus;
  enabled: boolean;
  contact?: string;
  notes?: string;
  /** Automatic collection (M2): how often, and whether it is paused (e.g. awaiting a courtesy note). */
  collect?: { everyDays: number; paused?: boolean; pausedReason?: string };
}

export type OrgKind =
  | "governing_body"
  | "regional_association"
  | "club"
  | "school"
  | "tandem_operator"
  | "retailer"
  | "importer_distributor"
  | "manufacturer"
  | "service_centre"
  | "flight_park"
  | "site_holder"
  | "operator";

export type OrgVerification =
  "verified_public_source" | "listed_by_national_body" | "needs_verification" | "owner_confirmed";

export interface Organisation {
  id: string;
  legacyId?: string;
  slug: string;
  kind: OrgKind;
  additionalKinds?: OrgKind[]; // e.g. a school that also runs a shop (D40)
  name: string;
  aliases?: string[];
  externalIds?: Record<string, string>; // codes other sources use for it, e.g. { safa: "CG" } (D60)
  disciplines: Discipline[];
  country: CountryCode;
  regionCode?: RegionCode;
  locality?: string;
  postcode?: string;
  location?: { lat: number; lon: number };
  website?: string;
  emailPublic?: string; // only as published by the organisation or its national body
  phonePublic?: string;
  nationalBodyListed?: boolean; // appears in the national body's school directory
  summary?: string;
  brands?: string[];
  relatedOrgIds?: string[]; // same business, separate record (e.g. two bases) (D40)
  sources: SourceRef[];
  lastVerified: string; // ISO date
  verificationStatus: OrgVerification;
  hidden?: boolean;
}

export interface ClubContact {
  role: string;
  name?: string;
  phone?: string;
  email?: string;
  source: SourceRef;
}

export interface Club extends Organisation {
  kind: "club";
  regionalAssociationId?: string;
  siteIds: string[]; // derived: sites this club stewards or helps administer
  stationIds: string[]; // derived: stations the club owns
  contacts?: ClubContact[];
  joinUrl?: string;
  noticesUrl?: string;
  siteAccessNote?: string;
}

export type LaunchPrecision = "exact" | "approximate" | "withheld";

export interface Launch {
  id: string;
  name: string;
  lat?: number;
  lon?: number;
  precision: LaunchPrecision;
  altitudeM?: number;
}

export interface WindArc {
  fromDeg: number;
  toDeg: number;
}

export type SiteStatus = "open" | "closed" | "restricted" | "unknown";

export interface Site {
  id: string;
  slug: string;
  name: string;
  country: CountryCode;
  regionCode: RegionCode;
  area?: string;
  siteGuideUrl?: string;
  typeText?: string;
  heightText?: string;
  ratingText?: string;
  conditionsText?: string;
  windRanges: WindArc[] | "all";
  windRangeLabel: string;
  ratingSystem?: string;
  ippiLevel?: number;
  status: SiteStatus;
  stewardOrgId?: string;
  stewardRole: StewardRole;
  stewardNote?: string;
  listedContact?: ListedContact;
  alsoAdministeredBy?: { orgId: string; note?: string }[];
  siteAccessNote?: string;
  officialGuideUrl?: string;
  launches: Launch[];
  mainLandingName?: string;
  stationIds: string[];
  wtfSlug?: string;
  pgeId?: string; // ParaglidingEarth site ID, for community-layer sites and pinned sample sites
  disciplines: Discipline[];
  layer: "ansg" | "pge" | "manual";
  sources: SourceRef[];
  hidden?: boolean;
}

export type StationVerification =
  "verified_public_source" | "linked_by_club" | "listed_on_provider_index" | "needs_verification";

export interface Station {
  id: string;
  legacyId?: string;
  providerId: string;
  providerRef: string;
  name: string;
  country: CountryCode;
  url?: string; // public live page; always present unless hidden
  lat?: number;
  lon?: number;
  ownerOrgId?: string;
  ownerLabel?: string;
  embedAllowed: boolean;
  feedAllowed: boolean;
  verificationStatus: StationVerification;
  hidden?: boolean;
}

export type EventType =
  "competition" | "fly_in" | "clinic" | "siv" | "meeting" | "social" | "festival" | "other";

export interface EventItem {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  type: EventType;
  disciplines: Discipline[];
  locationText?: string;
  country: CountryCode;
  regionCode?: RegionCode;
  location?: { lat: number; lon: number };
  organiserOrgId?: string;
  organiserName?: string; // as the source names it; linked to organiserOrgId only on an exact match
  url: string;
  sources: SourceRef[];
}

export interface Notice {
  id: string;
  title: string;
  date: string;
  url: string;
  country: CountryCode;
  scope: "national" | "club" | "site";
  orgId?: string;
  siteIds?: string[];
  sources: SourceRef[];
}

export type DistributorRole =
  "official_importer" | "core_importer" | "dealer" | "service_agent" | "certified_service";

export interface Brand {
  id: string;
  name: string;
  website?: string;
  distributors: { orgId: string; role: DistributorRole }[];
}

export type OfferingType =
  | "tandem"
  | "intro_course"
  | "licence_course"
  | "endorsement"
  | "siv"
  | "xc_clinic"
  | "tour"
  | "guiding"
  | "service";

export interface Offering {
  orgId: string;
  type: OfferingType;
  discipline?: Discipline;
  title: string;
  priceFrom?: number;
  currency?: string; // ISO 4217, from the organisation's country
  priceText?: string;
  durationText?: string;
  inclusions?: string[];
  url: string;
  source: SourceRef;
}

export interface Resource {
  id: string;
  legacyId?: string;
  name: string;
  url: string;
  category: string;
  summary?: string;
  providerId?: string;
  countries?: CountryCode[];
}

export interface NationalBody {
  orgId: string;
  name: string;
  url: string;
  membershipLine: string;
  visitingPilotsUrl?: string;
  joinUrl?: string;
}

export interface Country {
  code: CountryCode;
  name: string;
  enabled: boolean;
  default?: boolean;
  regionLabel: string;
  regions: RegionCode[];
  regionNames: Record<RegionCode, string>; // display names, e.g. "AU-NSW": "New South Wales"
  timezones: string[];
  currency: string;
  defaultUnits: { speed: SpeedUnit; altitude: AltitudeUnit };
  nationalBody: NationalBody;
  map?: { lat: number; lon: number; zoom: number }; // overview map centre (D44)
  ratingsNote: string;
  primarySiteSource: string;
  coverage: "full" | "sample";
}

/** One line in the build/ingest report (docs/05 §6). Ingest fields arrive in M2. */
export interface BuildWarning {
  code: string;
  message: string;
  recordId?: string;
}

export type RunStatus = "ok" | "warning" | "blocked" | "failed" | "unchanged";

/** One provider's latest collection run (docs/05 §6), shown on /status. */
export interface ProviderRun {
  status: RunStatus;
  startedAt: string;
  finishedAt: string;
  recordsFound: number;
  recordsChanged: number;
  warnings: string[];
  guardDecision?: "accepted" | "accepted_first_run" | "blocked_drop" | "blocked_invalid";
  lastSuccessAt?: string;
  contentHash?: string;
  info?: string[]; // neutral notes, e.g. what each club website gave
  sourceVersion?: string; // the source's own version tag, sent back to ask "has it changed?"
}

export interface BuildReport {
  build: {
    counts: Record<string, number>;
    warnings: BuildWarning[];
  };
  providers: Record<string, ProviderRun>;
}

/** An organisation as a source lists it, before it is matched to the directory (docs/05 §5.4). */
export interface CollectedOrg {
  id: string; // provider-scoped, e.g. "safa:club:CG"
  providerId: string;
  kind: OrgKind;
  name: string;
  country: CountryCode;
  regionCode?: RegionCode;
  locality?: string;
  postcode?: string;
  website?: string;
  emailPublic?: string; // the contact published for the organisation, never committee members' (D53)
  phonePublic?: string;
  disciplines: Discipline[];
  associationName?: string; // the regional association the source links it to
  externalId?: string; // the source's own code for it, e.g. SAFA's club code
  source: SourceRef;
}

/** A club's own web page naming sites: the second source that confirms a steward (D47). */
export interface StewardEvidence {
  id: string;
  orgId: string;
  url: string;
  siteIds: string[];
  source: SourceRef;
}

/** A site contact as listed by a site guide: a pointer to the steward, not proof (D47). */
export interface ListedContact {
  name: string;
  url?: string;
  orgId?: string; // matched exactly by website address or alias, never guessed
  providerId: string;
  clubRef?: { providerId: string; id: string }; // the club's code at another source, e.g. SAFA's (D60)
}
