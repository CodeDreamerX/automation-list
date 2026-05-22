import { describe, it, expect } from "vitest";
import { normalizeVendor, normalizeVendors } from "./vendorUtils";
import type { VendorWithRelations } from "../../types/vendor";

function makeVendor(overrides: Partial<VendorWithRelations> = {}): VendorWithRelations {
  return {
    id: "vendor-1",
    name: "Acme",
    slug: "acme",
    country: "Germany",
    ...overrides,
  } as VendorWithRelations;
}

describe("normalizeVendor", () => {
  it("extracts category slugs by default", () => {
    const vendor = makeVendor({
      vendor_categories: [
        { categories: { slug: "plc" } },
        { categories: { slug: "robotics" } },
      ],
    });

    const normalized = normalizeVendor(vendor);

    expect(normalized.category_slugs).toEqual(["plc", "robotics"]);
  });

  it("returns empty category slugs when relations are missing", () => {
    const normalized = normalizeVendor(makeVendor());

    expect(normalized.category_slugs).toEqual([]);
  });

  it("filters out relations without a slug", () => {
    const vendor = makeVendor({
      vendor_categories: [
        { categories: { slug: "plc" } },
        { categories: null },
        { categories: { slug: undefined } },
      ],
    });

    expect(normalizeVendor(vendor).category_slugs).toEqual(["plc"]);
  });

  it("extracts optional relation slugs when flags are enabled", () => {
    const vendor = makeVendor({
      vendor_technologies: [{ technologies: { slug: "scada" } }],
      vendor_industries: [{ industries: { slug: "automotive" } }],
      vendor_certifications: [{ certifications: { slug: "iso-9001" } }],
      vendor_countries: [{ countries: { slug: "germany" } }],
    });

    const normalized = normalizeVendor(vendor, {
      includeTechnologies: true,
      includeIndustries: true,
      includeCertifications: true,
      includeCountries: true,
    });

    expect(normalized.technology_slugs).toEqual(["scada"]);
    expect(normalized.industry_slugs).toEqual(["automotive"]);
    expect(normalized.certification_slugs).toEqual(["iso-9001"]);
    expect(normalized.country_slugs).toEqual(["germany"]);
  });

  it("does not set technology slugs unless includeTechnologies is true", () => {
    const vendor = makeVendor({
      vendor_technologies: [{ technologies: { slug: "scada" } }],
    });

    const normalized = normalizeVendor(vendor);

    expect(normalized.technology_slugs).toBeUndefined();
  });

  it("does not extract categories when includeCategories is false", () => {
    const vendor = makeVendor({
      vendor_categories: [{ categories: { slug: "plc" } }],
      category_slugs: ["legacy"],
    });

    const normalized = normalizeVendor(vendor, { includeCategories: false });

    expect(normalized.category_slugs).toEqual(["legacy"]);
  });
});

describe("normalizeVendors", () => {
  it("normalizes each vendor in the array", () => {
    const vendors = [
      makeVendor({
        vendor_categories: [{ categories: { slug: "plc" } }],
      }),
      makeVendor({
        vendor_categories: [{ categories: { slug: "robotics" } }],
      }),
    ];

    const normalized = normalizeVendors(vendors);

    expect(normalized[0].category_slugs).toEqual(["plc"]);
    expect(normalized[1].category_slugs).toEqual(["robotics"]);
  });
});
