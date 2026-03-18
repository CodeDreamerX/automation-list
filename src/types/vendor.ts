/**
 * Vendor type definitions
 * 
 * This file contains all TypeScript interfaces related to vendors.
 * It serves as the single source of truth for vendor type definitions.
 * 
 * @see DATA_STRUCTURES.md for detailed documentation
 */

/**
 * Base Vendor interface matching the database schema
 * 
 * Primary identifiers:
 * - id: UUID, auto-generated
 * - name: Required, NOT NULL
 * - slug: Required, NOT NULL, unique, URL-friendly identifier
 * 
 * Location:
 * - country: Required, NOT NULL
 * - region, city, address: Optional location fields
 * 
 * Descriptions:
 * - description_en, description_de: Bilingual descriptions
 * - description: Legacy field (deprecated, use description_en/de)
 * 
 * Contact:
 * - website, email, phone: Contact information
 * 
 * Company details:
 * - year_founded, employee_count: Company information
 * - hourly_rate: Pricing information
 * 
 * Categorization:
 * - languages, certifications, tags: Comma-separated strings
 * 
 * Plan & featuring:
 * - plan: 'free' | 'pro' | 'featured' | 'deactivated'
 * - priority: integer, default: 5, higher = more prominent
 * - featured: boolean, default: false
 * - featured_until: timestamp with time zone
 * - og_member: boolean, default: false (Original/Founding member flag)
 * 
 * Logo:
 * - logo_url, logo_width, logo_height, logo_format, logo_alt
 * 
 * SEO:
 * - meta_title, meta_description, canonical_url
 * 
 * Timestamps:
 * - created_at: NOT NULL, default: now()
 * - updated_at: default: now()
 */
export interface Vendor {
  // Primary identifiers
  id: string;                    // UUID, auto-generated (gen_random_uuid())
  name: string;                  // NOT NULL - Required
  slug: string;                  // NOT NULL - Required, unique, URL-friendly identifier
  
  // Descriptions (bilingual)
  description?: string | null;   // Legacy field (deprecated, use description_en/de)
  description_en?: string | null; // English description
  description_de?: string | null; // German description
  
  // Contact information
  website?: string | null;       // URL (auto-prefixed with https://)
  email?: string | null;
  phone?: string | null;
  
  // Location
  address?: string | null;
  city?: string | null;
  region?: string | null;
  country: string;               // NOT NULL - Required
  
  // Company details
  year_founded?: number | null;  // integer
  employee_count?: string | null; // text (supports ranges like "50-100")
  hourly_rate?: string | null;   // text (e.g., "€50-100")

  // New profile fields
  countries_served?: string | null;     // comma-separated (e.g., "Germany, Austria, Switzerland")
  taking_new_projects?: boolean | null; // availability flag
  linkedin_url?: string | null;         // LinkedIn company page URL
  specialization_text?: string | null;  // "What makes us different" free text
  
  // Categorization (stored as comma-separated strings)
  languages?: string | null;     // Comma-separated, e.g., "English, German, French"
  certifications?: string | null; // Comma-separated
  tags?: string | null;          // Comma-separated (indexed)
  
  // Plan & featuring
  plan?: 'free' | 'pro' | 'featured' | 'deactivated' | null; // Default: 'free'
  priority?: number | null;      // integer, default: 5, higher = more prominent
  featured?: boolean | null;     // boolean, default: false
  featured_until?: string | null; // timestamp with time zone (ISO date string)
  og_member?: boolean | null;    // boolean, default: false - Original/Founding member flag
  
  // Logo information
  logo_url?: string | null;       // URL to logo image
  logo_width?: number | null;    // integer - Logo width in pixels
  logo_height?: number | null;   // integer - Logo height in pixels
  logo_format?: string | null;   // text - Image format (png, jpg, webp, svg)
  logo_alt?: string | null;       // Alt text for logo
  
  // SEO metadata
  meta_title?: string | null;
  meta_description?: string | null;
  meta_description_de?: string | null;
  canonical_url?: string | null;
  
  // Timestamps
  created_at: string;            // timestamp with time zone, NOT NULL, default: now()
  updated_at?: string | null;    // timestamp with time zone, default: now()
}

/**
 * Category relation structure (from vendor_categories join table)
 */
export interface VendorCategoryRelation {
  is_primary?: boolean | null;
  categories?: {
    id: string;
    slug: string;
    name_en?: string | null;
    name_de?: string | null;
  } | null;
}

/**
 * Technology relation structure (from vendor_technologies join table)
 */
export interface VendorTechnologyRelation {
  technologies?: {
    id: string;
    slug: string;
    name_en?: string | null;
    name_de?: string | null;
  } | null;
}

/**
 * Industry relation structure (from vendor_industries join table)
 */
export interface VendorIndustryRelation {
  industries?: {
    id: string;
    slug: string;
    name_en?: string | null;
    name_de?: string | null;
  } | null;
}

/**
 * Certification relation structure (from vendor_certifications join table)
 */
export interface VendorCertificationRelation {
  certifications?: {
    id: string;
    slug: string;
    name: string;
    reference_url?: string | null;
    category?: string | null;
  } | null;
}

/**
 * Country relation structure (from vendor_countries join table)
 */
export interface VendorCountryRelation {
  countries?: {
    id: string;
    slug: string;
    name_en: string;
    name_de?: string | null;
    flag_emoji?: string | null;
  } | null;
}

/**
 * Vendor with all relationships loaded from join tables
 */
export interface VendorWithRelations extends Vendor {
  // Categories (many-to-many via vendor_categories)
  vendor_categories?: VendorCategoryRelation[] | null;

  // Technologies (many-to-many via vendor_technologies)
  vendor_technologies?: VendorTechnologyRelation[] | null;

  // Industries (many-to-many via vendor_industries)
  vendor_industries?: VendorIndustryRelation[] | null;

  // Certifications (many-to-many via vendor_certifications)
  vendor_certifications?: VendorCertificationRelation[] | null;

  // Countries served (many-to-many via vendor_countries)
  vendor_countries?: VendorCountryRelation[] | null;

  // Normalized arrays (computed from relationships)
  category_slugs?: string[];
  technology_slugs?: string[];
  industry_slugs?: string[];
  certification_slugs?: string[];
  country_slugs?: string[];
}

/**
 * Vendor form data structure for create/update operations
 */
export interface VendorFormData extends Partial<Vendor> {
  category_slugs?: string[];
  technology_slugs?: string[];
  industry_slugs?: string[];
  certification_slugs?: string[];
  country_slugs?: string[];
}

