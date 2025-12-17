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
  "technologies",
  "languages",
  "certifications",
  "tags",
  "industries",
  "year_founded",
  "employee_count",
  "hourly_rate",
  "plan",
  "featured",
  "priority",
  "og_member",
  "category_slugs",
  "technology_slugs",
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
      if (schemaField === 'featured' || schemaField === 'og_member') {
        const strValue = String(rawValue || '').trim().toLowerCase();
        normalized[schemaField] = strValue === 'true' || strValue === '1' || strValue === 'yes';
      }
      // Convert number fields to numbers
      else if (schemaField === 'priority' || schemaField === 'year_founded' || schemaField === 'employee_count' || schemaField === 'hourly_rate') {
        const numValue = Number(rawValue);
        normalized[schemaField] = isNaN(numValue) ? null : numValue;
      }
      // Handle category_slugs and technology_slugs with semicolon separator
      else if (schemaField === 'category_slugs' || schemaField === 'technology_slugs') {
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
  
  // Process category slugs: split by semicolon, lowercase, trim, filter empty
  if (normalized.category_slugs) {
    const processed = String(normalized.category_slugs)
      .split(';')
      .map((s: string) => s.trim().toLowerCase())
      .filter(Boolean);
    normalized._categorySlugs = processed;
    // If processing resulted in empty array, set category_slugs to null for consistent validation
    if (processed.length === 0) {
      normalized.category_slugs = null;
    }
  } else {
    normalized._categorySlugs = [];
  }
  
  // Process technology slugs: split by semicolon, lowercase, trim, filter empty
  if (normalized.technology_slugs) {
    const processed = String(normalized.technology_slugs)
      .split(';')
      .map((s: string) => s.trim().toLowerCase())
      .filter(Boolean);
    normalized._technologySlugs = processed;
    // If processing resulted in empty array, set technology_slugs to null
    if (processed.length === 0) {
      normalized.technology_slugs = null;
    }
  } else {
    normalized._technologySlugs = [];
  }
  
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


