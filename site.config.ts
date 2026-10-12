// Site-wide settings (docs/03 §7). Country rules live in data/manual/countries.yaml, not here.

export type SpeedUnit = "kmh" | "kt";

export const siteConfig = {
  name: "Catavento",
  descriptor: "Paragliding and hang gliding, all in one place",
  titleDescriptor: "Paragliding and hang gliding in Australia, all in one place",
  // Draft copy for founder review (docs/07 §9).
  whyTheName:
    "Catavento is Portuguese for pinwheel: it means \u201ccatch the wind\u201d. Like a pinwheel, everything here turns around one centre: the sites, clubs, schools and pilots of free flight.",
  // GitHub Pages project URL until catavento.fly is set up; then basePath becomes "".
  basePath: "/catavento",
  siteUrl: "https://mb-side.github.io/catavento", // full public URL including basePath, no trailing slash
  repoUrl: "https://github.com/MB-side/catavento",
  feedbackFormUrl: "", // external form; empty shows the email fallback on /feedback
  contactEmail: "housethermal.app@gmail.com", // takedown, bot policy and feedback fallback; replace with a Catavento address when one exists
  analytics: { enabled: false, provider: "" },
  showPartnerPreviews: false, // docs/02 §5.13
  allowIndexing: false, // search engines kept out until consultation launch (M7)
  defaultCountry: "AU",
  enabledCountries: ["AU", "NZ"], // details in data/manual/countries.yaml
  defaultUnits: "kmh" as SpeedUnit, // per-country defaults override
  prototypeBanner: true,
} as const;

export type SiteConfig = typeof siteConfig;
