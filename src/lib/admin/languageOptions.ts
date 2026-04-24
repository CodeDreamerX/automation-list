/**
 * Canonical language labels for vendor listings (admin checkboxes + JSON import).
 * Keep in sync with VENDOR_LANGUAGE_OPTIONS — this is what /api/admin/export-slugs returns for `languages`.
 */
export const VENDOR_LANGUAGE_OPTIONS = [
  'English',
  'German',
  'French',
  'Spanish',
  'Italian',
  'Portuguese',
  'Dutch',
  'Polish',
  'Czech',
  'Turkish',
  'Chinese',
  'Japanese',
] as const;

export const vendorLanguageSet = new Set<string>(VENDOR_LANGUAGE_OPTIONS);
