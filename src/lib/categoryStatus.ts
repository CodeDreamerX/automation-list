/**
 * Pure helpers for the Category Status System.
 *
 * Categories are automatically activated when their vendor count reaches
 * VENDOR_THRESHOLD. Admins can override this via force_active.
 * is_active = (status === 'active') || force_active  — kept in sync by DB trigger.
 *
 * These helpers are intentionally framework-free so they can be imported
 * in server code, client scripts, and tests without any bundler ceremony.
 */

/** Minimum number of vendors required to auto-activate a category. */
export const VENDOR_THRESHOLD = 3;

export type CategoryStatus = 'pending' | 'active';

/**
 * Derives the automatic status for a category based on its vendor count.
 * Does not account for force_active — use isEffectivelyActive for that.
 */
export function computeStatus(vendorCount: number): CategoryStatus {
  return vendorCount >= VENDOR_THRESHOLD ? 'active' : 'pending';
}

/**
 * Returns whether a category should be treated as active on public surfaces.
 * Mirrors the DB expression: (status = 'active') OR force_active.
 */
export function isEffectivelyActive(
  status: CategoryStatus,
  forceActive: boolean,
): boolean {
  return status === 'active' || forceActive;
}

export interface ThresholdProgress {
  current: number;
  threshold: number;
  pct: number;
  /** Human-readable label, e.g. "2/3 vendors" */
  label: string;
}

/**
 * Returns progress toward the activation threshold.
 * current is capped at threshold so progress never exceeds 100%.
 */
export function thresholdProgress(vendorCount: number): ThresholdProgress {
  const current = Math.min(vendorCount, VENDOR_THRESHOLD);
  return {
    current,
    threshold: VENDOR_THRESHOLD,
    pct: Math.round((current / VENDOR_THRESHOLD) * 100),
    label: `${Math.min(vendorCount, VENDOR_THRESHOLD)}/${VENDOR_THRESHOLD} vendors`,
  };
}
