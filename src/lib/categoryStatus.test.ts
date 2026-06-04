import { describe, it, expect } from 'vitest';
import {
  VENDOR_THRESHOLD,
  computeStatus,
  isEffectivelyActive,
  thresholdProgress,
} from './categoryStatus';

describe('VENDOR_THRESHOLD', () => {
  it('is 3', () => {
    expect(VENDOR_THRESHOLD).toBe(3);
  });
});

describe('computeStatus', () => {
  it('returns pending when count is 0', () => {
    expect(computeStatus(0)).toBe('pending');
  });

  it('returns pending when count is below threshold', () => {
    expect(computeStatus(1)).toBe('pending');
    expect(computeStatus(2)).toBe('pending');
  });

  it('returns active when count equals threshold', () => {
    expect(computeStatus(3)).toBe('active');
  });

  it('returns active when count exceeds threshold', () => {
    expect(computeStatus(10)).toBe('active');
    expect(computeStatus(100)).toBe('active');
  });
});

describe('isEffectivelyActive', () => {
  it('returns true when status is active and force_active is false', () => {
    expect(isEffectivelyActive('active', false)).toBe(true);
  });

  it('returns true when status is active and force_active is true', () => {
    expect(isEffectivelyActive('active', true)).toBe(true);
  });

  it('returns false when status is pending and force_active is false', () => {
    expect(isEffectivelyActive('pending', false)).toBe(false);
  });

  it('returns true when status is pending but force_active overrides', () => {
    expect(isEffectivelyActive('pending', true)).toBe(true);
  });
});

describe('thresholdProgress', () => {
  it('returns 0% for 0 vendors', () => {
    const p = thresholdProgress(0);
    expect(p.current).toBe(0);
    expect(p.threshold).toBe(VENDOR_THRESHOLD);
    expect(p.pct).toBe(0);
    expect(p.label).toBe('0/3 vendors');
  });

  it('returns 33% for 1 vendor', () => {
    const p = thresholdProgress(1);
    expect(p.current).toBe(1);
    expect(p.pct).toBe(33);
    expect(p.label).toBe('1/3 vendors');
  });

  it('returns 67% for 2 vendors', () => {
    const p = thresholdProgress(2);
    expect(p.current).toBe(2);
    expect(p.pct).toBe(67);
    expect(p.label).toBe('2/3 vendors');
  });

  it('returns 100% at threshold', () => {
    const p = thresholdProgress(3);
    expect(p.current).toBe(3);
    expect(p.pct).toBe(100);
    expect(p.label).toBe('3/3 vendors');
  });

  it('caps current at threshold for counts above it', () => {
    const p = thresholdProgress(50);
    expect(p.current).toBe(VENDOR_THRESHOLD);
    expect(p.pct).toBe(100);
    expect(p.label).toBe('3/3 vendors');
  });
});
