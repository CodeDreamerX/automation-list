/**
 * Converts a country name to a URL-safe slug.
 *
 * Steps:
 * 1. Lowercase
 * 2. Trim whitespace
 * 3. Remove special characters (keep word chars, spaces, hyphens)
 * 4. Replace spaces with hyphens
 * 5. Collapse multiple hyphens
 * 6. Trim leading/trailing hyphens
 *
 * @param country - Country name string (e.g. "United States", "Czech Republic")
 * @returns URL-safe slug (e.g. "united-states", "czech-republic")
 */
export function slugifyCountry(country: string): string {
  if (!country || typeof country !== 'string') return '';
  return country
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // remove special chars (keep word chars, spaces, hyphens)
    .replace(/\s+/g, '-')       // spaces → hyphens
    .replace(/-+/g, '-')        // collapse multiple hyphens
    .replace(/^-|-$/g, '');     // trim leading/trailing hyphens
}

/**
 * Normalizes a country name to a comparable format.
 *
 * @param country - Country name string
 * @returns Normalized country string in lowercase with collapsed whitespace
 */
export function normalizeCountryName(country: string): string {
  if (!country || typeof country !== 'string') return '';
  return country
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export interface CountryNameEntry {
  name_en: string;
  name_de?: string | null;
  slug?: string | null;
  flag_emoji?: string | null;
}

export async function getCountryNameMap(
  supabase: any,
  getCached?: <T>(key: string) => T | null,
  setCached?: (key: string, value: any, ttl: number) => void
): Promise<Record<string, CountryNameEntry>> {
  const cacheKey = 'countries:name-map';
  const cached = getCached?.<Record<string, CountryNameEntry>>(cacheKey);
  if (cached) return cached;

  const { data } = await supabase
    .from('countries')
    .select('name_en, name_de, slug, flag_emoji')
    .eq('is_active', true);

  const map: Record<string, CountryNameEntry> = {};
  for (const country of data || []) {
    if (!country?.name_en) continue;

    const entry: CountryNameEntry = {
      name_en: country.name_en,
      name_de: country.name_de || null,
      slug: country.slug || null,
      flag_emoji: country.flag_emoji || null,
    };

    map[normalizeCountryName(country.name_en)] = entry;
    if (country.name_de) {
      map[normalizeCountryName(country.name_de)] = entry;
    }
  }

  setCached?.(cacheKey, map, 3600);
  return map;
}

/**
 * Converts a country route param/slug into a normalized country name.
 *
 * Examples:
 * - "united-kingdom" => "united kingdom"
 * - "united%20kingdom" => "united kingdom"
 *
 * @param value - URL param value
 * @returns Normalized country name
 */
export function parseCountryParam(value: string): string {
  if (!value || typeof value !== 'string') return '';

  try {
    const decoded = decodeURIComponent(value).trim();
    return normalizeCountryName(decoded.replace(/-/g, ' '));
  } catch {
    return normalizeCountryName(value.replace(/-/g, ' '));
  }
}
