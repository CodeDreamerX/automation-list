// CSV schema and validation utilities

export const SCHEMA_FIELDS = [
  'name', 'slug', 'country', 'region', 'address', 'website', 'email', 'phone',
  'category', 'technologies', 'languages', 'certifications', 'tags',
  'description', 'logo_url'
];

export const REQUIRED_FIELDS = ['name', 'slug', 'country', 'category'];

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
    const schemaField = SCHEMA_FIELDS.find(f => f.toLowerCase() === trimmedKey);
    
    if (schemaField) {
      normalized[schemaField] = normalizeValue(row[key]);
    } else {
      unknownColumns.push(key);
    }
  }
  
  // Ensure all schema fields exist (set to null if missing)
  for (const field of SCHEMA_FIELDS) {
    if (!(field in normalized)) {
      normalized[field] = null;
    }
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
  const missingRequired = REQUIRED_FIELDS.filter(field => !row[field] || row[field] === null);
  
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
export function generateCSV(data: any[], headers: string[] = SCHEMA_FIELDS): string {
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

