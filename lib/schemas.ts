// All Zod schemas, mirroring lib/types.ts (docs/04). The remaining schemas arrive in M1.
import { z } from "zod";
import type { Country } from "./types";

const optionalUrl = z
  .string()
  .transform((v) => (v.trim() === "" ? undefined : v))
  .pipe(z.url().optional())
  .optional();

/**
 * Validates one entry of data/manual/countries.yaml. The file names the national body by its
 * seed `orgLegacyId` (e.g. GOV-001); until organisations are imported in M1 that legacy ID
 * stands in for `orgId` (docs/10 C23).
 */
export const countrySchema = z
  .object({
    code: z.string().regex(/^[A-Z]{2}$/),
    name: z.string().min(1),
    enabled: z.boolean(),
    default: z.boolean().optional(),
    regionLabel: z.string().min(1),
    regions: z.array(z.string().regex(/^[A-Z]{2}-[A-Z0-9]{1,3}$/)).min(1),
    timezones: z.array(z.string().min(1)).min(1),
    currency: z.string().regex(/^[A-Z]{3}$/),
    defaultUnits: z.object({
      speed: z.enum(["kmh", "kt", "mph"]),
      altitude: z.enum(["m", "ft"]),
    }),
    nationalBody: z.object({
      orgLegacyId: z.string().min(1),
      name: z.string().min(1),
      url: z.url(),
      membershipLine: z.string().min(1),
      visitingPilotsUrl: optionalUrl,
      joinUrl: optionalUrl,
    }),
    ratingsNote: z.string().min(1),
    primarySiteSource: z.string().min(1),
    coverage: z.enum(["full", "sample"]),
  })
  .transform(({ nationalBody: { orgLegacyId, ...body }, ...rest }): Country => ({
    ...rest,
    nationalBody: { orgId: orgLegacyId, ...body },
  }));

export const countriesFileSchema = z.array(countrySchema).min(1);
