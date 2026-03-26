export interface LinkifyOptions {
  maxLinks?: number;
  firstMatchOnly?: boolean;
  linkClass?: string;
  seenKeywords?: Set<string>; // shared across calls on the same page for page-level dedup
  minWordGap?: number;        // minimum words between two consecutive links (default: 0)
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function regexEscape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}

export function linkifyText(
  text: string,
  keywordMap: Map<string, string>,
  options?: LinkifyOptions
): string {
  const maxLinks = options?.maxLinks ?? 5;
  const firstMatchOnly = options?.firstMatchOnly ?? true;
  const linkClass = options?.linkClass ?? "text-blue-600 hover:underline";
  const minWordGap = options?.minWordGap ?? 0;

  if (!text || keywordMap.size === 0) {
    return escapeHtml(text || "");
  }

  const escaped = escapeHtml(text);

  // Sort longest-first to prevent partial matches (e.g. "SCADA/HMI" before "SCADA")
  const keywords = [...keywordMap.keys()].sort((a, b) => b.length - a.length);

  // Each keyword optionally matches a trailing plural suffix (s / es).
  // Longest-first sort already applied, so "SCADA/HMI" beats "SCADA" before suffixes widen anything.
  const flexPattern = keywords.map(kw => regexEscape(kw) + '(?:e?s)?').join("|");
  // Lookbehind: not preceded by letter/digit/slash, and not preceded by letter-hyphen (compound like "Siemens-SPS").
  // Lookahead:  not followed by letter/digit/slash, and not followed by trailing hyphen (hyphen + non-letter, e.g. "Mess-, ").
  const regex = new RegExp(
    `(?<![\\p{L}\\p{N}/])(?<![\\p{L}]-)(${flexPattern})(?![\\p{L}\\p{N}/])(?!-(?![\\p{L}]))`,
    "giu"
  );

  const matched = new Set<string>();
  let linkCount = 0;
  let lastLinkEnd = 0;

  return escaped.replace(regex, (match, _p1, offset: number) => {
    if (linkCount >= maxLinks) return match;

    // Try exact match first (handles keywords naturally ending in "s" like "Siemens", "AWS").
    // Fall back to stripping trailing "es" or "s" for plural forms like "PLCs" → "PLC".
    const exact = match.toLowerCase();
    const stripped = exact.replace(/e?s$/, '');
    const href = keywordMap.get(exact) || keywordMap.get(stripped);
    if (!href) return match;

    // Track by the canonical key (whichever lookup succeeded) for firstMatchOnly
    const canonicalKey = keywordMap.has(exact) ? exact : stripped;
    if (firstMatchOnly && matched.has(canonicalKey)) return match;
    // Check shared page-level set — prevents linking the same term across multiple calls
    if (firstMatchOnly && options?.seenKeywords?.has(canonicalKey)) return match;

    // Enforce minimum word gap between consecutive links
    if (minWordGap > 0 && linkCount > 0) {
      const textBetween = escaped.slice(lastLinkEnd, offset);
      const wordsBetween = textBetween.trim() === '' ? 0 : textBetween.trim().split(/\s+/).length;
      if (wordsBetween < minWordGap) return match;
    }

    matched.add(canonicalKey);
    options?.seenKeywords?.add(canonicalKey);
    linkCount++;
    lastLinkEnd = offset + match.length;

    return `<a href="${href}" class="${linkClass}">${match}</a>`;
  });
}
