"use client";
// Counts clicks on links to other websites (D87): which outside links people use, not who. Renders nothing.
import { useEffect } from "react";
import { outboundEvent } from "@/lib/analytics";

export function CountOutboundClicks() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button > 1) return; // left or middle click
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (!link) return;
      const event = outboundEvent(link.getAttribute("href") ?? "", window.location.origin);
      if (event) window.goatcounter?.count?.({ ...event, event: true });
    };
    document.addEventListener("click", onClick);
    document.addEventListener("auxclick", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("auxclick", onClick);
    };
  }, []);
  return null;
}
