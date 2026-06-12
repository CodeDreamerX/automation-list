import { describe, it, expect } from 'vitest';
import {
  CATEGORY_COUNTRY_MIN_VENDOR_COUNT,
  aggregateVendorsByCountry,
  selectCountriesByMinVendorCount,
  getCategoryCountriesByVendorCount,
} from './topCountries';
import type { CountryNameEntry } from './countryUtils';

const countryNameMap: Record<string, CountryNameEntry> = {
  germany: { name_en: 'Germany', name_de: 'Deutschland', flag_emoji: 'de' },
  switzerland: { name_en: 'Switzerland', name_de: 'Schweiz', flag_emoji: 'ch' },
  'united states': { name_en: 'United States', name_de: 'Vereinigte Staaten', flag_emoji: 'us' },
};

function vendors(...countries: (string | null)[]) {
  return countries.map((country) => ({ country }));
}

describe('CATEGORY_COUNTRY_MIN_VENDOR_COUNT', () => {
  it('is 3', () => {
    expect(CATEGORY_COUNTRY_MIN_VENDOR_COUNT).toBe(3);
  });
});

describe('aggregateVendorsByCountry', () => {
  it('groups vendors by country slug and counts each once', () => {
    const result = aggregateVendorsByCountry(
      vendors('Germany', 'Germany', 'Switzerland'),
      countryNameMap,
      'en'
    );

    expect(result).toHaveLength(2);
    expect(result.find((c) => c.slug === 'germany')).toMatchObject({
      label: 'Germany',
      flagRaw: 'de',
      count: 2,
    });
    expect(result.find((c) => c.slug === 'switzerland')).toMatchObject({
      label: 'Switzerland',
      count: 1,
    });
  });

  it('uses German labels when lang is de', () => {
    const result = aggregateVendorsByCountry(vendors('Germany'), countryNameMap, 'de');
    expect(result[0]?.label).toBe('Deutschland');
  });

  it('skips vendors without a country', () => {
    const result = aggregateVendorsByCountry(
      vendors(null, '', 'Germany'),
      countryNameMap,
      'en'
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.slug).toBe('germany');
  });
});

describe('selectCountriesByMinVendorCount', () => {
  const countries = [
    { slug: 'germany', label: 'Germany', flagRaw: 'de', count: 10 },
    { slug: 'switzerland', label: 'Switzerland', flagRaw: 'ch', count: 3 },
    { slug: 'austria', label: 'Austria', flagRaw: 'at', count: 2 },
    { slug: 'france', label: 'France', flagRaw: 'fr', count: 1 },
  ];

  it('keeps only countries at or above the minimum count', () => {
    const result = selectCountriesByMinVendorCount(countries, 3);
    expect(result.map((c) => c.slug)).toEqual(['germany', 'switzerland']);
  });

  it('sorts by count descending', () => {
    const result = selectCountriesByMinVendorCount(
      [
        { slug: 'a', label: 'A', flagRaw: '', count: 4 },
        { slug: 'b', label: 'B', flagRaw: '', count: 7 },
        { slug: 'c', label: 'C', flagRaw: '', count: 5 },
      ],
      3
    );
    expect(result.map((c) => c.count)).toEqual([7, 5, 4]);
  });

  it('returns empty when no country meets the threshold', () => {
    expect(selectCountriesByMinVendorCount(countries, 11)).toEqual([]);
  });

  it('defaults to CATEGORY_COUNTRY_MIN_VENDOR_COUNT', () => {
    expect(selectCountriesByMinVendorCount(countries).map((c) => c.slug)).toEqual([
      'germany',
      'switzerland',
    ]);
  });
});

describe('getCategoryCountriesByVendorCount', () => {
  it('aggregates and filters in one step', () => {
    const result = getCategoryCountriesByVendorCount(
      vendors(
        'Germany',
        'Germany',
        'Germany',
        'Switzerland',
        'Switzerland',
        'United States',
        'United States'
      ),
      countryNameMap,
      'en'
    );

    expect(result).toEqual([
      { slug: 'germany', label: 'Germany', flagRaw: 'de', count: 3 },
    ]);
  });

  it('returns empty when all countries are below threshold', () => {
    const result = getCategoryCountriesByVendorCount(
      vendors('Germany', 'Switzerland'),
      countryNameMap,
      'en'
    );
    expect(result).toEqual([]);
  });
});
