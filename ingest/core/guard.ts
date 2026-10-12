// The change guard (docs/05 §3, docs/10 C8): if a provider's record count drops by more than 20%
// against its last good run, or more than 10% of records are invalid, keep the previous data.

export type GuardDecision = "accepted" | "accepted_first_run" | "blocked_drop" | "blocked_invalid";

export interface GuardResult {
  decision: GuardDecision;
  reason?: string;
}

export const MAX_DROP = 0.2;
export const MAX_INVALID = 0.1;

/**
 * `validCount` counts the stable records (sites, directory entries) that the drop rule compares;
 * `totalValid` counts every valid record, for the invalid-share rule. Without it, they're the same.
 */
export function changeGuard(input: {
  previousCount: number | undefined;
  validCount: number;
  invalidCount: number;
  totalValid?: number;
}): GuardResult {
  const total = (input.totalValid ?? input.validCount) + input.invalidCount;
  if (input.invalidCount > 0 && input.invalidCount / total > MAX_INVALID) {
    return {
      decision: "blocked_invalid",
      reason: `${input.invalidCount} of ${total} records invalid (more than ${MAX_INVALID * 100}%)`,
    };
  }
  if (input.previousCount === undefined) {
    if (total === 0) return { decision: "blocked_drop", reason: "No records found" };
    return { decision: "accepted_first_run", reason: "No earlier run to compare with" };
  }
  if (input.previousCount === 0) return { decision: "accepted" };
  const drop = (input.previousCount - input.validCount) / input.previousCount;
  if (drop > MAX_DROP) {
    return {
      decision: "blocked_drop",
      reason:
        input.validCount === 0
          ? "No records found"
          : `Records fell from ${input.previousCount} to ${input.validCount} (more than ${MAX_DROP * 100}%)`,
    };
  }
  return { decision: "accepted" };
}

export const isBlocked = (d: GuardDecision) => d === "blocked_drop" || d === "blocked_invalid";
