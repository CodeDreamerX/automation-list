/**
 * Normalizes technology names consistently for storage and URL generation.
 * 
 * Steps:
 * 1. Lowercase
 * 2. Trim whitespace
 * 3. Replace multiple spaces with single space
 * 4. Slugify for URLs (replace spaces with hyphens, remove special chars)
 * 
 * @param str - Technology name string to normalize
 * @returns Normalized technology slug for URLs
 */
export function normalizeTech(str: string): string {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  return str
    .toLowerCase()                    // Step 1: lowercase
    .trim()                          // Step 2: trim
    .replace(/\s+/g, ' ')            // Step 3: replace multiple spaces with single space
    .replace(/[^\w\s-]/g, '')        // Remove special characters (keep word chars, spaces, hyphens)
    .replace(/\s+/g, '-')            // Step 4: replace spaces with hyphens (slugify)
    .replace(/-+/g, '-')             // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '');          // Remove leading/trailing hyphens
}

/**
 * Normalizes technology name for storage (normalizes case and spacing, keeps spaces).
 * This is used when storing technologies in the database.
 * 
 * Steps:
 * 1. Lowercase
 * 2. Trim whitespace
 * 3. Replace multiple spaces with single space
 * 
 * @param str - Technology name string to normalize
 * @returns Normalized technology name for storage
 */
export function normalizeTechForStorage(str: string): string {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  return str
    .toLowerCase()                    // Step 1: lowercase
    .trim()                          // Step 2: trim
    .replace(/\s+/g, ' ');           // Step 3: replace multiple spaces with single space
}

