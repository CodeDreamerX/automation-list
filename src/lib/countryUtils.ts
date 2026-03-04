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
