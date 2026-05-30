import { describe, it, expect } from 'vitest';
import {
  WORLDWIDE_COUNTRY_SENTINEL,
  deriveWorldwideState,
  expandCountrySlugsForSave,
  isWorldwideCountrySelection,
  resolveCountrySlugsForImport,
  resolveCountriesServedNamesForApproval,
  isCountriesServedWorldwideFormValue,
} from './worldwideCountries';

const ALL = ['germany', 'austria', 'switzerland'];

describe('isWorldwideCountrySelection', () => {
  it('is true when every active slug is selected', () => {
    expect(isWorldwideCountrySelection([...ALL], ALL)).toBe(true);
    expect(isWorldwideCountrySelection(['switzerland', 'germany', 'austria'], ALL)).toBe(true);
  });

  it('is false for partial or empty selection', () => {
    expect(isWorldwideCountrySelection(['germany'], ALL)).toBe(false);
    expect(isWorldwideCountrySelection([], ALL)).toBe(false);
    expect(isWorldwideCountrySelection([...ALL, 'france'], ALL)).toBe(false);
  });

  it('ignores WORLDWIDE sentinel in slug list', () => {
    expect(isWorldwideCountrySelection([WORLDWIDE_COUNTRY_SENTINEL, ...ALL], ALL)).toBe(true);
  });
});

describe('deriveWorldwideState', () => {
  it('marks worldwide when all countries are selected', () => {
    expect(deriveWorldwideState([...ALL], ALL)).toEqual({
      worldwide: true,
      countrySlugs: ALL,
    });
  });

  it('marks worldwide when sentinel is present', () => {
    expect(deriveWorldwideState([WORLDWIDE_COUNTRY_SENTINEL], ALL)).toEqual({
      worldwide: true,
      countrySlugs: [],
    });
  });

  it('is not worldwide for partial selection', () => {
    expect(deriveWorldwideState(['germany'], ALL)).toEqual({
      worldwide: false,
      countrySlugs: ['germany'],
    });
  });
});

describe('expandCountrySlugsForSave', () => {
  it('returns all slugs when worldwide is requested', () => {
    expect(expandCountrySlugsForSave(['germany'], ALL, true)).toEqual(ALL);
    expect(expandCountrySlugsForSave([], ALL, true)).toEqual(ALL);
  });

  it('returns submitted slugs when worldwide is not requested', () => {
    expect(expandCountrySlugsForSave(['germany', 'austria'], ALL, false)).toEqual([
      'germany',
      'austria',
    ]);
    expect(expandCountrySlugsForSave([WORLDWIDE_COUNTRY_SENTINEL], ALL, false)).toEqual([]);
  });
});

describe('resolveCountrySlugsForImport', () => {
  it('expands WORLDWIDE sentinel to all active slugs', () => {
    expect(resolveCountrySlugsForImport([WORLDWIDE_COUNTRY_SENTINEL], ALL)).toEqual(ALL);
  });
});

describe('resolveCountriesServedNamesForApproval', () => {
  it('expands WORLDWIDE to all active English country names', () => {
    const names = ['Germany', 'France'];
    expect(resolveCountriesServedNamesForApproval([WORLDWIDE_COUNTRY_SENTINEL], names)).toEqual(
      names
    );
  });

  it('passes through explicit country names when sentinel absent', () => {
    expect(resolveCountriesServedNamesForApproval(['Germany', 'Austria'], ALL)).toEqual([
      'Germany',
      'Austria',
    ]);
  });
});

describe('isCountriesServedWorldwideFormValue', () => {
  it('accepts common truthy form values', () => {
    expect(isCountriesServedWorldwideFormValue('1')).toBe(true);
    expect(isCountriesServedWorldwideFormValue('on')).toBe(true);
  });

  it('rejects absent or off values', () => {
    expect(isCountriesServedWorldwideFormValue(null)).toBe(false);
    expect(isCountriesServedWorldwideFormValue('')).toBe(false);
  });
});
