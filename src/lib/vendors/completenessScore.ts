/**
 * Calculate a vendor profile completeness score (0–100).
 * Baseline fields (name, slug, country, website) are required so not counted.
 */
export function calculateCompletenessScore(vendor: any): number {
  let score = 0;

  if (vendor.description_en || vendor.description_de) score += 15;
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
  if (vendor.countries_served) score += 10;
  if (vendor.taking_new_projects !== null && vendor.taking_new_projects !== undefined) score += 5;
  if (vendor.linkedin_url) score += 5;
  if (vendor.email) score += 5;

  return Math.min(score, 100);
}
