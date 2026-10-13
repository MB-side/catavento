"use client";

// Schools directory with filters and Compare (docs/02 §5.9, S6): up to 3 side by side, with
// "Not published" wherever a school hasn't published something.
import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { t, tOr } from "@/lib/messages";
import { Anchor } from "@/components/ui/anchor";

export interface SchoolSummary {
  id: string;
  name: string;
  href: string;
  kinds: string;
  disciplines: { code: string; label: string }[];
  regionCode?: string;
  location?: string;
  accommodation?: string;
  price?: { text: string; title: string; url: string };
  website?: string;
  listed: boolean;
}

const MAX = 3;
const control =
  "min-h-11 w-full rounded-[10px] border border-border-strong bg-surface px-3 text-[1rem] text-ink";

export function SchoolsExplorer({
  schools,
  regions,
  regionLabel,
  bodyName,
}: {
  schools: SchoolSummary[];
  regions: { code: string; name: string }[];
  regionLabel: string;
  bodyName: string;
}) {
  const [region, setRegion] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const disciplines = useMemo(() => {
    const seen = new Map<string, string>();
    for (const s of schools) for (const d of s.disciplines) seen.set(d.code, d.label);
    return [...seen].map(([code, label]) => ({ code, label }));
  }, [schools]);
  const shown = schools.filter(
    (s) =>
      (!region || s.regionCode === region) &&
      (!discipline || s.disciplines.some((d) => d.code === discipline)),
  );
  const compared = picked
    .map((id) => schools.find((s) => s.id === id))
    .filter((s): s is SchoolSummary => !!s);
  const toggle = (id: string) =>
    setPicked((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : p.length >= MAX ? p : [...p, id],
    );
  const np = <span className="text-muted">{t("ntf.notPublished")}</span>;
  const rows: [string, (s: SchoolSummary) => React.ReactNode][] = [
    [t("ntf.rowDisciplines"), (s) => s.disciplines.map((d) => d.label).join(", ") || np],
    [t("ntf.rowLocation"), (s) => s.location ?? np],
    [t("ntf.rowAccommodation"), (s) => s.accommodation ?? np],
    [
      t("ntf.rowPrice"),
      (s) =>
        s.price ? (
          <>
            {s.price.text} <span className="text-[0.875rem] text-muted">({s.price.title})</span>
          </>
        ) : (
          np
        ),
    ],
    [t("ntf.rowListed", { body: bodyName }), (s) => (s.listed ? t("ntf.yes") : np)],
    [
      t("ntf.rowLink"),
      (s) =>
        s.website ? (
          <Anchor href={s.website}>
            {s.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
          </Anchor>
        ) : (
          np
        ),
    ],
  ];

  return (
    <div className="flex flex-col gap-4">
      <form
        className="grid gap-3 rounded-[14px] border border-border bg-surface p-4 sm:grid-cols-2"
        onSubmit={(e) => e.preventDefault()}
      >
        <label className="flex flex-col gap-1 text-[0.875rem] font-medium">
          {regionLabel}
          <select value={region} onChange={(e) => setRegion(e.target.value)} className={control}>
            <option value="">{t("sitesList.allRegions")}</option>
            {regions.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[0.875rem] font-medium">
          {t("ntf.rowDisciplines")}
          <select
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value)}
            className={control}
          >
            <option value="">{t("sitesList.anyDiscipline")}</option>
            {disciplines.map((d) => (
              <option key={d.code} value={d.code}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      </form>

      {compared.length > 0 && (
        <section
          aria-labelledby="compare"
          className="rounded-[14px] border-2 border-link bg-surface p-4"
          data-testid="compare"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="compare" className="font-condensed text-[1.375rem] font-bold">
              {t("ntf.compareHeading", { count: String(compared.length) })}
            </h2>
            <button
              type="button"
              onClick={() => setPicked([])}
              className="min-h-11 font-semibold text-link underline underline-offset-4"
            >
              {t("ntf.compareClear")}
            </button>
          </div>
          <div
            className="mt-2 overflow-x-auto"
            tabIndex={0}
            role="region"
            aria-labelledby="compare"
          >
            <table className="w-full min-w-[32rem] border-collapse text-left text-[0.9375rem]">
              <thead>
                <tr>
                  <td />
                  {compared.map((s) => (
                    <th
                      key={s.id}
                      scope="col"
                      className="p-2 align-top font-condensed text-[1.125rem]"
                    >
                      <Link href={s.href}>{s.name}</Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, value]) => (
                  <tr key={label} className="border-t border-border">
                    <th
                      scope="row"
                      className="p-2 align-top text-[0.8125rem] font-medium text-muted"
                    >
                      {label}
                    </th>
                    {compared.map((s) => (
                      <td key={s.id} className="p-2 align-top">
                        {value(s)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <p aria-live="polite" className="font-semibold" data-testid="school-count">
        {tOr(`ntf.schoolCount.${shown.length === 1 ? "one" : "other"}`, "ntf.schoolCount.other", {
          count: String(shown.length),
        })}
        {picked.length >= MAX && (
          <span className="ml-2 font-normal text-muted">{t("ntf.compareLimit")}</span>
        )}
      </p>
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" data-testid="school-list">
        {shown.map((s) => {
          const on = picked.includes(s.id);
          return (
            <li
              key={s.id}
              className="flex flex-col gap-1 rounded-[14px] border border-border bg-surface p-4"
              data-testid="school-card"
            >
              <Link href={s.href} className="font-condensed text-[1.25rem] leading-tight font-bold">
                {s.name}
              </Link>
              <p className="text-[0.875rem] text-muted">
                {[s.kinds, s.location].filter(Boolean).join(" · ")}
              </p>
              {s.disciplines.length > 0 && (
                <p className="text-[0.875rem] text-muted-strong">
                  {s.disciplines.map((d) => d.label).join(", ")}
                </p>
              )}
              {s.price && <p className="text-[0.875rem] font-semibold">{s.price.text}</p>}
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <label className="inline-flex min-h-11 items-center gap-2 font-semibold">
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={!on && picked.length >= MAX}
                    onChange={() => toggle(s.id)}
                    className="size-5"
                  />
                  {t("ntf.compare")}
                  <span className="sr-only">: {s.name}</span>
                </label>
                {s.website && (
                  <Anchor
                    href={s.website}
                    className="inline-flex min-h-11 items-center gap-1.5 font-semibold"
                  >
                    {t("ntf.visitSite")}
                    <span className="sr-only">: {s.name}</span>
                    <ExternalLink className="size-4" aria-hidden="true" />
                  </Anchor>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
