/**
 * Certification type definitions
 */

export interface Certification {
  id: string;
  slug: string;
  name: string;
  reference_url?: string | null;
  category?: string | null;
  is_active?: boolean;
  created_at?: string;
}

export interface CertificationFormOption {
  id: string;
  slug: string;
  name: string;
  reference_url?: string | null;
  category?: string | null;
}
