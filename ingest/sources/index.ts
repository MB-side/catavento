// Every provider collector, in run order. Adding a source = a module here + its providers.yaml entry.
import type { ProviderModule } from "../core/runner";
import { ansg } from "./ansg/collect";
import { clubWebsites } from "./clubs/collect";
import { pge } from "./pge/collect";
import { safa } from "./safa/collect";

export const providerModules: ProviderModule[] = [safa, ansg, pge, clubWebsites];
