// The heading block used by section pages: optional breadcrumb, title and intro.
import Link from "next/link";

export function PageHeader({
  title,
  intro,
  crumb,
  children,
}: {
  title: string;
  intro?: string;
  crumb?: { href: string; label: string };
  children?: React.ReactNode;
}) {
  return (
    <header>
      {crumb && (
        <nav aria-label={crumb.label} className="text-[0.875rem] text-muted">
          <Link href={crumb.href}>{crumb.label}</Link>
        </nav>
      )}
      <h1 className="mt-1 font-condensed text-[2rem] leading-tight font-bold lg:text-[2.5rem]">
        {title}
      </h1>
      {intro && <p className="mt-2 max-w-3xl text-[1.0625rem]">{intro}</p>}
      {children}
    </header>
  );
}

export const card = "rounded-[14px] border border-border bg-surface p-4 lg:p-5";
export const h2 = "font-condensed text-[1.375rem] font-bold";
export const linkButton =
  "inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-border-strong bg-surface px-4 font-semibold text-ink no-underline hover:text-ink";
