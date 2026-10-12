import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { PrototypeBanner } from "@/components/layout/PrototypeBanner";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { BottomTabBar } from "@/components/layout/SiteNav";
import { t } from "@/lib/messages";
import { absoluteUrl, withBasePath } from "@/lib/paths";
import { homeTitle, jsonLdScript, organizationJsonLd, robots } from "@/lib/seo";
import { siteConfig } from "@/site.config";
import "./globals.css";

// Downloaded at build time and served from this site: no runtime requests to Google (docs/03 §2).
// latin-ext covers macrons in New Zealand place names.
const barlow = Barlow({
  weight: ["400", "500", "600", "700"],
  // Only Latin is preloaded; the latin-ext faces (e.g. "ū" in Manawatū) still load when a page uses them.
  subsets: ["latin"],
  variable: "--font-barlow",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: homeTitle, template: `%s | ${siteConfig.name}` },
  description: siteConfig.descriptor,
  applicationName: siteConfig.name,
  metadataBase: new URL(`${siteConfig.siteUrl}/`),
  icons: {
    icon: [{ url: withBasePath("/icon.svg"), type: "image/svg+xml" }],
    apple: withBasePath("/icons/apple-touch-icon.png"),
  },
  appleWebApp: { capable: true, title: siteConfig.name, statusBarStyle: "default" },
  robots,
  openGraph: { siteName: siteConfig.name, type: "website", url: absoluteUrl("/") },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body className="flex min-h-dvh flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <a
          href="#main"
          className="sr-only z-50 bg-surface px-4 py-3 font-semibold focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
        >
          {t("nav.skipToContent")}
        </a>
        {siteConfig.prototypeBanner && <PrototypeBanner />}
        <SiteHeader />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-[80rem] flex-1 px-4 py-6 lg:px-6 lg:py-10"
        >
          {children}
        </main>
        <SiteFooter />
        <BottomTabBar />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(organizationJsonLd()) }}
        />
      </body>
    </html>
  );
}
