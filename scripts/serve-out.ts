// Serves the built site (out/) at http://localhost:4173/<basePath>/, like GitHub Pages.
import { siteConfig } from "../site.config";
import { startStaticServer } from "./lib/static-server";

const port = Number(process.env.PORT ?? 4173);

void startStaticServer({ root: "out", basePath: siteConfig.basePath, port }).then(() => {
  console.log(`Serving out/ at http://localhost:${port}${siteConfig.basePath}/`);
});
