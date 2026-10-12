import type { NextConfig } from "next";
import { siteConfig } from "./site.config";

// Static export for GitHub Pages (docs/03 §4). basePath also prefixes /_next assets,
// so a separate assetPrefix is not needed.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: siteConfig.basePath,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
