// The web app manifest (docs/02 §5.2, S10): installing Catavento opens it on My Sites (D37).
import type { MetadataRoute } from "next";
import { withBasePath } from "@/lib/paths";
import { siteConfig } from "@/site.config";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.descriptor,
    id: withBasePath("/my-sites/"),
    start_url: withBasePath("/my-sites/"),
    scope: withBasePath("/"),
    display: "standalone",
    background_color: "#EEF2F5",
    theme_color: "#FFFFFF",
    icons: [
      {
        src: withBasePath("/icons/icon-192.png"),
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: withBasePath("/icons/icon-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: withBasePath("/icons/icon-maskable-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
