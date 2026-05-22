import { describe, it, expect } from "vitest";
import {
  buildCountryCanonicalLookup,
  resolveCanonicalCountryName,
} from "./countryResolve";

const sampleCountries = [
  { slug: "germany", name_en: "Germany", name_de: "Deutschland" },
  { slug: "united-states", name_en: "United States", name_de: "Vereinigte Staaten" },
];

describe("buildCountryCanonicalLookup", () => {
  it("indexes canonical English names by slug, name_en, and name_de", () => {
    const lookup = buildCountryCanonicalLookup(sampleCountries);

    expect(lookup.get("germany")).toBe("Germany");
    expect(lookup.get("deutschland")).toBe("Germany");
    expect(lookup.get("united-states")).toBe("United States");
    expect(lookup.get("vereinigte staaten")).toBe("United States");
  });

  it("skips countries without a canonical name_en", () => {
    const lookup = buildCountryCanonicalLookup([
      { slug: "empty", name_en: "  ", name_de: "Leer" },
      { slug: "valid", name_en: "Valid", name_de: null },
    ]);

    expect(lookup.has("empty")).toBe(false);
    expect(lookup.get("valid")).toBe("Valid");
  });
});

describe("resolveCanonicalCountryName", () => {
  const lookup = buildCountryCanonicalLookup(sampleCountries);

  it("resolves slug input case-insensitively", () => {
    expect(resolveCanonicalCountryName("GERMANY", lookup)).toBe("Germany");
    expect(resolveCanonicalCountryName("united-states", lookup)).toBe("United States");
  });

  it("resolves English and German display names", () => {
    expect(resolveCanonicalCountryName("germany", lookup)).toBe("Germany");
    expect(resolveCanonicalCountryName("Deutschland", lookup)).toBe("Germany");
    expect(resolveCanonicalCountryName("vereinigte staaten", lookup)).toBe("United States");
  });

  it("returns trimmed input unchanged when not in lookup", () => {
    expect(resolveCanonicalCountryName("Switzerland", lookup)).toBe("Switzerland");
    expect(resolveCanonicalCountryName("  Unknown Place  ", lookup)).toBe("Unknown Place");
  });

  it("returns null for null, undefined, or blank input", () => {
    expect(resolveCanonicalCountryName(null, lookup)).toBeNull();
    expect(resolveCanonicalCountryName(undefined, lookup)).toBeNull();
    expect(resolveCanonicalCountryName("", lookup)).toBeNull();
    expect(resolveCanonicalCountryName("   ", lookup)).toBeNull();
  });
});
