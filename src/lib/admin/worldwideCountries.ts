/** Form checkbox value when “serve all active countries” is selected. */
export const COUNTRIES_SERVED_WORLDWIDE_FIELD = 'countries_served_worldwide';

/** Stored on `vendors.countries_served` and in pending JSON when scope is global. */
export const WORLDWIDE_COUNTRY_SENTINEL = 'WORLDWIDE';

function normalizeSlugList(slugs: string[]): string[] {
  return [...new Set(slugs.map((s) => String(s).trim()).filter(Boolean))];
}

export function isWorldwideCountriesServed(value: unknown): boolean {
  return (
    typeof value === 'string' &&
    value.trim().toUpperCase() === WORLDWIDE_COUNTRY_SENTINEL
  );
}

export function isWorldwideCountrySlugsInput(slugs: string[]): boolean {
  return slugs.some((s) => String(s).trim().toUpperCase() === WORLDWIDE_COUNTRY_SENTINEL);
}

export interface WorldwideCountryState {
  worldwide: boolean;
  countrySlugs: string[];
}

/** UI state: explicit worldwide flag on the vendor, not “every country linked”. */
export function deriveWorldwideState(
  countriesServedField: string | null | undefined,
  selectedSlugs: string[] = []
): WorldwideCountryState {
  if (isWorldwideCountriesServed(countriesServedField)) {
    return { worldwide: true, countrySlugs: [] };
  }
  return {
    worldwide: false,
    countrySlugs: normalizeSlugList(
      selectedSlugs.filter((s) => s !== WORLDWIDE_COUNTRY_SENTINEL)
    ),
  };
}

export interface CountriesServedSaveResult {
  countrySlugs: string[];
  countriesServed: string | null;
}

/** Worldwide → flag only, no vendor_countries rows. Otherwise M2M slugs + clear flag. */
export function resolveCountriesServedForSave(
  worldwideRequested: boolean,
  rawSlugs: string[] = []
): CountriesServedSaveResult {
  const worldwide =
    worldwideRequested || isWorldwideCountrySlugsInput(rawSlugs);
  if (worldwide) {
    return { countrySlugs: [], countriesServed: WORLDWIDE_COUNTRY_SENTINEL };
  }
  return {
    countrySlugs: normalizeSlugList(
      rawSlugs.filter((s) => s !== WORLDWIDE_COUNTRY_SENTINEL)
    ),
    countriesServed: null,
  };
}

export function isCountriesServedWorldwideFormValue(
  value: FormDataEntryValue | null | undefined
): boolean {
  if (value == null) return false;
  const s = String(value).trim().toLowerCase();
  return s === '1' || s === 'on' || s === 'true' || s === 'yes';
}

export function getCountriesServedDisplayLabel(
  countriesServedField: string | null | undefined,
  servedNames: string[],
  lang: 'en' | 'de'
): string | null {
  if (isWorldwideCountriesServed(countriesServedField)) {
    return lang === 'de' ? 'Weltweit' : 'Worldwide';
  }
  return servedNames.length > 0 ? servedNames.join(', ') : null;
}

/** JSON import: WORLDWIDE in slugs → no M2M rows. */
export function resolveCountrySlugsForImport(rawSlugs: string[] = []): string[] {
  return resolveCountriesServedForSave(false, rawSlugs).countrySlugs;
}

/** JSON import / approve: countries_served column value from slug list. */
export function resolveCountriesServedForImport(rawSlugs: string[] = []): string | null {
  return resolveCountriesServedForSave(false, rawSlugs).countriesServed;
}
