// Every provider collector, in run order. Adding a source = a module here + its providers.yaml entry.
import type { ProviderModule } from "../core/runner";
import { ansg } from "./ansg/collect";

export const providerModules: ProviderModule[] = [ansg];
