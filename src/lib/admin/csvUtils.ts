// CSV schema and validation utilities

// In-memory CSV storage for upload sessions (keyed by sessionId)
export const csvStore = new Map<string, string>();

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
  "description",
  "description_en",
  "description_de",
  "technologies",
  "languages",
  "certifications",
  "tags",
  "industries",
  "industry_slugs",
  "year_founded",
  "employee_count",
  "hourly_rate",
  "plan",
  "featured",
  "priority",
  "og_member",
  "featured_until",
  "meta_title",
  "meta_description",
  "canonical_url",
  "logo_url",
  "logo_width",
  "logo_height",
  "logo_format",
  "logo_alt",
  "logo_background_variant",
  "category_slugs",
  "technology_slugs",
  "countries_served",
  "taking_new_projects",
  "linkedin_url",
  "specialization_text",
];

export const REQUIRED_FIELDS = ['name', 'slug', 'country', 'category_slugs'];

// Normalize a single value
export function normalizeValue(value: any): string | null {
  if (value === null || value === undefined) return null;
  
  let str = String(value);
  // Remove wrapping quotes
  str = str.replace(/^["']|["']$/g, '');
  // Trim whitespace
  str = str.trim();
  
  // Convert empty strings to null
  if (str === '') return null;
  
  return str;
}

// Normalize a row
export function normalizeRow(row: any): { normalized: any; unknownColumns: string[] } {
  const normalized: any = {};
  const unknownColumns: string[] = [];
  
  // Process all keys from the row
  for (const key in row) {
    const normalizedKey = normalizeValue(key);
    if (!normalizedKey) continue;
    
    const trimmedKey = normalizedKey.trim().toLowerCase();
    
    // Check if this is a known schema field (case-insensitive)
    const schemaField = allowedFields.find(f => f.toLowerCase() === trimmedKey);
    
    if (schemaField) {
      const rawValue = row[key];
      
      // Convert boolean fields from "true"/"false" strings to boolean
      if (schemaField === 'featured' || schemaField === 'og_member' || schemaField === 'taking_new_projects') {
        const strValue = String(rawValue || '').trim().toLowerCase();
        normalized[schemaField] = strValue === 'true' || strValue === '1' || strValue === 'yes';
      }
      // Convert number fields to numbers
      else if (
        schemaField === 'priority' ||
        schemaField === 'year_founded' ||
        schemaField === 'logo_width' ||
        schemaField === 'logo_height'
      ) {
        const numValue = Number(rawValue);
        normalized[schemaField] = isNaN(numValue) ? null : numValue;
      }
      // Handle slug list fields with semicolon separator
      else if (
        schemaField === 'category_slugs' ||
        schemaField === 'technology_slugs' ||
        schemaField === 'industry_slugs'
      ) {
        const value = String(rawValue || '');
        normalized[schemaField] = value; // Store as-is, will be processed separately
      }
      // All other fields: normalize as string
      else {
        normalized[schemaField] = normalizeValue(rawValue);
      }
    } else {
      unknownColumns.push(key);
    }
  }
  
  // Ensure all schema fields exist (set to null if missing)
  for (const field of allowedFields) {
    if (!(field in normalized)) {
      normalized[field] = null;
    }
  }
  
  // Process semicolon-separated slug lists
  const processSlugList = (field: 'category_slugs' | 'technology_slugs' | 'industry_slugs', outputKey: string) => {
    if (normalized[field]) {
      const processed = String(normalized[field])
        .split(';')
        .map((s: string) => s.trim().toLowerCase())
        .filter(Boolean);
      normalized[outputKey] = processed;
      if (processed.length === 0) {
        normalized[field] = null;
      }
    } else {
      normalized[outputKey] = [];
    }
  };

  processSlugList('category_slugs', '_categorySlugs');
  processSlugList('technology_slugs', '_technologySlugs');
  processSlugList('industry_slugs', '_industrySlugs');
  
  return { normalized, unknownColumns };
}

// Validation result type
export type ValidationResult = {
  missingRequired: string[];
  invalidEmail: boolean;
  invalidWebsite: boolean;
  duplicateSlug: boolean;
};

// Validate a row
export function validateRow(row: any, index: number, allSlugs: string[]): ValidationResult {
  let invalidEmail = false;
  let invalidWebsite = false;
  let duplicateSlug = false;
  
  // Check required fields
  const missingRequired = REQUIRED_FIELDS.filter(field => {
    if (field === 'category_slugs') {
      // For category_slugs, check that _categorySlugs array has at least one element
      // This ensures we have valid category slugs after processing, not just whitespace
      return !row._categorySlugs || !Array.isArray(row._categorySlugs) || row._categorySlugs.length === 0;
    }
    return !row[field] || row[field] === null;
  });
  
  // Validate email
  if (row.email && row.email !== null) {
    if (!row.email.includes('@')) {
      invalidEmail = true;
    }
  }
  
  // Validate website
  if (row.website && row.website !== null) {
    const website = String(row.website).toLowerCase();
    if (!website.startsWith('http://') && !website.startsWith('https://')) {
      invalidWebsite = true;
    }
  }
  
  // Check for duplicate slug in CSV
  if (row.slug && row.slug !== null) {
    const slugCount = allSlugs.filter(s => s === row.slug).length;
    if (slugCount > 1) {
      duplicateSlug = true;
    }
  }
  
  return {
    missingRequired,
    invalidEmail,
    invalidWebsite,
    duplicateSlug
  };
}

// Generate CSV from data
export function generateCSV(data: any[], headers: string[] = allowedFields): string {
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const csvRow = headers.map(header => {
      const value = row[header] || '';
      const strValue = value.toString();
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
        return `"${strValue.replace(/"/g, '""')}"`;
      }
      return strValue;
    });
    csvRows.push(csvRow.join(','));
  }
  
  return csvRows.join('\n');
}

