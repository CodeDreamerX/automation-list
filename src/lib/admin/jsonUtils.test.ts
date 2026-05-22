import { describe, it, expect } from "vitest";
import {
  allowedFields,
  REQUIRED_FIELDS,
  normalizeJsonRow,
  validateRow,
  type ValidSlugSets,
} from "./jsonUtils";

const EXCLUDED_IMPORT_FIELDS = [
  "specialization_text",
  "logo_url",
  "logo_width",
  "meta_title",
  "meta_description",
  "meta_title_de",
  "meta_description_de",
];

describe("allowedFields and REQUIRED_FIELDS", () => {
  it("requires name, slug, country, and category_slugs", () => {
    expect(REQUIRED_FIELDS).toEqual(["name", "slug", "country", "category_slugs"]);
  });

  it("does not include logo, meta, or specialization_text fields", () => {
    for (const field of EXCLUDED_IMPORT_FIELDS) {
      expect(allowedFields).not.toContain(field);
    }
  });
});

describe("normalizeJsonRow", () => {
  it("copies allowed fields and nulls absent keys", () => {
    const row = {
      name: "Acme",
      slug: "acme",
      country: "Germany",
      category_slugs: ["plc"],
    };
    const normalized = normalizeJsonRow(row);

    expect(normalized.name).toBe("Acme");
    expect(normalized.slug).toBe("acme");
    expect(normalized.country).toBe("Germany");
    expect(normalized.email).toBeNull();
    expect(normalized.website).toBeNull();
  });

  it("does not copy excluded or unknown fields from the input row", () => {
    const normalized = normalizeJsonRow({
      name: "Acme",
      slug: "acme",
      country: "Germany",
      category_slugs: ["plc"],
      specialization_text: "secret",
      logo_url: "https://example.com/logo.png",
      meta_title: "SEO",
    });

    expect(normalized.specialization_text).toBeUndefined();
    expect(normalized.logo_url).toBeUndefined();
    expect(normalized.meta_title).toBeUndefined();
  });

  it("lowercases plan values", () => {
    const normalized = normalizeJsonRow({
      name: "Acme",
      slug: "acme",
      country: "Germany",
      category_slugs: ["plc"],
      plan: "PRO",
    });
    expect(normalized.plan).toBe("pro");
  });

  it("joins languages array to comma-separated string", () => {
    const normalized = normalizeJsonRow({
      name: "Acme",
      slug: "acme",
      country: "Germany",
      category_slugs: ["plc"],
      languages: ["English", "German"],
    });
    expect(normalized.languages).toBe("English, German");
  });

  it("sets languages to null when array is empty", () => {
    const normalized = normalizeJsonRow({
      name: "Acme",
      slug: "acme",
      country: "Germany",
      category_slugs: ["plc"],
      languages: [],
    });
    expect(normalized.languages).toBeNull();
  });

  it("extracts M2M slug arrays and lowercases country slugs", () => {
    const normalized = normalizeJsonRow({
      name: "Acme",
      slug: "acme",
      country: "Germany",
      category_slugs: ["plc"],
      technology_slugs: ["scada"],
      industry_slugs: ["automotive"],
      certification_slugs: ["iso-9001"],
      country_slugs: [" Germany ", "FRANCE"],
    });

    expect(normalized._categorySlugs).toEqual(["plc"]);
    expect(normalized._technologySlugs).toEqual(["scada"]);
    expect(normalized._industrySlugs).toEqual(["automotive"]);
    expect(normalized._certificationSlugs).toEqual(["iso-9001"]);
    expect(normalized._countrySlugs).toEqual(["germany", "france"]);
  });

  it("uses empty arrays when relation slug fields are missing", () => {
    const normalized = normalizeJsonRow({
      name: "Acme",
      slug: "acme",
      country: "Germany",
      category_slugs: ["plc"],
    });

    expect(normalized._technologySlugs).toEqual([]);
    expect(normalized._countrySlugs).toEqual([]);
  });
});

describe("validateRow", () => {
  const validSlugs: ValidSlugSets = {
    categories: new Set(["plc"]),
    technologies: new Set(["scada"]),
    industries: new Set(["automotive"]),
    certifications: new Set(["iso-9001"]),
    countries: new Set(["germany"]),
  };

  const validRow = normalizeJsonRow({
    name: "Acme",
    slug: "acme",
    country: "Germany",
    category_slugs: ["plc"],
    email: "ops@acme.com",
    website: "https://acme.com",
    languages: "English, German",
  });

  it("reports no issues for a valid normalized row", () => {
    const result = validateRow(validRow, 0, ["acme"], validSlugs);

    expect(result.missingRequired).toEqual([]);
    expect(result.invalidEmail).toBe(false);
    expect(result.invalidWebsite).toBe(false);
    expect(result.duplicateSlug).toBe(false);
    expect(result.unknownCategories).toEqual([]);
    expect(result.unknownTechnologies).toEqual([]);
    expect(result.unknownIndustries).toEqual([]);
    expect(result.unknownCertifications).toEqual([]);
    expect(result.unknownCountries).toEqual([]);
    expect(result.unknownLanguages).toEqual([]);
  });

  it("reports missing required fields including empty category slugs", () => {
    const row = normalizeJsonRow({
      slug: "acme",
      country: "Germany",
      category_slugs: [],
    });

    const result = validateRow(row, 0, ["acme"], validSlugs);

    expect(result.missingRequired).toContain("name");
    expect(result.missingRequired).toContain("category_slugs");
  });

  it("flags invalid email and website", () => {
    const row = normalizeJsonRow({
      name: "Acme",
      slug: "acme",
      country: "Germany",
      category_slugs: ["plc"],
      email: "not-an-email",
      website: "acme.com",
    });

    const result = validateRow(row, 0, ["acme"], validSlugs);

    expect(result.invalidEmail).toBe(true);
    expect(result.invalidWebsite).toBe(true);
  });

  it("flags duplicate slug within the import batch", () => {
    const result = validateRow(validRow, 0, ["acme", "acme"], validSlugs);
    expect(result.duplicateSlug).toBe(true);
  });

  it("flags unknown taxonomy and language slugs", () => {
    const row = normalizeJsonRow({
      name: "Acme",
      slug: "acme",
      country: "Germany",
      category_slugs: ["unknown-cat"],
      technology_slugs: ["unknown-tech"],
      industry_slugs: ["unknown-ind"],
      certification_slugs: ["unknown-cert"],
      country_slugs: ["unknown-country"],
      languages: "English, Klingon",
    });

    const result = validateRow(row, 0, ["acme"], validSlugs);

    expect(result.unknownCategories).toEqual(["unknown-cat"]);
    expect(result.unknownTechnologies).toEqual(["unknown-tech"]);
    expect(result.unknownIndustries).toEqual(["unknown-ind"]);
    expect(result.unknownCertifications).toEqual(["unknown-cert"]);
    expect(result.unknownCountries).toEqual(["unknown-country"]);
    expect(result.unknownLanguages).toEqual(["Klingon"]);
  });
});
