import { slugifyCountry, normalizeCountryName, type CountryNameEntry } from './countryUtils';

/** Minimum vendors in a category before a country appears in "Vendors by country". */
export const CATEGORY_COUNTRY_MIN_VENDOR_COUNT = 3;

export interface CountryVendorCount {
  slug: string;
  label: string;
  flagRaw: string;
  count: number;
}

export interface VendorWithCountry {
  country: string | null | undefined;
}

/**
 * Aggregate vendors by primary HQ country (`vendor.country`), counting each vendor once.
 */
export function aggregateVendorsByCountry(
  vendors: VendorWithCountry[],
  countryNameMap: Record<string, CountryNameEntry>,
  lang: 'en' | 'de'
): CountryVendorCount[] {
  const countryCount = new Map<string, CountryVendorCount>();

  for (const vendor of vendors) {
    if (!vendor.country) continue;
    const slug = slugifyCountry(vendor.country);
    if (!slug) continue;

    const entry = countryNameMap[normalizeCountryName(vendor.country)];
    const label =
      (lang === 'de' ? entry?.name_de : null) || entry?.name_en || vendor.country;
    const flagRaw = entry?.flag_emoji || '';

    const existing = countryCount.get(slug);
    if (existing) {
      existing.count++;
    } else {
      countryCount.set(slug, { slug, label, flagRaw, count: 1 });
    }
  }

  return [...countryCount.values()];
}

/**
 * Return countries with at least `minCount` vendors, sorted by count descending.
 */
export function selectCountriesByMinVendorCount(
  countries: CountryVendorCount[],
  minCount: number = CATEGORY_COUNTRY_MIN_VENDOR_COUNT
): CountryVendorCount[] {
  return countries
    .filter((country) => country.count >= minCount)
    .sort((a, b) => b.count - a.count);
}

/**
 * Build the "Vendors by country" list for a category page.
 */
export function getCategoryCountriesByVendorCount(
  vendors: VendorWithCountry[],
  countryNameMap: Record<string, CountryNameEntry>,
  lang: 'en' | 'de',
  minCount: number = CATEGORY_COUNTRY_MIN_VENDOR_COUNT
): CountryVendorCount[] {
  return selectCountriesByMinVendorCount(
    aggregateVendorsByCountry(vendors, countryNameMap, lang),
    minCount
  );
}
