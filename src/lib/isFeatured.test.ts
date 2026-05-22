import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isFeatured } from "./isFeatured";

describe("isFeatured", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-22T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true when plan is featured", () => {
    expect(isFeatured({ plan: "featured", featured: false })).toBe(true);
  });

  it("returns true when featured flag is set and featured_until is in the future", () => {
    expect(
      isFeatured({
        plan: "pro",
        featured: true,
        featured_until: "2026-12-31T00:00:00Z",
      })
    ).toBe(true);
  });

  it("returns false when featured flag is set but featured_until is in the past", () => {
    expect(
      isFeatured({
        plan: "pro",
        featured: true,
        featured_until: "2020-01-01T00:00:00Z",
      })
    ).toBe(false);
  });

  it("returns false when featured is true but featured_until is missing", () => {
    expect(isFeatured({ plan: "pro", featured: true })).toBe(false);
    expect(isFeatured({ plan: "pro", featured: true, featured_until: null })).toBe(false);
  });

  it("returns false when not featured and plan is not featured", () => {
    expect(isFeatured({ plan: "free", featured: false })).toBe(false);
  });
});
