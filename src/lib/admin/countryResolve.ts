/**
 * Resolve JSON import `country` strings to canonical English names from `countries`
 * (case-insensitive; accepts slug or name_en / name_de).
 */
export function buildCountryCanonicalLookup(
  countries: { slug: string; name_en: string; name_de?: string | null }[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const c of countries) {
    const canonical = c.name_en?.trim();
    if (!canonical) continue;
    map.set(canonical.toLowerCase(), canonical);
    if (c.slug) map.set(String(c.slug).toLowerCase().trim(), canonical);
    if (c.name_de?.trim()) map.set(c.name_de.trim().toLowerCase(), canonical);
  }
  return map;
}

export function resolveCanonicalCountryName(
  input: string | null | undefined,
  lookup: Map<string, string>
): string | null {
  if (input == null || typeof input !== 'string') return null;
  const t = input.trim();
  if (!t) return null;
  const hit = lookup.get(t.toLowerCase());
  if (hit) return hit;
  return t;
}
