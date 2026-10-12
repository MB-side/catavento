import Link from "next/link";
import { t } from "@/lib/messages";
import type { Country } from "@/lib/types";

/** Notice at the top of every page in a sample-coverage country (docs/07 §10). */
export function CoverageNotice({ country }: { country: Country }) {
  if (country.coverage !== "sample") return null;
  return (
    <p
      className="mb-6 rounded-[14px] bg-prototype-tint p-4 text-prototype-text"
      data-testid="coverage-notice"
    >
      <strong>{t("coverage.label")}</strong> {t("coverage.text", { country: country.name })}{" "}
      <Link href="/feedback/" className="font-semibold text-prototype-text underline">
        {t("coverage.link")}
      </Link>
    </p>
  );
}
