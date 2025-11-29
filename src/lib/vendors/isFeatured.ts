export function isFeatured(v: any): boolean {
  const now = new Date();
  return (
    v.featured === true ||
    v.plan === "featured" ||
    v.priority === 1 ||
    (v.featured_until && new Date(v.featured_until) > now)
  );
}

