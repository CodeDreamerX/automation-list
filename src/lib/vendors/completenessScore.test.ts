import { describe, it, expect } from "vitest";
import { calculateCompletenessScore } from "./completenessScore";

function words(n: number): string {
  return Array.from({ length: n }, (_, i) => `word${i + 1}`).join(" ");
}

describe("calculateCompletenessScore", () => {
  it("returns 0 for a minimal vendor", () => {
    expect(calculateCompletenessScore({})).toBe(0);
  });

  it("counts employee_count as a string without numeric coercion", () => {
    expect(
      calculateCompletenessScore({
        employee_count: "50–100",
      })
    ).toBe(5);
  });

  it("accepts technology_slugs length when vendor_technologies is absent", () => {
    expect(
      calculateCompletenessScore({
        technology_slugs: ["scada", "plc"],
      })
    ).toBe(10);
  });

  it("prefers vendor_technologies length over technology_slugs", () => {
    expect(
      calculateCompletenessScore({
        vendor_technologies: [{ id: 1 }],
        technology_slugs: ["ignored"],
      })
    ).toBe(10);
  });

  it("scores description from the longest non-empty description field", () => {
    const short = calculateCompletenessScore({
      description_en: words(10),
      description_de: words(50),
    });
    const long = calculateCompletenessScore({
      description_en: words(300),
    });

    expect(short).toBe(3);
    expect(long).toBe(15);
  });

  it("caps the total score at 100", () => {
    const vendor = {
      description_en: words(300),
      logo_url: "https://example.com/logo.webp",
      vendor_technologies: [{ id: 1 }],
      vendor_industries: [{ id: 1 }],
      vendor_categories: [{ id: 1 }],
      languages: "English",
      certifications: "ISO 9001",
      employee_count: "50–100",
      year_founded: 1990,
      vendor_countries: [{ id: 1 }],
      taking_new_projects: true,
      linkedin_url: "https://linkedin.com/company/acme",
      email: "ops@acme.com",
    };

    expect(calculateCompletenessScore(vendor)).toBe(100);
  });
});
