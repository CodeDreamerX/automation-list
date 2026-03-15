import type { FaqItem } from './industry';

/**
 * Raw country data from database
 */
export interface CountryDB {
  id: string;
  slug: string;
  name_en: string;
  name_de?: string | null;
  description_en?: string | null;
  description_de?: string | null;
  card_description_en?: string | null;
  card_description_de?: string | null;
  flag_emoji?: string | null;
  order_index?: number | null;
  is_active: boolean;
  faq_en?: FaqItem[] | null;
  faq_de?: FaqItem[] | null;
}

/**
 * Country with resolved bilingual name/description
 */
export interface Country {
  id: string;
  slug: string;
  name: string; // Resolved by lang with fallback to name_en
  description?: string | null;
  card_description_en?: string | null;
  card_description_de?: string | null;
  flag_emoji?: string | null;
}

/**
 * Simplified country for card/grid displays
 */
export interface CountryBasic {
  slug: string;
  name: string; // Resolved by lang
  card_description_en?: string | null;
  card_description_de?: string | null;
  flag_emoji?: string | null;
}

/**
 * Country option for admin forms (vendor categorization)
 */
export interface CountryFormOption {
  id: string;
  slug: string;
  name_en: string;
  name_de?: string | null;
  flag_emoji?: string | null;
}
