import {
  COUNTRIES_SERVED_WORLDWIDE_FIELD,
  isCountriesServedWorldwideFormValue,
  resolveCountriesServedForSave,
} from './worldwideCountries';

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

export function resolveCountriesServedForVendorSave(
  worldwideRequested: boolean,
  rawSlugs: string[] = []
) {
  return resolveCountriesServedForSave(worldwideRequested, rawSlugs);
}
