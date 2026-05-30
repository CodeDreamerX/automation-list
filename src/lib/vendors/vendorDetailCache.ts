import { deleteCached } from '../cache';

const VENDOR_DETAIL_CACHE_VERSION = 'v2';

export function vendorDetailCacheKey(slug: string): string {
  return `vendor:detail:${VENDOR_DETAIL_CACHE_VERSION}:${slug.trim()}`;
}

/** Bust cached vendor detail (and legacy key) after admin writes. */
export function invalidateVendorDetailCache(slug: string | null | undefined): void {
  const trimmed = slug?.trim();
  if (!trimmed) return;
  deleteCached(vendorDetailCacheKey(trimmed));
  deleteCached(`vendor:detail:${trimmed}`);
}
