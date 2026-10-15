"use client";
// Counts each page the visitor moves to (D86). The site switches pages without reloading, so the
// GoatCounter script only sees the first page of a visit; this adds the rest. Renders nothing.
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    goatcounter?: { count?: (vars: { path?: string; title?: string; event?: boolean }) => void };
  }
}

export function CountPageChanges() {
  const pathname = usePathname();
  const previous = useRef(pathname);
  useEffect(() => {
    // The first page is counted by the script itself.
    if (previous.current === pathname) return;
    previous.current = pathname;
    // Wait a moment so the new page's title has replaced the old one.
    const timer = window.setTimeout(() => {
      window.goatcounter?.count?.({ path: window.location.pathname, title: document.title });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [pathname]);
  return null;
}
