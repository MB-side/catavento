// Search documents and index options, shared by the build (app/data/search.json) and the page.
export interface SearchDoc {
  id: string;
  kind: "site" | "club" | "org" | "event";
  title: string;
  sub: string; // region, town, date: shown under the title and searched too
  href: string; // internal path, or the event's own page
  country: string;
  text: string; // extra words to match: aliases, disciplines, organiser
}

export const SEARCH_OPTIONS = {
  fields: ["title", "sub", "text"],
  storeFields: ["kind", "title", "sub", "href", "country"],
  searchOptions: { boost: { title: 3 }, prefix: true, fuzzy: 0.2 },
};
