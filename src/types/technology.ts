/**
 * Technology type definitions
 * 
 * This file contains all TypeScript interfaces related to technologies.
 * It serves as the single source of truth for technology type definitions.
 * 
 * @see DATA_STRUCTURES.md for detailed documentation
 */

/**
 * Base Technology interface matching the database schema
 * 
 * Primary identifiers:
 * - id: UUID
 * - slug: URL-friendly identifier
 * 
 * Names (bilingual):
 * - name_en, name_de: English and German names
 * 
 * Descriptions (bilingual):
 * - description_en, description_de: English and German descriptions
 * 
 * Display:
 * - icon_name: Icon identifier
 * - order_index: Display order
 * - is_active: Whether technology is active
 */
export interface Technology {
  id: string;                   // UUID
  slug: string;                 // URL-friendly identifier
  name_en?: string | null;     // English name
  name_de?: string | null;     // German name
  description_en?: string | null; // English description
  description_de?: string | null; // German description
  icon_name?: string | null;   // Icon identifier
  order_index?: number | null; // Display order
  is_active?: boolean | null;         // Whether technology is active
}

/**
 * Technology display interface for components
 * 
 * Used in components that display technologies with vendor counts.
 * The count field is computed from materialized views or queries.
 */
export interface TechnologyDisplay {
  id: string;
  slug: string;
  name_en: string;
  name_de: string;
  description_en?: string;
  description_de?: string;
  icon_name?: string;
  count?: number;              // Vendor count (from materialized view)
}

/**
 * Technology form data structure for create/update operations
 */
export interface TechnologyFormData extends Partial<Technology> {
  // Additional form-specific fields can be added here if needed
}

/**
 * Simplified technology interface for components that only need basic info
 * (used when id is not required, e.g., in card displays)
 */
export interface TechnologyBasic {
  slug: string;
  icon_name?: string | null;
  name_en?: string | null;
  name_de?: string | null;
  description_en?: string | null;
  description_de?: string | null;
  count?: number;
}

/**
 * Technology form option interface for admin forms
 * 
 * Used in form components where technologies are displayed as options.
 * Fields are required because form options come from populated database records.
 */
export interface TechnologyFormOption {
  id: string;
  slug: string;
  name_en: string;
  name_de: string;
}

