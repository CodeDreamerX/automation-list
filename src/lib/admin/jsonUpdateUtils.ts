// All scalar fields that may appear in an update row (logo_* excluded by design)
export const allowedUpdateScalarFields = [
  'name', 'country', 'region', 'city', 'address',
  'description_en', 'description_de',
  'website', 'email', 'phone',
  'employee_count', 'year_founded', 'hourly_rate',
  'languages', 'tags',
  'taking_new_projects', 'linkedin_url', 'specialization_text',
  'plan', 'featured', 'priority', 'og_member', 'featured_until',
] as const;

// Fields stored as comma-separated TEXT in DB
export const CSV_FIELDS = new Set(['languages', 'tags']);

// M2M relation array keys and their junction table config
export const RELATION_KEYS = [
  'category_slugs',
  'technology_slugs',
  'industry_slugs',
  'certification_slugs',
  'country_slugs',
] as const;

export type RelationKey = typeof RELATION_KEYS[number];

export interface RelationConfig {
  junctionTable: string;
  fkColumn: string;
}

export const RELATION_CONFIG: Record<RelationKey, RelationConfig> = {
  category_slugs:      { junctionTable: 'vendor_categories',    fkColumn: 'category_id' },
  technology_slugs:    { junctionTable: 'vendor_technologies',  fkColumn: 'technology_id' },
  industry_slugs:      { junctionTable: 'vendor_industries',    fkColumn: 'industry_id' },
  certification_slugs: { junctionTable: 'vendor_certifications', fkColumn: 'certification_id' },
  country_slugs:       { junctionTable: 'vendor_countries',      fkColumn: 'country_id' },
};

export interface ParsedUpdateRow {
  scalarFields: Record<string, unknown>;
  presentRelations: Partial<Record<RelationKey, string[]>>;
}

// Intl.DisplayNames instance for resolving ISO 3166-1 alpha-2 codes to full English names
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

/**
 * If the value looks like an ISO 3166-1 alpha-2 code (2 uppercase letters),
 * resolve it to the full English country name. Otherwise return as-is.
 * Returns null/undefined unchanged.
 */
function resolveCountryName(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (/^[A-Z]{2}$/.test(trimmed)) {
    try {
      const resolved = regionNames.of(trimmed);
      // Intl returns the code itself when unrecognised — only substitute if different
      if (resolved && resolved !== trimmed) return resolved;
    } catch {
      // unrecognised code — leave as-is
    }
  }
  return value;
}

/**
 * Parse a raw JSON row into scalarFields (for DB update) and presentRelations.
 *
 * Rules:
 * - Only includes a scalar field if the key is literally present in the row object
 *   (uses `field in row`), so false/0/null/"" are all valid patch values
 * - `country`: ISO alpha-2 codes (e.g. "DE") are automatically resolved to full names
 * - Converts other CSV fields (languages, tags) to comma-separated strings
 * - Extracts relation arrays into presentRelations only if the key exists in the row
 * - Omits `slug` from scalarFields (it is the match key, not a DB write)
 * - Ignores all logo_* keys
 * - Always sets updated_at
 */
export function parseUpdateRow(row: Record<string, unknown>): ParsedUpdateRow {
  const scalarFields: Record<string, unknown> = {};
  const presentRelations: Partial<Record<RelationKey, string[]>> = {};

  for (const field of allowedUpdateScalarFields) {
    if (field in row) {
      const val = row[field];

      if (field === 'country') {
        scalarFields[field] = resolveCountryName(val);
      } else if (CSV_FIELDS.has(field)) {
        scalarFields[field] = Array.isArray(val) ? val.join(',') : val;
      } else {
        scalarFields[field] = val;
      }
    }
  }

  for (const key of RELATION_KEYS) {
    if (key in row) {
      const val = row[key];
      presentRelations[key] = Array.isArray(val) ? (val as string[]) : [];
    }
  }

  scalarFields['updated_at'] = new Date().toISOString();

  return { scalarFields, presentRelations };
}

// Template object for download — one example vendor with all updatable fields
export const UPDATE_TEMPLATE = [
  {
    slug: 'example-vendor-slug',
    name: 'Example Vendor Name',
    country: 'Germany',
    region: 'Bavaria',
    city: 'Munich',
    address: 'Example Street 1',
    description_en: 'Short English description',
    description_de: 'Kurze deutsche Beschreibung',
    website: 'https://example.com',
    email: 'contact@example.com',
    phone: '+49 123 456789',
    employee_count: '10-50',
    year_founded: 2015,
    hourly_rate: '100-150',
    languages: ['de', 'en'],
    tags: ['automation', 'rpa'],
    taking_new_projects: true,
    linkedin_url: 'https://linkedin.com/company/example',
    specialization_text: 'Specializes in robotic process automation for finance.',
    plan: 'free',
    featured: false,
    priority: 5,
    og_member: false,
    featured_until: null,
    category_slugs: ['rpa', 'ai-automation'],
    technology_slugs: ['uipath', 'python'],
    industry_slugs: ['finance', 'logistics'],
    certification_slugs: ['iso-27001'],
    country_slugs: ['germany', 'austria', 'switzerland'],
  },
];
