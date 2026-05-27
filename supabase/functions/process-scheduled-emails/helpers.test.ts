/**
 * Unit tests for the pure helpers inlined in index.ts.
 * The functions are duplicated here so the test has no local imports
 * (index.ts uses Deno APIs that can't be loaded by vitest).
 */
import { describe, it, expect } from 'vitest';

function parseEnvInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === null || raw === '') return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

function shouldMarkFailed(attempts: number, maxAttempts: number): boolean {
  return attempts >= maxAttempts;
}

// ──────────────────────────────────────────────────────────────────────────────
// parseEnvInt
// ──────────────────────────────────────────────────────────────────────────────

describe('parseEnvInt', () => {
  it('parses a valid positive integer string', () => {
    expect(parseEnvInt('5', 3)).toBe(5);
  });

  it('parses zero as a valid value (not the fallback)', () => {
    expect(parseEnvInt('0', 3)).toBe(0);
  });

  it('returns the fallback when the value is undefined', () => {
    expect(parseEnvInt(undefined, 3)).toBe(3);
  });

  it('returns the fallback when the value is an empty string', () => {
    expect(parseEnvInt('', 3)).toBe(3);
  });

  it('returns the fallback when the value is a non-numeric string', () => {
    expect(parseEnvInt('invalid', 3)).toBe(3);
  });

  it('truncates a float string (parseInt behaviour)', () => {
    expect(parseEnvInt('3.7', 10)).toBe(3);
  });

  it('returns the fallback for NaN-producing strings like "abc123"', () => {
    expect(parseEnvInt('abc123', 5)).toBe(5);
  });

  it('handles large integers without clamping', () => {
    expect(parseEnvInt('1000', 3)).toBe(1000);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// shouldMarkFailed
// ──────────────────────────────────────────────────────────────────────────────

describe('shouldMarkFailed', () => {
  it('returns false when attempts is strictly below the max', () => {
    expect(shouldMarkFailed(2, 3)).toBe(false);
  });

  it('returns true when attempts equals the max (exhausted)', () => {
    expect(shouldMarkFailed(3, 3)).toBe(true);
  });

  it('returns true when attempts exceeds the max', () => {
    expect(shouldMarkFailed(4, 3)).toBe(true);
  });

  it('returns true on the very first attempt when maxAttempts is 1', () => {
    expect(shouldMarkFailed(1, 1)).toBe(true);
  });

  it('returns false before any attempt has been made (attempts=0)', () => {
    expect(shouldMarkFailed(0, 1)).toBe(false);
  });
});
