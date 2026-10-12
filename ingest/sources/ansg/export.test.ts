import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { chooseContact, parseExport, short, siteGuidePage, type SiteGuideExport } from "./export";

const data = JSON.parse(
  readFileSync(path.join(__dirname, "fixtures", "export.json"), "utf8"),
) as SiteGuideExport;
const { sites, skipped } = parseExport(data);
const byName = (n: string) => sites.find((s) => s.name === n);

describe("parseExport", () => {
  it("reads short facts, launches and the listed contact with its SAFA club code", () => {
    expect(byName("Tunkalilla")).toEqual({
      name: "Tunkalilla",
      siteGuideUrl: "https://siteguide.org.au/Sites/Details/Tunkalilla",
      typeText: "Coastal ridge ~ 10 km",
      heightText: "280'/85m asl, 250' agl",
      ratingText: "PG2 / HG Supervised, top landing HG Intermediate",
      conditionsText: "SE - SSW",
      contact: {
        name: "South Australian Hang Gliding & Paragliding Association",
        url: "https://sites.google.com/site/sahpgahome/",
        clubRef: { providerId: "safa", id: "SAHPGA" },
      },
      launches: [{ name: "Launch", lat: -35.6342, lon: 138.3155 }],
      status: "open",
    });
  });

  it("marks closed sites closed without copying the reason", () => {
    expect(byName("Myponga Cliffs")?.status).toBe("closed");
  });

  it("never copies prose, phone numbers or addresses", () => {
    const json = JSON.stringify(sites);
    expect(json).not.toContain("must not be copied");
    expect(json).not.toContain("0400 000 000");
    expect(json).not.toContain("Example Street");
  });

  it("trims names but keeps the page address the Site Guide uses, and drops long fields", () => {
    const bluff = byName("Example Bluff");
    expect(bluff?.siteGuideUrl).toBe(
      "https://siteguide.org.au/Sites/Details/%20Example%20Bluff%20",
    );
    expect(bluff?.conditionsText).toBeUndefined();
  });

  it("skips a site with no launch position", () => {
    expect(skipped).toEqual(["No Launch Site"]);
  });
});

describe("chooseContact", () => {
  it("prefers the responsible body with a club code over a person listed as contact", () => {
    expect(byName("Example Bluff")?.contact).toEqual({
      name: "Example Club",
      url: "https://club.example/",
      clubRef: { providerId: "safa", id: "EX" },
    });
  });

  it("falls back to a contact without a code, and lists nothing when there is none", () => {
    expect(chooseContact([{ isContact: true, name: "Some Club", link: "not a link" }])).toEqual({
      name: "Some Club",
      url: undefined,
      clubRef: undefined,
    });
    expect(chooseContact([])).toBeUndefined();
  });
});

describe("helpers", () => {
  it("keeps short fields only", () => {
    expect(short("  NW,   WNW ")).toBe("NW, WNW");
    expect(short("x".repeat(81))).toBeUndefined();
  });

  it("builds page addresses like the Site Guide's own links", () => {
    expect(siteGuidePage("Catherine Hill Bay (Catho's)")).toBe(
      "https://siteguide.org.au/Sites/Details/Catherine%20Hill%20Bay%20(Catho's)",
    );
    expect(siteGuidePage("Buchy's, at Gerrards Lookout")).toBe(
      "https://siteguide.org.au/Sites/Details/Buchy's,%20at%20Gerrards%20Lookout",
    );
  });
});
