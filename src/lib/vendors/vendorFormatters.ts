import type { VendorWithRelations } from '../../types/vendor';

/**
 * Formats vendor technologies for display
 * Returns the first 2 technology names, joined by comma, with "..." if there are more
 */
export function formatTechnologies(vendor: VendorWithRelations, lang: "en" | "de"): string {
  if (!vendor.vendor_technologies || vendor.vendor_technologies.length === 0) return '';
  const techNames = vendor.vendor_technologies
    .map((vt: any) => {
      if (lang === "de") {
        return vt.technologies?.name_de || vt.technologies?.name_en;
      }
      return vt.technologies?.name_en || vt.technologies?.name_de;
    })
    .filter(Boolean)
    .slice(0, 2);
  return techNames.join(', ') + (vendor.vendor_technologies.length > 2 ? '...' : '');
}

/**
 * Truncates text to a maximum length, adding an ellipsis if truncated
 */
export function truncateDescription(text: string | null | undefined, maxLength: number = 120): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '…';
}

