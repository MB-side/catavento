import Link from "next/link";
import { Lockup } from "@/components/brand/Logo";
import { t } from "@/lib/messages";
import { footerNav, navHref } from "./nav-items";

/** Dark footer with the policy links (docs/02 §5.1). Sources summary joins in M1. */
export function SiteFooter() {
  return (
    <footer className="mt-12 bg-ink text-white">
      <div className="mx-auto flex max-w-[80rem] flex-col gap-6 px-4 py-8 lg:px-6">
        <Lockup withDescriptor onDark />
        <nav aria-label={t("footer.label")}>
          <ul className="flex flex-wrap gap-x-2 gap-y-1">
            {footerNav.map((item) => (
              <li key={item.label}>
                <Link
                  href={navHref(item, "")}
                  className="inline-flex min-h-11 items-center px-1 text-[0.9375rem] text-footer-link underline-offset-4 hover:text-white hover:underline"
                >
                  {t(item.label)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="max-w-2xl text-[0.875rem] text-white/80">{t("footer.independence")}</p>
      </div>
    </footer>
  );
}
