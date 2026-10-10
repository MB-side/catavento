import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import { format, lookup, t, tOr } from "./messages";

function leaves(node: unknown, prefix = ""): [string, string][] {
  if (typeof node === "string") return [[prefix, node]];
  return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) =>
    leaves(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe("messages", () => {
  it("formats placeholders and keeps unknown ones visible", () => {
    expect(format("Flying in {country}", { country: "New Zealand" })).toBe("Flying in New Zealand");
    expect(format("Hi {name}")).toBe("Hi {name}");
  });

  it("looks up nested keys", () => {
    expect(lookup(en, "nav.mySites")).toBe("My Sites");
    expect(lookup(en, "nav.nope")).toBeUndefined();
    expect(t("nav.newToFlying")).toBe("New to flying");
  });

  it("falls back for runtime keys", () => {
    expect(tOr("banner.affiliations.XX", "banner.affiliations.default")).toBe(
      t("banner.affiliations.default"),
    );
  });

  it("writes the name as HouseThermal and never uses unsafe wording", () => {
    for (const [key, text] of leaves(en)) {
      expect(text, key).not.toMatch(/House Thermal|Housethermal/);
      expect(text, key).not.toMatch(/\bflyable\b|\bsafe\b/i);
    }
  });

  it("keeps SAFA out of every message except the Australian banner text", () => {
    for (const [key, text] of leaves(en)) {
      if (key === "banner.affiliations.AU") continue;
      expect(text, key).not.toMatch(/\bSAFA\b/);
    }
  });
});
