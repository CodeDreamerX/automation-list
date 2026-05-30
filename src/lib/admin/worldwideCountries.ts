/** Form checkbox value when “serve all active countries” is selected. */
export const COUNTRIES_SERVED_WORLDWIDE_FIELD = 'countries_served_worldwide';

/** Optional sentinel in slug arrays (import/API); expanded to all slugs on save. */
export const WORLDWIDE_COUNTRY_SENTINEL = 'WORLDWIDE';

function normalizeSlugList(slugs: string[]): string[] {
  return [...new Set(slugs.map((s) => String(s).trim()).filter(Boolean))];
}

/** True when selected slugs cover every entry in `allSlugs` (same set). */
export function isWorldwideCountrySelection(
  selectedSlugs: string[],
  allSlugs: string[]
): boolean {
  const all = normalizeSlugList(allSlugs);
  if (all.length === 0) return false;

  const selected = normalizeSlugList(
    selectedSlugs.filter((s) => s !== WORLDWIDE_COUNTRY_SENTINEL)
  );
  if (selected.length !== all.length) return false;

  const selectedSet = new Set(selected);
  return all.every((slug) => selectedSet.has(slug));
}

export interface WorldwideCountryState {
  worldwide: boolean;
  countrySlugs: string[];
}

/**
 * Derive whether the UI “Worldwide” control should be checked from stored slugs.
 */
export function deriveWorldwideState(
  selectedSlugs: string[],
  allSlugs: string[]
): WorldwideCountryState {
  const hasSentinel = selectedSlugs.some((s) => s === WORLDWIDE_COUNTRY_SENTINEL);
  const countrySlugs = normalizeSlugList(
    selectedSlugs.filter((s) => s !== WORLDWIDE_COUNTRY_SENTINEL)
  );
  const worldwide =
    hasSentinel || isWorldwideCountrySelection(countrySlugs, allSlugs);
  return { worldwide, countrySlugs };
}

/** Slugs to persist in vendor_countries after form/API handling. */
export function expandCountrySlugsForSave(
  countrySlugs: string[],
  allSlugs: string[],
  worldwideRequested: boolean
): string[] {
  if (worldwideRequested && allSlugs.length > 0) {
    return normalizeSlugList(allSlugs);
  }
  return normalizeSlugList(
    countrySlugs.filter((s) => s !== WORLDWIDE_COUNTRY_SENTINEL)
  );
}

/** Expand WORLDWIDE sentinel for JSON create/update import rows. */
export function resolveCountrySlugsForImport(
  rawSlugs: string[],
  allActiveSlugs: string[]
): string[] {
  const expand = rawSlugs.includes(WORLDWIDE_COUNTRY_SENTINEL);
  return expandCountrySlugsForSave(rawSlugs, allActiveSlugs, expand);
}

/** Expand WORLDWIDE in pending_listings.countries_served (English names) on approval. */
export function resolveCountriesServedNamesForApproval(
  rawNames: string[],
  allActiveCountryNamesEn: string[]
): string[] {
  const hasSentinel = rawNames.some(
    (name) => String(name).trim().toUpperCase() === WORLDWIDE_COUNTRY_SENTINEL
  );
  if (hasSentinel && allActiveCountryNamesEn.length > 0) {
    return normalizeSlugList(allActiveCountryNamesEn);
  }
  return normalizeSlugList(
    rawNames.filter(
      (name) => String(name).trim().toUpperCase() !== WORLDWIDE_COUNTRY_SENTINEL
    )
  );
}

export function isCountriesServedWorldwideValue(value: string): boolean {
  return String(value).trim().toUpperCase() === WORLDWIDE_COUNTRY_SENTINEL;
}

export function isCountriesServedWorldwideFormValue(value: FormDataEntryValue | null | undefined): boolean {
  if (value == null) return false;
  const s = String(value).trim().toLowerCase();
  return s === '1' || s === 'on' || s === 'true' || s === 'yes';
}
