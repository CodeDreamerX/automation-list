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
  order_index?: number | null;
  is_active?: boolean;
}




