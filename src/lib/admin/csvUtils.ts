// CSV schema and validation utilities

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
      else if (schemaField === 'priority' || schemaField === 'year_founded' || schemaField === 'employee_count') {
        const numValue = Number(rawValue);
        normalized[schemaField] = isNaN(numValue) ? null : numValue;
      }
      // Handle category_slugs with semicolon separator
      else if (schemaField === 'category_slugs') {
        const categoryValue = String(rawValue || '');
        normalized[schemaField] = categoryValue; // Store as-is, will be processed separately
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
    normalized._categorySlugs = String(normalized.category_slugs)
      .split(';')
      .map((s: string) => s.trim().toLowerCase())
      .filter(Boolean);
  } else {
    normalized._categorySlugs = [];
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


