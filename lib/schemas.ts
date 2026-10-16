// All Zod schemas, mirroring lib/types.ts (docs/04). Output schemas validate data/generated/*.json;
// input schemas validate the hand-edited files in data/manual/.
import { z } from "zod";
import type {
  BuildReport,
  Club,
  CollectedOrg,
  Country,
  EventItem,
  Notice,
  Offering,
  Organisation,
  Provider,
  Resource,
  Site,
  SiteStationEntry,
  Station,
  StewardEvidence,
  Brand,
  ProviderRun,
  CountryGuide,
  OverviewRegion,
  OverviewSite,
  TourOperator,
  VisitorHelp,
  VisitorService,
} from "./types";

// ---------- shared pieces ----------

const isoDateOrTime = z.union([z.iso.date(), z.iso.datetime({ offset: true })]);
const countryCode = z.string().regex(/^[A-Z]{2}$/);
const regionCode = z.string().regex(/^[A-Z]{2}-[A-Z0-9]{1,3}$/);
const httpUrl = z.url({ protocol: /^https?$/ });

/** Blank strings in YAML ("") mean "not set". */
const optionalUrl = z
  .string()
  .transform((v) => (v.trim() === "" ? undefined : v))
  .pipe(httpUrl.optional())
  .optional();

export const disciplineSchema = z.enum([
  "PG",
  "HG",
  "PPG",
  "WM",
  "tandem",
  "speedflying",
  "parakite",
]);
export const tierSchema = z.enum(["green", "amber", "red"]);
export const licenceSchema = z.enum([
  "facts",
  "cc-by-sa-3.0",
  "odbl-1.0",
  "cc-by-4.0",
  "proprietary",
  "unknown",
]);
export const orgKindSchema = z.enum([
  "governing_body",
  "regional_association",
  "club",
  "school",
  "tandem_operator",
  "retailer",
  "importer_distributor",
  "manufacturer",
  "service_centre",
  "flight_park",
  "site_holder",
  "operator",
]);
export const stewardRoleSchema = z.enum([
  "club",
  "site_holder",
  "flight_park",
  "operator",
  "landowner",
  "municipality",
  "national_body",
  "none",
  "unknown",
]);

export const sourceRefSchema = z.object({
  providerId: z.string().min(1),
  url: httpUrl,
  fetchedAt: isoDateOrTime,
  licence: licenceSchema,
  contentHash: z.string().optional(),
});

const latLon = z.object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180) });

// ---------- generated data (output) ----------

export const providerSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  homepage: httpUrl.optional(),
  termsUrl: httpUrl.optional(),
  tier: tierSchema,
  licence: licenceSchema,
  attribution: z.string().min(1),
  uses: z.string().min(1),
  method: z.string().min(1),
  schedule: z.string().min(1),
  countries: z.array(z.union([countryCode, z.literal("*")])).min(1),
  permissionStatus: z.enum([
    "not_requested",
    "requested",
    "granted_link",
    "granted_embed",
    "granted_feed",
    "refused",
    "withdrawn",
  ]),
  enabled: z.boolean(),
  contact: z.string().optional(),
  notes: z.string().optional(),
  collect: z
    .object({
      everyDays: z.number().positive(),
      paused: z.boolean().optional(),
      pausedReason: z.string().optional(),
    })
    .optional(),
}) satisfies z.ZodType<Provider>;

export const gearCategorySchema = z.enum([
  "paragliders",
  "mini-speed-wings",
  "paramotors",
  "hang-gliders",
  "trikes",
  "harnesses",
  "pod-harnesses",
  "reserves",
  "instruments",
  "helmets-accessories",
  "service",
]);

export const gearCategoriesFileSchema = z
  .array(
    z.object({
      org: z.string().min(1),
      sells: z.array(gearCategorySchema).min(1),
      used: z.boolean().optional(), // sells second-hand gear too (D84)
      source: httpUrl,
      checked: z.iso.date(),
    }),
  )
  .nullable();

const sitePointSchema = z.object({
  name: z.string().optional(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  altitudeM: z.number().optional(),
  serves: z.enum(["takeoff", "landing"]).optional(),
});

/** Broken outside links accepted for now, each with a reason and a date to look again (D80). */
export const linkExceptionsFileSchema = z
  .array(z.object({ url: httpUrl, reason: z.string().min(1), review: z.iso.date() }))
  .nullable();

/** Wind directions a club publishes for a site the main source gives none for (D78). */
export const siteWindFileSchema = z
  .array(
    z.object({
      site: z.string().min(1),
      wind: z.string().min(1),
      org: z.string().min(1),
      source: httpUrl,
      checked: z.iso.date(),
    }),
  )
  .nullable();

const organisationShape = {
  id: z.string().regex(/^org:[a-z]{2}:[a-z0-9-]+$/),
  legacyId: z.string().optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  kind: orgKindSchema,
  additionalKinds: z.array(orgKindSchema).optional(),
  name: z.string().min(1),
  aliases: z.array(z.string()).optional(),
  externalIds: z.record(z.string(), z.string()).optional(),
  sells: z.array(gearCategorySchema).optional(),
  sellsUsed: z.boolean().optional(),
  disciplines: z.array(disciplineSchema),
  country: countryCode,
  regionCode: regionCode.optional(),
  locality: z.string().optional(),
  postcode: z.string().optional(),
  location: latLon.optional(),
  website: httpUrl.optional(),
  emailPublic: z.email().optional(),
  phonePublic: z.string().optional(),
  nationalBodyListed: z.boolean().optional(),
  summary: z.string().optional(),
  brands: z.array(z.string()).optional(),
  relatedOrgIds: z.array(z.string()).optional(),
  sources: z.array(sourceRefSchema).min(1),
  lastVerified: z.iso.date(),
  verificationStatus: z.enum([
    "verified_public_source",
    "listed_by_national_body",
    "needs_verification",
    "owner_confirmed",
  ]),
  hidden: z.boolean().optional(),
};

export const organisationSchema = z.object(organisationShape) satisfies z.ZodType<Organisation>;

export const clubSchema = z.object({
  ...organisationShape,
  kind: z.literal("club"),
  regionalAssociationId: z.string().optional(),
  siteIds: z.array(z.string()),
  stationIds: z.array(z.string()),
  contacts: z
    .array(
      z.object({
        role: z.string(),
        name: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        source: sourceRefSchema,
      }),
    )
    .optional(),
  joinUrl: httpUrl.optional(),
  noticesUrl: httpUrl.optional(),
  siteAccessNote: z.string().optional(),
}) satisfies z.ZodType<Club>;

/** Clubs carry the extra club fields; everything else is a plain organisation. */
export const anyOrganisationSchema = z.union([
  clubSchema,
  organisationSchema.refine((o) => o.kind !== "club"),
]);

export const siteSchema = z.object({
  id: z.string().regex(/^site:[a-z]{2}:[a-z0-9]{1,3}:[a-z0-9-]+$/),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  country: countryCode,
  regionCode: regionCode,
  area: z.string().optional(),
  siteGuideUrl: httpUrl.optional(),
  typeText: z.string().optional(),
  heightText: z.string().optional(),
  ratingText: z.string().optional(),
  conditionsText: z.string().optional(),
  windRanges: z.union([
    z.literal("all"),
    z.array(z.object({ fromDeg: z.number().min(0).max(360), toDeg: z.number().min(0).max(360) })),
  ]),
  windMarginal: z
    .array(z.object({ fromDeg: z.number().min(0).max(360), toDeg: z.number().min(0).max(360) }))
    .optional(),
  windRangeLabel: z.string().min(1),
  ratingSystem: z.string().optional(),
  ippiLevel: z.number().int().optional(),
  status: z.enum(["open", "closed", "restricted", "unknown"]),
  stewardOrgId: z.string().optional(),
  stewardRole: stewardRoleSchema,
  stewardNote: z.string().optional(),
  listedContact: z
    .object({
      name: z.string().min(1),
      url: httpUrl.optional(),
      orgId: z.string().optional(),
      providerId: z.string().min(1),
      clubRef: z.object({ providerId: z.string(), id: z.string() }).optional(),
    })
    .optional(),
  alsoAdministeredBy: z
    .array(z.object({ orgId: z.string(), note: z.string().optional() }))
    .optional(),
  siteAccessNote: z.string().optional(),
  officialGuideUrl: httpUrl.optional(),
  launches: z.array(
    z
      .object({
        id: z.string(),
        name: z.string(),
        lat: z.number().optional(),
        lon: z.number().optional(),
        precision: z.enum(["exact", "approximate", "withheld"]),
        altitudeM: z.number().optional(),
      })
      // Withheld coordinates are never stored (docs/04 §5).
      .refine((l) => l.precision !== "withheld" || (l.lat === undefined && l.lon === undefined), {
        message: "withheld launches must not store coordinates",
      }),
  ),
  mainLandingName: z.string().optional(),
  stationIds: z.array(z.string()),
  stationDistancesKm: z.record(z.string(), z.number().positive()).optional(),
  flyingTypes: z.array(z.enum(["thermal", "soaring", "xc", "flatland", "winch"])).optional(),
  landings: z.array(sitePointSchema).optional(),
  parking: z.array(sitePointSchema).optional(),
  windSource: z.object({ name: z.string(), url: httpUrl }).optional(),
  wtfSlug: z.string().optional(),
  pgeId: z.string().optional(),
  disciplines: z.array(disciplineSchema),
  layer: z.enum(["ansg", "pge", "manual"]),
  sources: z.array(sourceRefSchema).min(1),
  hidden: z.boolean().optional(),
}) satisfies z.ZodType<Site>;

export const stationSchema = z
  .object({
    id: z.string().regex(/^station:[a-z0-9-]+:[a-z0-9-]+$/),
    legacyId: z.string().optional(),
    providerId: z.string().min(1),
    providerRef: z.string(),
    name: z.string().min(1),
    country: countryCode,
    url: httpUrl.optional(),
    lat: z.number().optional(),
    lon: z.number().optional(),
    ownerOrgId: z.string().optional(),
    ownerLabel: z.string().optional(),
    embedAllowed: z.boolean(),
    feedAllowed: z.boolean(),
    verificationStatus: z.enum([
      "verified_public_source",
      "linked_by_club",
      "listed_on_provider_index",
      "needs_verification",
    ]),
    hidden: z.boolean().optional(),
  })
  .refine((s) => s.hidden === true || s.url !== undefined, {
    message: "visible stations need a live page address",
  }) satisfies z.ZodType<Station>;

export const eventSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  startDate: isoDateOrTime,
  endDate: isoDateOrTime.optional(),
  type: z.enum([
    "competition",
    "fly_in",
    "clinic",
    "siv",
    "meeting",
    "social",
    "festival",
    "other",
  ]),
  disciplines: z.array(disciplineSchema),
  locationText: z.string().optional(),
  country: countryCode,
  regionCode: regionCode.optional(),
  location: latLon.optional(),
  organiserOrgId: z.string().optional(),
  organiserName: z.string().optional(),
  url: httpUrl,
  sources: z.array(sourceRefSchema).min(1),
}) satisfies z.ZodType<EventItem>;

export const noticeSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  date: isoDateOrTime,
  url: httpUrl,
  country: countryCode,
  scope: z.enum(["national", "club", "site"]),
  orgId: z.string().optional(),
  siteIds: z.array(z.string()).optional(),
  sources: z.array(sourceRefSchema).min(1),
}) satisfies z.ZodType<Notice>;

export const collectedOrgSchema = z.object({
  id: z.string().min(1),
  providerId: z.string().min(1),
  kind: orgKindSchema,
  name: z.string().min(1),
  country: countryCode,
  regionCode: regionCode.optional(),
  locality: z.string().optional(),
  postcode: z.string().optional(),
  website: httpUrl.optional(),
  emailPublic: z.email().optional(),
  phonePublic: z.string().optional(),
  disciplines: z.array(disciplineSchema),
  associationName: z.string().optional(),
  externalId: z.string().optional(),
  source: sourceRefSchema,
}) satisfies z.ZodType<CollectedOrg>;

export const stewardEvidenceSchema = z.object({
  id: z.string().min(1),
  orgId: z.string().min(1),
  url: httpUrl,
  siteIds: z.array(z.string()),
  source: sourceRefSchema,
}) satisfies z.ZodType<StewardEvidence>;

export const brandsFileSchema = z
  .array(
    z.object({
      name: z.string().min(1),
      website: optionalUrl,
      distributors: z.array(
        z.object({
          org: z.string().min(1), // seed legacy ID or organisation ID
          role: z.enum([
            "official_importer",
            "core_importer",
            "dealer",
            "service_agent",
            "certified_service",
          ]),
          basis: z.enum(["brand", "self"]).optional(), // default "self" (D84)
          source: httpUrl.optional(),
          checked: z.iso.date().optional(),
        }),
      ),
      source: z.string().optional(),
      // The brand's own dealer or distributor list, linked from Where to buy (D84).
      dealerPage: z.object({ url: httpUrl, checked: z.iso.date() }).optional(),
    }),
  )
  .nullable();

export const brandSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  website: httpUrl.optional(),
  distributors: z.array(
    z.object({
      orgId: z.string(),
      role: z.enum([
        "official_importer",
        "core_importer",
        "dealer",
        "service_agent",
        "certified_service",
      ]),
      basis: z.enum(["brand", "self"]),
      source: httpUrl.optional(),
      checked: z.iso.date().optional(),
    }),
  ),
  dealerPage: z.object({ url: httpUrl, checked: z.iso.date() }).optional(),
}) satisfies z.ZodType<Brand>;

export const offeringSchema = z.object({
  orgId: z.string(),
  type: z.enum([
    "tandem",
    "intro_course",
    "licence_course",
    "endorsement",
    "siv",
    "xc_clinic",
    "tour",
    "guiding",
    "service",
  ]),
  discipline: disciplineSchema.optional(),
  title: z.string().min(1),
  priceFrom: z.number().positive().optional(),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .optional(),
  priceText: z.string().optional(),
  durationText: z.string().optional(),
  inclusions: z.array(z.string()).optional(),
  url: httpUrl,
  source: sourceRefSchema,
}) satisfies z.ZodType<Offering>;

export const resourceSchema = z.object({
  id: z.string().regex(/^resource:[a-z0-9-]+$/),
  legacyId: z.string().optional(),
  name: z.string().min(1),
  url: httpUrl,
  category: z.string().min(1),
  summary: z.string().optional(),
  providerId: z.string().optional(),
  countries: z.array(countryCode).optional(),
}) satisfies z.ZodType<Resource>;

/**
 * Validates one entry of data/manual/countries.yaml. The file names the national body by its
 * seed `orgLegacyId` (e.g. GOV-001); build-data resolves it to the organisation ID (docs/10 C23).
 */
export const countryInputSchema = z.object({
  code: countryCode,
  name: z.string().min(1),
  enabled: z.boolean(),
  default: z.boolean().optional(),
  regionLabel: z.string().min(1),
  regions: z.array(regionCode).min(1),
  regionNames: z.record(regionCode, z.string().min(1)),
  timezones: z.array(z.string().min(1)).min(1),
  currency: z.string().regex(/^[A-Z]{3}$/),
  defaultUnits: z.object({
    speed: z.enum(["kmh", "kt", "mph"]),
    altitude: z.enum(["m", "ft"]),
  }),
  nationalBody: z.object({
    orgLegacyId: z.string().min(1),
    name: z.string().min(1),
    url: httpUrl,
    membershipLine: z.string().min(1),
    visitingPilotsUrl: optionalUrl,
    joinUrl: optionalUrl,
    shortName: z.string().min(1).optional(),
    learnUrl: optionalUrl,
    feesUrl: optionalUrl,
    equipmentUrl: optionalUrl,
  }),
  map: z
    .object({
      lat: z.number().min(-90).max(90),
      lon: z.number().min(-180).max(180),
      zoom: z.number().int().min(1).max(18),
    })
    .optional(),
  ratingsNote: z.string().min(1),
  primarySiteSource: z.string().min(1),
  coverage: z.enum(["full", "sample"]),
  communitySites: z.boolean().optional(),
});
export const countriesFileSchema = z
  .array(
    countryInputSchema.refine((c) => c.regions.every((r) => c.regionNames[r]), {
      message: "every region in `regions` needs a name in `regionNames`",
    }),
  )
  .min(1);

export const countrySchema = z.object({
  ...countryInputSchema.shape,
  nationalBody: z.object({
    orgId: z.string().min(1),
    name: z.string().min(1),
    url: httpUrl,
    membershipLine: z.string().min(1),
    visitingPilotsUrl: httpUrl.optional(),
    joinUrl: httpUrl.optional(),
    shortName: z.string().min(1).optional(),
    learnUrl: httpUrl.optional(),
    feesUrl: httpUrl.optional(),
    equipmentUrl: httpUrl.optional(),
  }),
}) satisfies z.ZodType<Country>;

export const providerRunSchema = z.object({
  status: z.enum(["ok", "warning", "blocked", "failed", "unchanged"]),
  startedAt: z.iso.datetime({ offset: true }),
  finishedAt: z.iso.datetime({ offset: true }),
  recordsFound: z.number().int().min(0),
  recordsChanged: z.number().int().min(0),
  warnings: z.array(z.string()),
  guardDecision: z
    .enum(["accepted", "accepted_first_run", "blocked_drop", "blocked_invalid"])
    .optional(),
  lastSuccessAt: z.iso.datetime({ offset: true }).optional(),
  contentHash: z.string().optional(),
  info: z.array(z.string()).optional(),
  sourceVersion: z.string().optional(),
}) satisfies z.ZodType<ProviderRun>;

export const buildReportSchema = z.object({
  build: z.object({
    counts: z.record(z.string(), z.number()),
    warnings: z.array(
      z.object({ code: z.string(), message: z.string(), recordId: z.string().optional() }),
    ),
  }),
  providers: z.record(z.string(), providerRunSchema),
}) satisfies z.ZodType<BuildReport>;

// ---------- hand-edited inputs (data/manual) ----------

export const providersFileSchema = z.array(providerSchema).min(1);

const meta = { note: z.string().optional(), source: z.string().optional() };

export const orgMergesFileSchema = z.object({
  merge: z
    .array(z.object({ from: z.string(), into: z.array(z.string()).min(1), ...meta }))
    .default([]),
  related: z.array(z.object({ ids: z.array(z.string()).min(2), ...meta })).default([]),
});

/** Keyed by record ID or seed legacy ID; values are fields to set (validated after merging). */
export const overridesFileSchema = z
  .record(z.string(), z.record(z.string(), z.unknown()))
  .nullable();

export const clubAliasesFileSchema = z.record(
  countryCode,
  z.record(z.string(), z.string()).nullable(),
);

export const siteStationsFileSchema = z
  .record(
    z.string(),
    z.array(
      z.union([z.string(), z.object({ id: z.string(), km: z.number().positive() })]),
    ) satisfies z.ZodType<SiteStationEntry[]>,
  )
  .nullable();

export const siteStewardsFileSchema = z
  .record(z.string(), z.object({ org: z.string().optional(), role: stewardRoleSchema, ...meta }))
  .nullable();

export const nzSampleSitesFileSchema = z.array(
  z.object({
    name: z.string().min(1),
    region: regionCode,
    steward: z.object({ legacyId: z.string().optional(), role: stewardRoleSchema }),
    alsoAdministeredBy: z.object({ legacyId: z.string(), note: z.string().optional() }).optional(),
    officialGuideUrl: httpUrl.optional(),
    siteAccessNote: z.string().optional(),
    stations: z.array(z.string()).optional(),
    pgeIds: z.array(z.string().regex(/^\d+$/)).optional(),
    note: z.string().optional(),
    source: httpUrl,
  }),
);

export const offeringsFileSchema = z.array(
  z.object({
    org: z.string().min(1), // organisation name or legacy ID
    type: offeringSchema.shape.type,
    discipline: disciplineSchema.optional(),
    title: z.string().min(1),
    priceFromAud: z.number().positive().optional(), // legacy field name; becomes priceFrom + currency
    priceFrom: z.number().positive().optional(),
    priceText: z.string().optional(),
    durationText: z.string().optional(),
    inclusions: z.array(z.string()).optional(),
    url: httpUrl,
    sourceCheckedAt: z.union([
      z.iso.date(),
      z.date().transform((d) => d.toISOString().slice(0, 10)),
    ]),
    note: z.string().optional(),
  }),
);

// ---------- overview regions (D83) ----------

const windArcSchema = z.object({
  fromDeg: z.number().min(0).max(360),
  toDeg: z.number().min(0).max(360),
});

export const overviewSiteSchema = z.object({
  id: z.string().regex(/^pge:\d+$/),
  name: z.string().min(1),
  country: z.string().regex(/^[A-Z]{2}$/),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  altitudeM: z.number().optional(),
  windRanges: z.union([z.literal("all"), z.array(windArcSchema)]),
  windMarginal: z.array(windArcSchema).optional(),
  windLabel: z.string(),
  disciplines: z.array(disciplineSchema),
  flyingTypes: z.array(z.enum(["thermal", "soaring", "xc", "flatland", "winch"])).optional(),
  landing: z.object({ lat: z.number(), lon: z.number() }).optional(),
  url: httpUrl,
  fetchedAt: z.iso.datetime({ offset: true }),
}) satisfies z.ZodType<OverviewSite>;

export const overviewRegionSchema = z.object({
  slug: z.string().regex(/^[a-z-]+$/),
  name: z.string().min(1),
  countries: z
    .array(z.object({ code: z.string().regex(/^[A-Z]{2}$/), name: z.string().min(1) }))
    .min(1),
}) satisfies z.ZodType<OverviewRegion>;

export const overviewFileSchema = z.object({ regions: z.array(overviewRegionSchema).min(1) });

export const countryGuideSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(1),
  nationalBody: z.object({ name: z.string().min(1), url: httpUrl }).optional(),
  visitors: z.array(z.string().min(1)),
  learners: z.array(z.string().min(1)),
  links: z.array(z.object({ label: z.string().min(1), url: httpUrl })),
  sources: z.array(httpUrl),
  checked: z.iso.date(),
  practice: z.array(z.string().min(1)).optional(),
  rulesUrl: httpUrl.optional(),
}) satisfies z.ZodType<CountryGuide>;

export const guidesFileSchema = z.array(countryGuideSchema).nullable();

// ---------- visiting pilots (D89) ----------

export const visitorServiceSchema = z.enum([
  "guiding",
  "site-briefing",
  "shuttle",
  "tours",
  "gear-hire",
  "accommodation",
  "flight-park",
  "licence-help",
  "tandem",
  "courses",
]) satisfies z.ZodType<VisitorService>;

const isoCountry = z.string().regex(/^[A-Z]{2}$/);

/** data/manual/visiting.yaml: who helps visiting pilots, and who runs flying tours. */
export const visitingFileSchema = z
  .object({
    help: z
      .array(
        z.object({
          country: isoCountry,
          org: z.string().min(1).optional(), // organisation ID or seed legacy ID, for listed businesses
          name: z.string().min(1).optional(),
          website: httpUrl.optional(),
          area: z.string().min(1).optional(),
          services: z.array(visitorServiceSchema).min(1),
          note: z.string().min(1).optional(),
          source: httpUrl,
          checked: z.iso.date(),
        }),
      )
      .default([]),
    tours: z
      .array(
        z.object({
          name: z.string().min(1),
          website: httpUrl,
          basedIn: isoCountry,
          destinations: z.array(isoCountry).min(1),
          forPilots: z.string().min(1).optional(),
          source: httpUrl,
          checked: z.iso.date(),
        }),
      )
      .default([]),
  })
  .nullable();

export const visitorHelpSchema = z.object({
  id: z.string(),
  country: isoCountry,
  name: z.string().min(1),
  website: httpUrl.optional(),
  orgId: z.string().optional(),
  area: z.string().min(1).optional(),
  services: z.array(visitorServiceSchema).min(1),
  note: z.string().min(1).optional(),
  source: httpUrl,
  checked: z.iso.date(),
}) satisfies z.ZodType<VisitorHelp>;

export const tourOperatorSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  website: httpUrl,
  basedIn: isoCountry,
  destinations: z.array(isoCountry).min(1),
  forPilots: z.string().min(1).optional(),
  source: httpUrl,
  checked: z.iso.date(),
}) satisfies z.ZodType<TourOperator>;
