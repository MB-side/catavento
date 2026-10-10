// Every UI string comes from messages/en.json through t() (docs/03 §2). English only for now.
import en from "@/messages/en.json";

type Messages = typeof en;

/** Dotted paths to string leaves, e.g. "nav.mySites". */
type LeafPaths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : LeafPaths<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type MessageKey = LeafPaths<Messages>;

/** Looks up a dotted key in a messages object; returns undefined when missing. */
export function lookup(messages: unknown, key: string): string | undefined {
  let node: unknown = messages;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null || !(part in node)) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}

/** Replaces {name} placeholders. Unknown placeholders are left as they are so tests catch them. */
export function format(template: string, vars: Record<string, string> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => vars[name] ?? match);
}

export function t(key: MessageKey, vars?: Record<string, string>): string {
  const template = lookup(en, key);
  if (template === undefined) throw new Error(`Missing message: ${key}`);
  return format(template, vars);
}

/** For keys chosen at runtime (e.g. per-country variants): falls back when the key is absent. */
export function tOr(key: string, fallback: MessageKey, vars?: Record<string, string>): string {
  const template = lookup(en, key);
  return template === undefined ? t(fallback, vars) : format(template, vars);
}
