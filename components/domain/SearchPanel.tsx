"use client";

// Search (docs/02 §5.10): a client-side index over sites, clubs, directory entries and events.
import Link from "next/link";
import MiniSearch from "minisearch";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { t, tOr } from "@/lib/messages";
import { withBasePath } from "@/lib/paths";
import { SEARCH_OPTIONS, type SearchDoc } from "@/lib/search";
import { Anchor } from "@/components/ui/anchor";

const noSubscription = () => () => {};
const control =
  "min-h-11 w-full rounded-[10px] border border-border-strong bg-surface px-3 text-[1rem] text-ink";

export function SearchPanel() {
  const [docs, setDocs] = useState<SearchDoc[] | null | "failed">(null);
  // The ?q= from the home page's search box, read in the browser only; typing replaces it.
  const fromUrl = useSyncExternalStore(
    noSubscription,
    () => new URLSearchParams(window.location.search).get("q") ?? "",
    () => "",
  );
  const [typed, setQ] = useState<string | null>(null);
  const q = typed ?? fromUrl;

  useEffect(() => {
    fetch(withBasePath("/data/search.json"))
      .then((r) =>
        r.ok ? (r.json() as Promise<SearchDoc[]>) : Promise.reject(new Error(String(r.status))),
      )
      .then(setDocs)
      .catch(() => setDocs("failed"));
  }, []);

  const index = useMemo(() => {
    if (!Array.isArray(docs)) return null;
    const m = new MiniSearch<SearchDoc>(SEARCH_OPTIONS);
    m.addAll(docs);
    return m;
  }, [docs]);

  const results = useMemo(
    () =>
      index && q.trim().length > 1
        ? (index.search(q.trim()) as unknown as (SearchDoc & { score: number })[]).slice(0, 50)
        : [],
    [index, q],
  );
  const form = new Intl.PluralRules("en").select(results.length) === "one" ? "one" : "other";

  return (
    <div className="flex flex-col gap-4">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          window.history.replaceState(null, "", `?q=${encodeURIComponent(q)}`);
        }}
      >
        <label className="flex flex-col gap-1 font-medium" htmlFor="search-q">
          {t("search.label")}
        </label>
        <input
          id="search-q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("search.placeholder")}
          className={`${control} mt-1`}
          autoComplete="off"
          autoFocus={!q}
        />
      </form>
      {docs === "failed" ? (
        <p className="text-muted">{t("search.failed")}</p>
      ) : docs === null ? (
        <p className="text-muted">{t("search.loading")}</p>
      ) : q.trim().length > 1 ? (
        <>
          <p aria-live="polite" className="font-semibold" data-testid="search-count">
            {results.length === 0
              ? t("search.none", { q: q.trim() })
              : tOr(`search.results.${form}`, "search.results.other", {
                  count: String(results.length),
                })}
          </p>
          <ul className="flex flex-col gap-2" data-testid="search-results">
            {results.map((r) => (
              <li key={r.id} className="rounded-[12px] border border-border bg-surface p-3">
                <span className="mr-2 rounded-full bg-ground px-2 py-0.5 text-[0.75rem] font-semibold text-muted-strong">
                  {tOr(`search.kinds.${r.kind}`, "search.kinds.site")}
                </span>
                {r.href.startsWith("http") ? (
                  <Anchor href={r.href} className="font-semibold">
                    {r.title}
                  </Anchor>
                ) : (
                  <Link href={r.href} className="font-semibold">
                    {r.title}
                  </Link>
                )}
                <span className="block text-[0.875rem] text-muted">{r.sub}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
