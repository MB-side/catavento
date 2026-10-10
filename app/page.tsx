import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { defaultCountrySegment } from "@/lib/country-codes";
import { t } from "@/lib/messages";
import { absoluteUrl } from "@/lib/paths";
import { homeTitle } from "@/lib/seo";
import { siteConfig } from "@/site.config";

export const metadata: Metadata = {
  title: { absolute: homeTitle },
  alternates: { canonical: absoluteUrl("/") },
};

/** Home (placeholder for M0): the "I fly" / "New to flying" chooser arrives with real data. */
export default function HomePage() {
  const country = defaultCountrySegment;
  const paths = [
    { href: `/${country}/sites/`, label: t("home.iFly"), hint: t("home.iFlyHint") },
    {
      href: `/${country}/new-to-flying/`,
      label: t("home.newToFlying"),
      hint: t("home.newToFlyingHint"),
    },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-condensed text-[2rem] leading-tight font-bold lg:text-[3rem]">
        {siteConfig.name}
      </h1>
      <p className="mt-1 text-[1.125rem] font-medium text-muted-strong">{siteConfig.descriptor}</p>
      <p className="mt-4 text-[1.0625rem]">{t("home.intro")}</p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {paths.map((p) => (
          <li key={p.href}>
            <Link
              href={p.href}
              className="flex min-h-11 items-center justify-between gap-3 rounded-[14px] border border-border bg-surface p-4 text-ink hover:border-link hover:text-ink lg:p-5"
            >
              <span>
                <span className="block font-condensed text-[1.375rem] font-bold">{p.label}</span>
                <span className="block text-muted">{p.hint}</span>
              </span>
              <ArrowRight className="size-6 shrink-0 text-action" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-6 rounded-[14px] bg-info-tint p-4 text-muted-strong">{t("home.building")}</p>

      <section aria-labelledby="why-the-name" className="mt-10 border-t border-border pt-6">
        <h2 id="why-the-name" className="font-condensed text-[1.25rem] font-bold">
          {t("home.whyTheNameLabel")}
        </h2>
        <p className="mt-1 text-muted-strong">{siteConfig.whyTheName}</p>
      </section>
    </div>
  );
}
