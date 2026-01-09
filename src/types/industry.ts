/**
 * Industry type definition
 * Matches the structure used for technologies with bilingual support
 */
export interface Industry {
  id: string;
  slug: string;
  name: string; // Resolved by lang with fallback to name_en
  description?: string; // Optional, resolved by lang
}

/**
 * Raw industry data from database
 */
export interface IndustryDB {
  id: string;
  slug: string;
  name_en?: string;
  name_de?: string;
  description_en?: string;
  description_de?: string;
  card_description_en?: string | null;
  card_description_de?: string | null;
  order_index?: number | null;
  is_active?: boolean;
}

/**
 * Industry form option interface for admin forms
 * 
 * Used in form components where industries are displayed as options.
 * Fields are required because form options come from populated database records.
 */
export interface IndustryFormOption {
  id: string;
  slug: string;
  name_en: string;
  name_de: string;
}

/**
 * Simplified industry interface for components that only need basic info
 * (used in card displays where id is not required)
 */
export interface IndustryBasic {
  slug: string;
  name: string; // Resolved by lang with fallback to name_en
  description?: string; // Optional, resolved by lang
}






