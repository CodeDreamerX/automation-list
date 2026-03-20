/**
 * Calculate a vendor profile completeness score (0–100).
 * Baseline fields (name, slug, country, website) are required so not counted.
 */
function calculateDescriptionScore(vendor: any): number {
  const description = [vendor.description_en, vendor.description_de]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .sort((a, b) => b.length - a.length)[0];

  if (!description) return 0;

  const wordCount = description.trim().split(/\s+/).length;
  return Math.round((Math.min(wordCount, 300) / 300) * 15);
}

export function calculateCompletenessScore(vendor: any): number {
  let score = 0;

  score += calculateDescriptionScore(vendor);
  if (vendor.logo_url) score += 10;

  const techCount = vendor.vendor_technologies?.length ?? vendor.technology_slugs?.length ?? 0;
  if (techCount > 0) score += 10;

  const indCount = vendor.vendor_industries?.length ?? vendor.industry_slugs?.length ?? 0;
  if (indCount > 0) score += 10;

  const catCount = vendor.vendor_categories?.length ?? vendor.category_slugs?.length ?? 0;
  if (catCount > 0) score += 10;

  if (vendor.languages) score += 5;
  if (vendor.certifications) score += 5;
  if (vendor.employee_count) score += 5;
  if (vendor.year_founded) score += 5;
  const servedCountryCount = vendor.vendor_countries?.length ?? vendor.country_slugs?.length ?? 0;
  if (servedCountryCount > 0) score += 10;
  if (vendor.taking_new_projects !== null && vendor.taking_new_projects !== undefined) score += 5;
  if (vendor.linkedin_url) score += 5;
  if (vendor.email) score += 5;

  return Math.min(score, 100);
}
