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
        { categories: { id: "c1", slug: "plc" } },
        { categories: { id: "c2", slug: "robotics" } },
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
        { categories: { id: "c1", slug: "plc" } },
        { categories: null },
        { categories: { id: "c3", slug: undefined as unknown as string } },
      ],
    });

    expect(normalizeVendor(vendor).category_slugs).toEqual(["plc"]);
  });

  it("extracts optional relation slugs when flags are enabled", () => {
    const vendor = makeVendor({
      vendor_technologies: [{ technologies: { id: "t1", slug: "scada", name_en: "SCADA" } }],
      vendor_industries: [{ industries: { id: "i1", slug: "automotive" } }],
      vendor_certifications: [{ certifications: { id: "cert1", slug: "iso-9001", name: "ISO 9001" } }],
      vendor_countries: [{ countries: { id: "co1", slug: "germany", name_en: "Germany" } }],
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
      vendor_technologies: [{ technologies: { id: "t1", slug: "scada", name_en: "SCADA" } }],
    });

    const normalized = normalizeVendor(vendor);

    expect(normalized.technology_slugs).toBeUndefined();
  });

  it("does not extract categories when includeCategories is false", () => {
    const vendor = makeVendor({
      vendor_categories: [{ categories: { id: "c1", slug: "plc" } }],
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
        vendor_categories: [{ categories: { id: "c1", slug: "plc" } }],
      }),
      makeVendor({
        vendor_categories: [{ categories: { id: "c2", slug: "robotics" } }],
      }),
    ];

    const normalized = normalizeVendors(vendors);

    expect(normalized[0].category_slugs).toEqual(["plc"]);
    expect(normalized[1].category_slugs).toEqual(["robotics"]);
  });
});
