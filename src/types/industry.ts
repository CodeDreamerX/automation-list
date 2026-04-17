/**
 * Industry type definition
 * Matches the structure used for technologies with bilingual support
 */
export interface Industry {
  id: string;
  slug: string;
  name: string; // Resolved by lang with fallback to name_en
  description?: string; // Optional, resolved by lang
  card_description_en?: string | null;
  card_description_de?: string | null;
  icon_name?: string | null;
  count?: number;
}

export interface FaqItem {
  question: string;
  answer: string;
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
  icon_name?: string | null;
  order_index?: number | null;
  is_active?: boolean;
  meta_description_en?: string | null;
  meta_description_de?: string | null;
  headline_en?: string | null;
  headline_de?: string | null;
  meta_title_en?: string | null;
  meta_title_de?: string | null;
  faq_en?: FaqItem[] | null;   // FAQ entries in English
  faq_de?: FaqItem[] | null;   // FAQ entries in German
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
  card_description_en?: string | null;
  card_description_de?: string | null;
  icon_name?: string | null;
  count?: number;
}






