import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getRequiredEnvVar, getBooleanEnvVar } from "./env";

describe("getRequiredEnvVar", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the value from process.env when set", () => {
    vi.stubEnv("TEST_REQUIRED_VAR", "from-process");
    expect(getRequiredEnvVar("TEST_REQUIRED_VAR")).toBe("from-process");
  });

  it("throws when the variable is missing", () => {
    expect(() => getRequiredEnvVar("MISSING_TEST_REQUIRED_VAR")).toThrow(
      /Missing required environment variable: MISSING_TEST_REQUIRED_VAR/
    );
  });
});

describe("getBooleanEnvVar", () => {
  const flag = "TEST_BOOLEAN_FLAG";

  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns default false when unset", () => {
    expect(getBooleanEnvVar(flag)).toBe(false);
    expect(getBooleanEnvVar(flag, true)).toBe(true);
  });

  it.each(["true", "TRUE", "1", "yes", "YES", "on", "ON"])(
    "treats %s as enabled",
    (value) => {
      vi.stubEnv(flag, value);
      expect(getBooleanEnvVar(flag)).toBe(true);
    }
  );

  it("returns false for other non-empty values", () => {
    vi.stubEnv(flag, "false");
    expect(getBooleanEnvVar(flag)).toBe(false);

    vi.stubEnv(flag, "0");
    expect(getBooleanEnvVar(flag)).toBe(false);
  });

  it("matches DISABLE_PRO_PAYWALL truthy values", () => {
    vi.stubEnv("DISABLE_PRO_PAYWALL", "yes");
    expect(getBooleanEnvVar("DISABLE_PRO_PAYWALL")).toBe(true);
  });
});
