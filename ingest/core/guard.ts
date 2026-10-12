// The change guard (docs/05 §3, docs/10 C8): if a provider's record count drops by more than 20%
// against its last good run, or more than 10% of records are invalid, keep the previous data.

export type GuardDecision = "accepted" | "accepted_first_run" | "blocked_drop" | "blocked_invalid";

export interface GuardResult {
  decision: GuardDecision;
  reason?: string;
}

export const MAX_DROP = 0.2;
export const MAX_INVALID = 0.1;

export function changeGuard(input: {
  previousCount: number | undefined;
  validCount: number;
  invalidCount: number;
}): GuardResult {
  const total = input.validCount + input.invalidCount;
  if (total === 0) return { decision: "blocked_drop", reason: "No records found" };
  if (input.invalidCount / total > MAX_INVALID) {
    return {
      decision: "blocked_invalid",
      reason: `${input.invalidCount} of ${total} records invalid (more than ${MAX_INVALID * 100}%)`,
    };
  }
  if (input.previousCount === undefined || input.previousCount === 0) {
    return { decision: "accepted_first_run", reason: "No earlier run to compare with" };
  }
  const drop = (input.previousCount - input.validCount) / input.previousCount;
  if (drop > MAX_DROP) {
    return {
      decision: "blocked_drop",
      reason: `Records fell from ${input.previousCount} to ${input.validCount} (more than ${MAX_DROP * 100}%)`,
    };
  }
  return { decision: "accepted" };
}

export const isBlocked = (d: GuardDecision) => d === "blocked_drop" || d === "blocked_invalid";
