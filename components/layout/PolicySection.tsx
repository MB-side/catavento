// A titled block of plain text on the policy pages (About, Privacy, Takedown, Disclaimer).
import { card, h2 } from "./PageHeader";

export function PolicySection({
  id,
  heading,
  children,
}: {
  id: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={card}>
      <h2 id={id} className={h2}>
        {heading}
      </h2>
      <div className="mt-2 flex max-w-3xl flex-col gap-2">{children}</div>
    </section>
  );
}
