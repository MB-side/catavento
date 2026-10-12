import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { clubEmail, toCollectedOrg, toEvent } from "./collect";
import {
  cleanName,
  cleanWebsite,
  eventType,
  localIso,
  parseClubDetail,
  parseDefectNotices,
  parseDirectory,
  stateFromAddress,
  type SafaEventsPage,
} from "./parse";

const fixture = (name: string) => readFileSync(path.join(__dirname, "fixtures", name), "utf8");
const AU = { code: "AU", regions: new Set(["AU-ACT", "AU-NSW", "AU-QLD", "AU-VIC", "AU-WA"]) };

describe("small helpers", () => {
  it("takes the last state in an address", () => {
    expect(stateFromAddress("PO Box 2 Port Douglas, Qld 4870  QLD 4877")).toBe("QLD");
    expect(stateFromAddress("PO Box 1ALBANY, WA  6332  WA 6332")).toBe("WA");
    expect(stateFromAddress("Lockhart, NSW, 2656 NSW")).toBe("NSW");
    expect(stateFromAddress("no state here")).toBeUndefined();
  });

  it("cleans names and websites", () => {
    expect(cleanName("Queensland Sports Aviators Inc. - ")).toBe("Queensland Sports Aviators Inc.");
    expect(cleanWebsite("www.flycanungra.com.au/")).toBe("https://www.flycanungra.com.au/");
    expect(cleanWebsite("mailto:x@example.org")).toBeUndefined();
    expect(cleanWebsite("/find-a-club/club/?id=AL")).toBeUndefined();
  });

  it("keeps an event's local time with its offset", () => {
    expect(localIso("2026-10-17 19:00:00", "2026-10-17 08:00:00")).toBe(
      "2026-10-17T19:00:00+11:00",
    );
    expect(localIso("2026-06-01 09:30:00", "2026-06-01 01:00:00")).toBe(
      "2026-06-01T09:30:00+08:30",
    );
  });

  it("reads an event's type from its categories, then its title", () => {
    expect(eventType("Bright Open", ["Competition"])).toBe("competition");
    expect(eventType("Manilla fly-in weekend", ["Club"])).toBe("fly_in");
    expect(eventType("Club AGM", [])).toBe("meeting");
    expect(eventType("50th anniversary of free flight", ["Club", "Community"])).toBe("other");
  });
});

describe("parseDirectory", () => {
  it("reads club cards: name, state, club email and SAFA page", () => {
    const clubs = parseDirectory(fixture("clubs.html"));
    expect(clubs.map((c) => [c.name, c.state, c.email, c.detailPath])).toEqual([
      ["ACTHPA", "ACT", "office@example.org", "/find-a-club/club/?id=ACTHPA"],
      ["Albany Hang Gliding Club Inc", "WA", undefined, "/find-a-club/club/?id=AL"],
      ["Cairns Hang Gliding Club Inc", "QLD", "flying@example.org", "/find-a-club/club/?id=CN"],
      ["Queensland Sports Aviators Inc.", "QLD", undefined, "/find-a-club/club/?id=SEQLD"],
      ["Paradise Flyers QLD", "QLD", undefined, "/find-a-club/club/?id=PFI"],
    ]);
  });

  it("reads school cards with disciplines, phone and website", () => {
    const schools = parseDirectory(fixture("schools.html"));
    expect(schools).toHaveLength(3);
    expect(schools[0]).toMatchObject({
      name: "Air Sports",
      state: "NSW",
      disciplines: ["HG", "PG"],
      phone: "0400 000 001",
      website: "https://air-sports.com.au/",
    });
    expect(schools[1]).toMatchObject({
      name: "DTK Microlights",
      disciplines: ["WM"],
      website: undefined,
    });
    expect(schools[2]?.email).toBe("fly@example.com");
  });

  it("never keeps a street address", () => {
    const json = JSON.stringify(parseDirectory(fixture("schools.html")));
    expect(json).not.toContain("Example Street");
  });
});

describe("parseClubDetail", () => {
  it("reads the club's own email, website and association, not its committee", () => {
    const d = parseClubDetail(fixture("club-detail.html"));
    expect(d).toEqual({
      name: "Sydney Paragliding and Hang Gliding Club",
      email: "club@example.org",
      website: "https://www.flysydney.com.au/",
      association: "New South Wales Hang Gliding and Paragliding Association Inc.",
    });
    expect(JSON.stringify(d)).not.toMatch(/Pat Example|pat@example|0400/);
  });

  it("handles a website without https:// and no club email", () => {
    expect(parseClubDetail(fixture("club-detail-bare.html"))).toEqual({
      name: "Canungra Hang Gliding Club Inc",
      website: "https://www.flycanungra.com.au/",
      association: "Queensland Sports Aviators Inc.",
    });
  });
});

describe("parseDefectNotices", () => {
  it("takes dated titles and links from the Defect Reports table only", () => {
    const { notices, undated } = parseDefectNotices(fixture("resources.html"));
    expect(notices).toEqual([
      {
        title: "Safety Notice: Gingo Airlite 4/Verso 3",
        date: "2019-11-25",
        url: "http://members.safa.asn.au/isonic-downloaddoc.php?docid=a1",
      },
      {
        title: "ATSB report on Supair Strike harness",
        date: "2020-05-21",
        url: "http://members.safa.asn.au/isonic-downloaddoc.php?docid=a2",
      },
      {
        title: "SAFA Advisory Notice AN-2020/01 - Rotax Oil Coolers",
        date: "2020-08-03",
        url: "http://members.safa.asn.au/isonic-downloaddoc.php?docid=a4",
      },
    ]);
    expect(undated).toEqual(["Undated harness advice"]);
  });
});

describe("SAFA records", () => {
  it("builds a club record with a provider-scoped ID and region", () => {
    const [card] = parseDirectory(fixture("clubs.html"));
    const org = toCollectedOrg(card!, "club", AU, {
      website: "https://acthpa.org/",
      url: "https://safa.asn.au/find-a-club/club/?id=ACTHPA",
    });
    expect(org).toMatchObject({
      id: "safa:club:ACTHPA",
      kind: "club",
      regionCode: "AU-ACT",
      website: "https://acthpa.org/",
      emailPublic: "office@example.org",
    });
    expect(org.phonePublic).toBeUndefined();
  });

  it("maps events: all-day dates, venue, region and organiser, never the description", () => {
    const page = JSON.parse(fixture("events.json")) as SafaEventsPage;
    const [allDay, evening] = page.events.map((e) => toEvent(e, AU));
    expect(allDay).toMatchObject({
      id: "event:safa:64861",
      title: "50th anniversary of Free flight @ Stanwell Park",
      startDate: "2026-10-17",
      locationText: "Stanwell Park Landing Zone, Stanwell Park",
      regionCode: "AU-NSW",
      organiserName: "FlyStanwell Inc",
    });
    expect(allDay?.endDate).toBeUndefined();
    expect(evening?.title).toBe("Fly From Everest – End Polio Now Movie Event");
    expect(evening?.startDate).toBe("2026-10-17T19:00:00+11:00");
    expect(JSON.stringify([allDay, evening])).not.toContain("must not be copied");
  });
});

describe("clubEmail", () => {
  it("keeps role addresses and addresses on the club's own domain", () => {
    expect(clubEmail("secretary.npc@mail.tidyhq.com", undefined)).toBe(
      "secretary.npc@mail.tidyhq.com",
    );
    expect(clubEmail("office@acthpa.org", undefined)).toBe("office@acthpa.org");
    expect(
      clubEmail("flying@cairnshangglidingclub.org", "https://www.cairnshangglidingclub.org/"),
    ).toBe("flying@cairnshangglidingclub.org");
    expect(clubEmail("pat@nevhgc.net", "https://www.nevhgc.net/")).toBe("pat@nevhgc.net");
  });

  it("drops a volunteer's personal address", () => {
    expect(clubEmail("pat.example77@gmail.com", "https://club.example.org/")).toBeUndefined();
    expect(clubEmail("p.example@uni.example.edu.au", undefined)).toBeUndefined();
  });
});
