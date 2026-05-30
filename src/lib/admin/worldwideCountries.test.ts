import { describe, it, expect } from 'vitest';
import {
  WORLDWIDE_COUNTRY_SENTINEL,
  deriveWorldwideState,
  getCountriesServedDisplayLabel,
  resolveCountriesServedForSave,
  isWorldwideCountriesServed,
  isCountriesServedWorldwideFormValue,
} from './worldwideCountries';

describe('resolveCountriesServedForSave', () => {
  it('stores WORLDWIDE flag only with no country slugs', () => {
    expect(resolveCountriesServedForSave(true, [])).toEqual({
      countrySlugs: [],
      countriesServed: WORLDWIDE_COUNTRY_SENTINEL,
    });
    expect(resolveCountriesServedForSave(false, [WORLDWIDE_COUNTRY_SENTINEL])).toEqual({
      countrySlugs: [],
      countriesServed: WORLDWIDE_COUNTRY_SENTINEL,
    });
  });

  it('stores slugs and clears flag for partial selection', () => {
    expect(resolveCountriesServedForSave(false, ['germany', 'austria'])).toEqual({
      countrySlugs: ['germany', 'austria'],
      countriesServed: null,
    });
  });
});

describe('deriveWorldwideState', () => {
  it('is worldwide when countries_served is WORLDWIDE', () => {
    expect(deriveWorldwideState('WORLDWIDE', ['germany'])).toEqual({
      worldwide: true,
      countrySlugs: [],
    });
  });

  it('is not worldwide from slug list alone', () => {
    expect(deriveWorldwideState(null, ['germany', 'austria'])).toEqual({
      worldwide: false,
      countrySlugs: ['germany', 'austria'],
    });
  });
});

describe('getCountriesServedDisplayLabel', () => {
  it('returns Worldwide / Weltweit for the flag', () => {
    expect(getCountriesServedDisplayLabel('WORLDWIDE', [], 'en')).toBe('Worldwide');
    expect(getCountriesServedDisplayLabel('WORLDWIDE', [], 'de')).toBe('Weltweit');
  });

  it('returns joined names otherwise', () => {
    expect(getCountriesServedDisplayLabel(null, ['Germany', 'Austria'], 'en')).toBe(
      'Germany, Austria'
    );
  });
});

describe('isWorldwideCountriesServed', () => {
  it('matches case-insensitively', () => {
    expect(isWorldwideCountriesServed('worldwide')).toBe(true);
    expect(isWorldwideCountriesServed('Germany')).toBe(false);
  });
});

describe('isCountriesServedWorldwideFormValue', () => {
  it('accepts common truthy form values', () => {
    expect(isCountriesServedWorldwideFormValue('1')).toBe(true);
  });
});
