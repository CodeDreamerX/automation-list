import { describe, it, expect } from "vitest";
import { truncateWords, resolveMetaDescription } from "./metaDescription";
import type { Vendor } from "../types/vendor";

function makeVendor(overrides: Partial<Vendor> = {}): Vendor {
  return {
    id: "vendor-1",
    name: "Acme",
    slug: "acme",
    country: "Germany",
    ...overrides,
  } as Vendor;
}

describe("truncateWords", () => {
  it("returns short text unchanged", () => {
    expect(truncateWords("Short vendor summary.")).toBe("Short vendor summary.");
  });

  it("truncates on a word boundary and appends ellipsis", () => {
    const text =
      "word ".repeat(40).trim();
    const result = truncateWords(text, 50);

    expect(result).not.toBeNull();
    expect(result!.length).toBeLessThanOrEqual(51);
    expect(result!.endsWith("…")).toBe(true);
    expect(result!.includes("word word")).toBe(true);
  });

  it("uses the requested max character limit", () => {
    const text = "a ".repeat(100).trim();
    const en = truncateWords(text, 155);
    const de = truncateWords(text, 160);

    expect(en!.length).toBeLessThanOrEqual(156);
    expect(de!.length).toBeLessThanOrEqual(161);
  });

  it("returns null for empty or non-string input", () => {
    expect(truncateWords("")).toBeNull();
    expect(truncateWords("   ")).toBeNull();
    expect(truncateWords(null)).toBeNull();
    expect(truncateWords(undefined)).toBeNull();
  });

  it("normalizes internal whitespace", () => {
    expect(truncateWords("line one\n\tline   two")).toBe("line one line two");
  });
});

describe("resolveMetaDescription", () => {
  it("prefers meta_description for EN", () => {
    const vendor = makeVendor({
      meta_description: "Custom EN meta",
      description_en: "English body",
    });

    expect(resolveMetaDescription(vendor, "en")).toBe("Custom EN meta");
  });

  it("falls back to description_en for EN when meta is absent", () => {
    const vendor = makeVendor({
      description_en: "English body",
      description_de: "German body",
    });

    expect(resolveMetaDescription(vendor, "en")).toBe("English body");
  });

  it("returns null for EN when no description fields exist", () => {
    expect(resolveMetaDescription(makeVendor(), "en")).toBeNull();
  });

  it("prefers meta_description_de then description_de for DE", () => {
    const vendor = makeVendor({
      meta_description_de: "Custom DE meta",
      description_de: "German body",
      description_en: "English body",
    });

    expect(resolveMetaDescription(vendor, "de")).toBe("Custom DE meta");
  });

  it("falls back to description_en for DE when DE fields are absent", () => {
    const vendor = makeVendor({
      description_en: "English fallback",
    });

    expect(resolveMetaDescription(vendor, "de")).toBe("English fallback");
  });

  it("returns null for DE when no description fields exist", () => {
    expect(resolveMetaDescription(makeVendor(), "de")).toBeNull();
  });
});
