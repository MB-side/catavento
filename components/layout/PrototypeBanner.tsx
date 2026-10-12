"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { t, tOr } from "@/lib/messages";
import { useCurrentCountry } from "./useCurrentCountry";

const DISMISS_KEY = "catavento.prototypeBannerDismissed";

/** Prototype banner (docs/07 §3): every page, dismissible for the browser session. */
export function PrototypeBanner() {
  const { country, onCountryPage } = useCurrentCountry();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      // Reading session storage after hydration keeps the static HTML identical for everyone.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (sessionStorage.getItem(DISMISS_KEY) === "1") setDismissed(true);
    } catch {
      // Storage blocked (private mode etc.): the banner simply stays visible.
    }
  }, []);

  if (dismissed) return null;

  // Global pages name no particular national body, so no country's wording leaks onto another's.
  const affiliations = onCountryPage
    ? tOr(`banner.affiliations.${country.toUpperCase()}`, "banner.affiliations.default")
    : t("banner.affiliations.default");

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Ignore: dismissal then lasts only until the next page load.
    }
  }

  return (
    <aside
      aria-label={t("banner.label")}
      className="bg-prototype-tint text-prototype-text"
      data-testid="prototype-banner"
    >
      <div className="mx-auto flex max-w-[80rem] items-start gap-2 px-4 py-1.5 text-[0.8125rem] leading-snug lg:items-center lg:px-6">
        <p className="flex-1 py-1.5">
          {t("banner.text", { affiliations })}{" "}
          <Link
            href="/feedback/"
            className="font-bold text-prototype-text underline hover:text-prototype-text"
          >
            {t("banner.feedback")}
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("banner.dismiss")}
          className="-my-1 inline-flex size-11 shrink-0 items-center justify-center rounded-[10px] hover:bg-black/5"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
