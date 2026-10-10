// All shared data types (docs/04 §2). The remaining types arrive with the data layer in M1.

/** ISO 3166-1 alpha-2, e.g. "AU", "NZ"; must exist in countries.yaml. */
export type CountryCode = string;
/** ISO 3166-2, e.g. "AU-NSW", "NZ-CAN". */
export type RegionCode = string;

export type SpeedUnit = "kmh" | "kt" | "mph";
export type AltitudeUnit = "m" | "ft";

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
  timezones: string[];
  currency: string;
  defaultUnits: { speed: SpeedUnit; altitude: AltitudeUnit };
  nationalBody: NationalBody;
  ratingsNote: string;
  primarySiteSource: string;
  coverage: "full" | "sample";
}
