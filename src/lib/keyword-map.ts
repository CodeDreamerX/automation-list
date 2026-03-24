import keywordData from '../data/keyword-map.json';

export function getKeywordMap(lang: 'en' | 'de'): Map<string, string> {
  const entries = (keywordData as Record<string, Record<string, string>>)[lang] || {};
  return new Map(
    Object.entries(entries).filter(([k]) => !k.startsWith('_comment'))
  );
}

/**
 * Returns the keyword map for the given language with the current page's own
 * URL excluded (prevents self-links). Pass no excludeUrl for pages like
 * country pages where no self-exclusion is needed.
 */
export function buildPageKeywordMap(lang: 'en' | 'de', excludeUrl?: string): Map<string, string> {
  const base = getKeywordMap(lang);
  if (!excludeUrl) return base;
  return new Map<string, string>([...base].filter(([_, url]) => url !== excludeUrl));
}
