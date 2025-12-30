/**
 * Centralized meta description resolver for vendor pages
 * 
 * SEO Intent:
 * - Ensures language-correct meta descriptions for search engines
 * - Prevents empty or broken meta tags that can hurt SEO
 * - Uses appropriate character limits (155 for EN, 160 for DE) for optimal SERP display
 */

import type { Vendor } from '../types/vendor';

/**
 * Truncates text on word boundaries to a maximum character limit.
 * Normalizes whitespace and appends ellipsis if truncated.
 * 
 * @param text - The text to truncate
 * @param maxChars - Maximum characters (default: 155)
 * @returns Truncated text with ellipsis, or null if input is empty
 */
export function truncateWords(text: string | null | undefined, maxChars: number = 155): string | null {
  // Return null for empty input
  if (!text || typeof text !== 'string') {
    return null;
  }

  // Normalize whitespace: collapse multiple spaces/tabs/newlines into single space
  const normalized = text.replace(/\s+/g, ' ').trim();

  // Return null if normalized text is empty
  if (!normalized) {
    return null;
  }

  // If text fits within limit, return as-is
  if (normalized.length <= maxChars) {
    return normalized;
  }

  // Truncate on word boundary
  // Find the last space before maxChars
  let truncateAt = maxChars;
  const lastSpace = normalized.lastIndexOf(' ', maxChars);
  
  // If we found a space within reasonable distance (within 20 chars), use it
  if (lastSpace > maxChars - 20) {
    truncateAt = lastSpace;
  }

  // Truncate and append ellipsis
  return normalized.substring(0, truncateAt).trim() + '…';
}

/**
 * Resolves meta description for a vendor based on language.
 * 
 * Resolution rules:
 * 
 * EN (/en/*):
 * - If vendor.meta_description exists → truncate to 155 chars and use it
 * - Else → truncate vendor.description_en to 155 chars
 * - Else → return null
 * 
 * DE (/de/*):
 * - If vendor.meta_description exists → truncate to 160 chars and use it
 * - Else → truncate vendor.description_de to 160 chars
 * - Else → fallback to truncate vendor.description_en to 160 chars
 * - Else → return null
 * 
 * @param vendor - The vendor object with description fields
 * @param lang - Language code ('en' or 'de')
 * @returns Resolved meta description or null if no description available
 */
export function resolveMetaDescription(vendor: Vendor, lang: 'en' | 'de'): string | null {
  if (lang === 'en') {
    // EN: meta_description (155) → description_en (155) → null
    if (vendor.meta_description) {
      return truncateWords(vendor.meta_description, 155);
    }
    if (vendor.description_en) {
      return truncateWords(vendor.description_en, 155);
    }
    return null;
  } else {
    // DE: meta_description (160) → description_de (160) → description_en (160) → null
    if (vendor.meta_description) {
      return truncateWords(vendor.meta_description, 160);
    }
    if (vendor.description_de) {
      return truncateWords(vendor.description_de, 160);
    }
    if (vendor.description_en) {
      return truncateWords(vendor.description_en, 160);
    }
    return null;
  }
}














