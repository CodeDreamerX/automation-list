import type { SupabaseClient } from '@supabase/supabase-js';
import {
  COUNTRIES_SERVED_WORLDWIDE_FIELD,
  WORLDWIDE_COUNTRY_SENTINEL,
  expandCountrySlugsForSave,
  isCountriesServedWorldwideFormValue,
} from './worldwideCountries';

export function shouldExpandCountriesToWorldwide(
  rawSlugs: string[],
  worldwideRequested: boolean
): boolean {
  return worldwideRequested || rawSlugs.includes(WORLDWIDE_COUNTRY_SENTINEL);
}

export async function fetchAllActiveCountrySlugs(
  supabase: SupabaseClient
): Promise<string[]> {
  const { data } = await supabase
    .from('countries')
    .select('slug')
    .eq('is_active', true);
  return (data || [])
    .map((row: { slug: string }) => row.slug)
    .filter((slug: string) => Boolean(slug));
}

/**
 * Resolve country_slugs from a vendor form POST or API payload.
 * When worldwide is checked, expands to every active country slug.
 */
export async function resolveCountrySlugsForVendorSave(
  supabase: SupabaseClient,
  rawSlugs: string[],
  worldwideRequested: boolean,
  knownAllSlugs?: string[]
): Promise<string[]> {
  const expand = shouldExpandCountriesToWorldwide(rawSlugs, worldwideRequested);
  const allSlugs =
    knownAllSlugs ?? (expand ? await fetchAllActiveCountrySlugs(supabase) : []);
  return expandCountrySlugsForSave(rawSlugs, allSlugs, expand);
}

export function isWorldwideRequestedFromFormData(formData: FormData): boolean {
  return isCountriesServedWorldwideFormValue(
    formData.get(COUNTRIES_SERVED_WORLDWIDE_FIELD)
  );
}

export function isWorldwideRequestedFromBody(body: Record<string, unknown>): boolean {
  return isCountriesServedWorldwideFormValue(
    body[COUNTRIES_SERVED_WORLDWIDE_FIELD] as FormDataEntryValue | undefined
  );
}
