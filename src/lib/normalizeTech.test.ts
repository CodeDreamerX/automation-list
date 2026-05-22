import { describe, it, expect } from "vitest";
import { normalizeTech, normalizeTechForStorage } from "./normalizeTech";

describe("normalizeTech", () => {
  it("slugifies technology names with special characters", () => {
    expect(normalizeTech("SCADA / HMI")).toBe("scada-hmi");
  });

  it("collapses multiple spaces and trims", () => {
    expect(normalizeTech("  PLC   Systems  ")).toBe("plc-systems");
  });

  it("collapses multiple hyphens and trims leading/trailing hyphens", () => {
    expect(normalizeTech(" - PLC - ")).toBe("plc");
    expect(normalizeTech("foo--bar")).toBe("foo-bar");
  });

  it("returns empty string for empty input", () => {
    expect(normalizeTech("")).toBe("");
  });

  it("returns empty string for non-string input", () => {
    expect(normalizeTech(null as unknown as string)).toBe("");
    expect(normalizeTech(undefined as unknown as string)).toBe("");
  });
});

describe("normalizeTechForStorage", () => {
  it("normalizes case and spacing but keeps spaces and slashes", () => {
    expect(normalizeTechForStorage("SCADA / HMI")).toBe("scada / hmi");
  });

  it("collapses multiple spaces and trims", () => {
    expect(normalizeTechForStorage("  PLC   Systems  ")).toBe("plc systems");
  });

  it("returns empty string for empty input", () => {
    expect(normalizeTechForStorage("")).toBe("");
  });

  it("returns empty string for non-string input", () => {
    expect(normalizeTechForStorage(null as unknown as string)).toBe("");
    expect(normalizeTechForStorage(undefined as unknown as string)).toBe("");
  });
});
