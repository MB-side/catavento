// Site-wide settings (docs/03 §7). Country rules live in data/manual/countries.yaml, not here.

export type SpeedUnit = "kmh" | "kt";

export const siteConfig = {
  name: "HouseThermal",
  alternateName: "House Thermal", // structured data only, never displayed
  descriptor: "Paragliding and hang gliding, all in one place",
  titleDescriptor: "Paragliding and hang gliding in Australia, all in one place",
  whyTheName:
    "Every flying site has a house thermal: the reliable climb the locals head for first. We want to be that for everything about flying.",
  // GitHub Pages project URL until housethermal.fly is set up; then basePath becomes "".
  basePath: "/housethermal",
  siteUrl: "https://mb-side.github.io/housethermal", // full public URL including basePath, no trailing slash
  repoUrl: "https://github.com/MB-side/housethermal",
  feedbackFormUrl: "", // external form; empty shows the email fallback on /feedback
  contactEmail: "housethermal.app@gmail.com", // takedown, bot policy and feedback fallback
  analytics: { enabled: false, provider: "" },
  showPartnerPreviews: false, // docs/02 §5.13
  allowIndexing: false, // search engines kept out until consultation launch (M7)
  defaultCountry: "AU",
  enabledCountries: ["AU", "NZ"], // details in data/manual/countries.yaml
  defaultUnits: "kmh" as SpeedUnit, // per-country defaults override
  prototypeBanner: true,
} as const;

export type SiteConfig = typeof siteConfig;
