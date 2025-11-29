export function isFeatured(v: any): boolean {
  if (v.plan === "premium") return true;
  if (!v.featured) return false;
  if (!v.featured_until) return false;
  return new Date(v.featured_until) > new Date();
}

