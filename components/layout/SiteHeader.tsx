import Link from "next/link";
import { Lockup } from "@/components/brand/Logo";
import { t } from "@/lib/messages";
import { DesktopNav, PhoneTopActions, SearchLink } from "./SiteNav";

/** Top bar: desktop shows the full lockup and navigation; phone shows name, New to flying and menu. */
export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-[80rem] items-center justify-between gap-4 px-4 py-2 lg:px-6 lg:py-3">
        <Link
          href="/"
          aria-label={t("brand.homeLink")}
          className="inline-flex min-h-11 items-center"
        >
          <Lockup className="lg:hidden" />
          <Lockup withDescriptor className="hidden lg:inline-flex" />
        </Link>
        <DesktopNav />
        <SearchLink className="hidden lg:inline-flex" />
        <PhoneTopActions />
      </div>
    </header>
  );
}
