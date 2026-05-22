import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  checkRateLimit,
  resetRateLimit,
  getClientIP,
  type RateLimitConfig,
} from "./rateLimit";

const testConfig: RateLimitConfig = {
  maxAttempts: 3,
  windowMs: 60_000,
};

describe("checkRateLimit", () => {
  const id = "test-ip-1";

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-22T12:00:00Z"));
    resetRateLimit(id);
  });

  afterEach(() => {
    resetRateLimit(id);
    vi.useRealTimers();
  });

  it("allows requests until maxAttempts is reached", () => {
    expect(checkRateLimit(id, testConfig)).toEqual({
      allowed: true,
      remaining: 2,
    });
    expect(checkRateLimit(id, testConfig)).toEqual({
      allowed: true,
      remaining: 1,
    });
    expect(checkRateLimit(id, testConfig)).toEqual({
      allowed: true,
      remaining: 0,
    });
  });

  it("blocks further requests within the window and returns retryAfter", () => {
    checkRateLimit(id, testConfig);
    checkRateLimit(id, testConfig);
    checkRateLimit(id, testConfig);

    const blocked = checkRateLimit(id, testConfig);

    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfter).toBe(60);
  });

  it("allows requests again after the window expires", () => {
    checkRateLimit(id, testConfig);
    checkRateLimit(id, testConfig);
    checkRateLimit(id, testConfig);
    expect(checkRateLimit(id, testConfig).allowed).toBe(false);

    vi.advanceTimersByTime(60_001);

    expect(checkRateLimit(id, testConfig)).toEqual({
      allowed: true,
      remaining: 2,
    });
  });

  it("clears state when resetRateLimit is called", () => {
    checkRateLimit(id, testConfig);
    checkRateLimit(id, testConfig);
    checkRateLimit(id, testConfig);
    expect(checkRateLimit(id, testConfig).allowed).toBe(false);

    resetRateLimit(id);

    expect(checkRateLimit(id, testConfig)).toEqual({
      allowed: true,
      remaining: 2,
    });
  });
});

describe("getClientIP", () => {
  it("uses the first IP from x-forwarded-for", () => {
    const request = new Request("http://localhost/", {
      headers: { "x-forwarded-for": "203.0.113.1, 198.51.100.2" },
    });

    expect(getClientIP(request)).toBe("203.0.113.1");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const request = new Request("http://localhost/", {
      headers: { "x-real-ip": "198.51.100.9" },
    });

    expect(getClientIP(request)).toBe("198.51.100.9");
  });

  it("returns unknown when no proxy headers are present", () => {
    expect(getClientIP(new Request("http://localhost/"))).toBe("unknown");
  });
});
