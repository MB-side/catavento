// How much Catavento holds for a country (D93): full coverage, partial, or an overview.
import { t } from "@/lib/messages";
import type { Coverage } from "@/lib/country-profile";

const styles: Record<Coverage, string> = {
  full: "bg-good-tint text-good-text",
  partial: "bg-prototype-tint text-prototype-text",
  overview: "bg-info-tint text-link",
};

export function CoverageBadge({ coverage }: { coverage: Coverage }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[0.8125rem] font-semibold ${styles[coverage]}`}
      data-testid="coverage-badge"
    >
      {t(`countryPage.coverage.${coverage}`)}
    </span>
  );
}
