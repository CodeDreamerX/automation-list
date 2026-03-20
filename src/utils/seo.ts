/**
 * Builds an SEO-optimized vendor page title.
 * Cascades through richest combination that fits within 60 total characters.
 * Manual override always takes priority.
 */
export function buildVendorTitle(
  name: string,
  category: string,
  country: string,
  manualTitle: string | null | undefined
): string {
  if (manualTitle) return manualTitle;

  const suffix = ' | Automation List'; // 18 chars
  const maxBody = 60 - suffix.length;  // 42 chars for body
  const sep = ' — ';

  const full = `${name}${sep}${category}${sep}${country}`;
  if (category && country && full.length <= maxBody) {
    return `${full}${suffix}`;
  }

  const nameCat = `${name}${sep}${category}`;
  if (category && nameCat.length <= maxBody) {
    return `${nameCat}${suffix}`;
  }

  const nameCountry = `${name}${sep}${country}`;
  if (country && nameCountry.length <= maxBody) {
    return `${nameCountry}${suffix}`;
  }

  return `${name}${suffix}`;
}
