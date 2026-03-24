// JSON import schema and validation utilities

import { vendorLanguageSet } from './languageOptions';

export const allowedFields = [
  "name",
  "slug",
  "country",
  "region",
  "city",
  "address",
  "website",
  "email",
  "phone",
  "description_en",
  "description_de",
  "languages",
  "industry_slugs",
  "category_slugs",
  "technology_slugs",
  "certification_slugs",
  "country_slugs",
  "year_founded",
  "employee_count",
  "hourly_rate",
  "plan",
  "featured",
  "priority",
  "og_member",
  "featured_until",
  "taking_new_projects",
  "linkedin_url",
  // specialization_text: admin UI only — not JSON import/export
  // logo_* and meta_* fields intentionally excluded from JSON import
];

export const REQUIRED_FIELDS = ['name', 'slug', 'country', 'category_slugs'];

// Normalize a JSON row — no type coercion needed, JSON types are native
export function normalizeJsonRow(row: any): any {
  const normalized: any = {};

  // Copy all known fields (null if absent)
  for (const field of allowedFields) {
    normalized[field] = field in row ? (row[field] ?? null) : null;
  }

  // Lowercase plan value
  if (typeof normalized.plan === 'string') {
    normalized.plan = normalized.plan.toLowerCase();
  }

  // Join array fields to comma-separated strings for TEXT DB columns
  for (const field of ['languages'] as const) {
    if (Array.isArray(normalized[field])) {
      normalized[field] = normalized[field].length > 0
        ? (normalized[field] as string[]).join(', ')
        : null;
    }
  }

  // Extract M2M slug arrays directly from native JSON arrays
  normalized._categorySlugs = Array.isArray(normalized.category_slugs)
    ? (normalized.category_slugs as string[])
    : [];
  normalized._technologySlugs = Array.isArray(normalized.technology_slugs)
    ? (normalized.technology_slugs as string[])
    : [];
  normalized._industrySlugs = Array.isArray(normalized.industry_slugs)
    ? (normalized.industry_slugs as string[])
    : [];
  normalized._certificationSlugs = Array.isArray(normalized.certification_slugs)
    ? (normalized.certification_slugs as string[])
    : [];
  normalized._countrySlugs = Array.isArray(normalized.country_slugs)
    ? (normalized.country_slugs as string[])
        .map((s) => String(s).trim().toLowerCase())
        .filter(Boolean)
    : [];

  return normalized;
}

export type ValidSlugSets = {
  categories: Set<string>;
  technologies: Set<string>;
  industries: Set<string>;
  certifications: Set<string>;
  countries: Set<string>;
};

export type ValidationResult = {
  missingRequired: string[];
  invalidEmail: boolean;
  invalidWebsite: boolean;
  duplicateSlug: boolean;
  unknownCategories: string[];
  unknownTechnologies: string[];
  unknownIndustries: string[];
  unknownCertifications: string[];
  unknownCountries: string[];
  unknownLanguages: string[];
};

export function validateRow(
  row: any,
  index: number,
  allSlugs: string[],
  validSlugs?: ValidSlugSets
): ValidationResult {
  let invalidEmail = false;
  let invalidWebsite = false;
  let duplicateSlug = false;

  const missingRequired = REQUIRED_FIELDS.filter(field => {
    if (field === 'category_slugs') {
      return !row._categorySlugs || !Array.isArray(row._categorySlugs) || row._categorySlugs.length === 0;
    }
    return !row[field] || row[field] === null;
  });

  if (row.email && row.email !== null) {
    if (!String(row.email).includes('@')) {
      invalidEmail = true;
    }
  }

  if (row.website && row.website !== null) {
    const website = String(row.website).toLowerCase();
    if (!website.startsWith('http://') && !website.startsWith('https://')) {
      invalidWebsite = true;
    }
  }

  if (row.slug && row.slug !== null) {
    const slugCount = allSlugs.filter(s => s === row.slug).length;
    if (slugCount > 1) {
      duplicateSlug = true;
    }
  }

  const unknownCategories = validSlugs
    ? (row._categorySlugs || []).filter((s: string) => !validSlugs.categories.has(s))
    : [];
  const unknownTechnologies = validSlugs
    ? (row._technologySlugs || []).filter((s: string) => !validSlugs.technologies.has(s))
    : [];
  const unknownIndustries = validSlugs
    ? (row._industrySlugs || []).filter((s: string) => !validSlugs.industries.has(s))
    : [];
  const unknownCertifications = validSlugs
    ? (row._certificationSlugs || []).filter((s: string) => !validSlugs.certifications.has(s))
    : [];
  const unknownCountries = validSlugs
    ? (row._countrySlugs || []).filter((s: string) => !validSlugs.countries.has(s))
    : [];

  let unknownLanguages: string[] = [];
  if (row.languages && typeof row.languages === 'string' && row.languages.trim()) {
    const parts = row.languages
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);
    unknownLanguages = parts.filter((label) => !vendorLanguageSet.has(label));
  }

  return {
    missingRequired,
    invalidEmail,
    invalidWebsite,
    duplicateSlug,
    unknownCategories,
    unknownTechnologies,
    unknownIndustries,
    unknownCertifications,
    unknownCountries,
    unknownLanguages,
  };
}
