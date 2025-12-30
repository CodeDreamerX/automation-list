/**
 * Vendor utility functions
 * 
 * This file contains utility functions for working with vendor data,
 * including normalization, formatting, and data transformation.
 */

import type { VendorWithRelations, VendorCategoryRelation, VendorTechnologyRelation, VendorIndustryRelation } from '../../types/vendor';

/**
 * Normalizes a vendor by extracting slug arrays from relationship data
 * 
 * This function extracts category, technology, and industry slugs from
 * the vendor's relationship arrays, making them easily accessible as
 * simple string arrays.
 * 
 * @param vendor - Vendor with relations (from Supabase query)
 * @param options - Normalization options
 * @param options.includeCategories - Whether to normalize category_slugs (default: true)
 * @param options.includeTechnologies - Whether to normalize technology_slugs (default: false)
 * @param options.includeIndustries - Whether to normalize industry_slugs (default: false)
 * @returns Normalized vendor with slug arrays
 * 
 * @example
 * ```typescript
 * // Normalize only category slugs (most common case)
 * const normalized = normalizeVendor(vendor);
 * 
 * // Normalize all slug arrays
 * const normalized = normalizeVendor(vendor, {
 *   includeCategories: true,
 *   includeTechnologies: true,
 *   includeIndustries: true
 * });
 * ```
 */
export function normalizeVendor(
  vendor: VendorWithRelations,
  options: {
    includeCategories?: boolean;
    includeTechnologies?: boolean;
    includeIndustries?: boolean;
  } = {}
): VendorWithRelations {
  const {
    includeCategories = true,
    includeTechnologies = false,
    includeIndustries = false,
  } = options;

  const normalized: VendorWithRelations = { ...vendor };

  if (includeCategories) {
    normalized.category_slugs = vendor.vendor_categories
      ?.map((vc: VendorCategoryRelation) => vc.categories?.slug)
      .filter(Boolean) || [];
  }

  if (includeTechnologies) {
    normalized.technology_slugs = vendor.vendor_technologies
      ?.map((vt: VendorTechnologyRelation) => vt.technologies?.slug)
      .filter(Boolean) || [];
  }

  if (includeIndustries) {
    normalized.industry_slugs = vendor.vendor_industries
      ?.map((vi: VendorIndustryRelation) => vi.industries?.slug)
      .filter(Boolean) || [];
  }

  return normalized;
}

/**
 * Normalizes an array of vendors
 * 
 * Convenience function for normalizing multiple vendors at once.
 * 
 * @param vendors - Array of vendors with relations
 * @param options - Normalization options (same as normalizeVendor)
 * @returns Array of normalized vendors
 * 
 * @example
 * ```typescript
 * // Normalize only category slugs
 * const normalized = normalizeVendors(vendors);
 * 
 * // Normalize all slug arrays
 * const normalized = normalizeVendors(vendors, {
 *   includeCategories: true,
 *   includeTechnologies: true,
 *   includeIndustries: true
 * });
 * ```
 */
export function normalizeVendors(
  vendors: VendorWithRelations[],
  options?: {
    includeCategories?: boolean;
    includeTechnologies?: boolean;
    includeIndustries?: boolean;
  }
): VendorWithRelations[] {
  return vendors.map(vendor => normalizeVendor(vendor, options));
}

