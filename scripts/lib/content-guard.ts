// Content guard (docs/07 §1–2, §9; docs/01 §8): wording that must never appear on a deployed page.
// Pure functions so they can be unit-tested; scripts/content-guard.ts applies them to out/.

export interface GuardRule {
  id: string;
  pattern: RegExp;
  why: string;
}

export const guardRules: GuardRule[] = [
  { id: "flyable", pattern: /\bflyable\b/i, why: 'Never say "flyable" (docs/07 §2)' },
  { id: "safe", pattern: /\bsafe\b/i, why: 'Never call conditions or sites "safe" (docs/07 §2)' },
  { id: "good-to-go", pattern: /\bgood to go\b/i, why: 'Never say "good to go" (docs/07 §2)' },
  {
    id: "its-on",
    pattern: /\bit[’']s on\s*[.!]/i,
    why: 'Never say "it\'s on" about conditions (docs/07 §2)',
  },
  {
    id: "best-site-today",
    pattern: /\bbest site today\b/i,
    why: "Never rank sites for today (docs/07 §2)",
  },
  {
    id: "placeholder",
    pattern: /\[[^\][\n]{1,80}\]/,
    why: "Square-bracket placeholders must never be deployed (docs/07 §1)",
  },
  { id: "name-two-words", pattern: /\bHouse Thermal\b/, why: "The name is one word: HouseThermal" },
  {
    id: "name-lowercase-t",
    pattern: /\bHousethermal\b/,
    why: "The name is HouseThermal (capital T)",
  },
];

export interface GuardHit {
  rule: string;
  why: string;
  excerpt: string;
}

/**
 * Visible text of an HTML document: drops <script>, <style>, <template> and comments, removes
 * tags, decodes common entities. JSON-LD (which legitimately holds "House Thermal" as
 * alternateName) lives in <script> and is therefore excluded.
 */
export function visibleText(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|template)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ");
}

/** Checks visible text (and the <title>) against every rule. */
export function checkHtml(html: string): GuardHit[] {
  const title = /<title>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "";
  const text = `${title} ${visibleText(html)}`;
  const hits: GuardHit[] = [];
  for (const rule of guardRules) {
    const match = rule.pattern.exec(text);
    if (match) {
      const start = Math.max(0, match.index - 40);
      hits.push({
        rule: rule.id,
        why: rule.why,
        excerpt: text.slice(start, match.index + match[0].length + 40).trim(),
      });
    }
  }
  return hits;
}
