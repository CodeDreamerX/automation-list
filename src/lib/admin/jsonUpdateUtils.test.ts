import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  allowedUpdateScalarFields,
  CSV_FIELDS,
  RELATION_KEYS,
  RELATION_CONFIG,
  parseUpdateRow,
} from "./jsonUpdateUtils";

const EXCLUDED_UPDATE_FIELDS = [
  "slug",
  "logo_url",
  "logo_width",
  "logo_height",
  "meta_title",
  "meta_description",
  "specialization_text",
];

describe("allowedUpdateScalarFields", () => {
  it("lists updatable scalar vendor fields", () => {
    expect(allowedUpdateScalarFields).toContain("name");
    expect(allowedUpdateScalarFields).toContain("employee_count");
    expect(allowedUpdateScalarFields).toContain("plan");
  });

  it("does not include slug, logo, meta, or specialization_text", () => {
    for (const field of EXCLUDED_UPDATE_FIELDS) {
      expect(allowedUpdateScalarFields as readonly string[]).not.toContain(field);
    }
  });
});

describe("RELATION_KEYS and RELATION_CONFIG", () => {
  it("defines junction config for each relation key", () => {
    for (const key of RELATION_KEYS) {
      expect(RELATION_CONFIG[key].junctionTable).toBeTruthy();
      expect(RELATION_CONFIG[key].fkColumn).toBeTruthy();
    }
  });
});

describe("parseUpdateRow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-22T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("includes only scalar keys present on the row, preserving falsy values", () => {
    const { scalarFields } = parseUpdateRow({
      slug: "acme",
      plan: "free",
      featured: false,
      taking_new_projects: false,
      priority: 0,
      email: null,
    });

    expect(scalarFields.plan).toBe("free");
    expect(scalarFields.featured).toBe(false);
    expect(scalarFields.taking_new_projects).toBe(false);
    expect(scalarFields.priority).toBe(0);
    expect(scalarFields.email).toBeNull();
    expect(scalarFields.slug).toBeUndefined();
    expect(scalarFields.name).toBeUndefined();
  });

  it("ignores logo fields and sets updated_at", () => {
    const { scalarFields } = parseUpdateRow({
      slug: "acme",
      logo_url: "https://example.com/logo.png",
      name: "Acme",
    });

    expect(scalarFields.logo_url).toBeUndefined();
    expect(scalarFields.name).toBe("Acme");
    expect(scalarFields.updated_at).toBe("2026-05-22T12:00:00.000Z");
  });

  it("resolves ISO country codes to full English names", () => {
    const { scalarFields } = parseUpdateRow({
      slug: "acme",
      country: "DE",
    });

    expect(scalarFields.country).toBe("Germany");
  });

  it("leaves non-ISO country values unchanged", () => {
    const { scalarFields } = parseUpdateRow({
      slug: "acme",
      country: "Germany",
    });

    expect(scalarFields.country).toBe("Germany");
  });

  it("joins CSV array fields to comma-separated strings", () => {
    expect(CSV_FIELDS.has("languages")).toBe(true);

    const { scalarFields } = parseUpdateRow({
      slug: "acme",
      languages: ["English", "German"],
    });

    expect(scalarFields.languages).toBe("English,German");
  });

  it("extracts present relation arrays and omits absent relations", () => {
    const { presentRelations } = parseUpdateRow({
      slug: "acme",
      category_slugs: ["plc"],
      technology_slugs: ["scada"],
    });

    expect(presentRelations.category_slugs).toEqual(["plc"]);
    expect(presentRelations.technology_slugs).toEqual(["scada"]);
    expect(presentRelations.industry_slugs).toBeUndefined();
  });

  it("uses an empty array when a relation key is present but not an array", () => {
    const { presentRelations } = parseUpdateRow({
      slug: "acme",
      country_slugs: "germany",
    });

    expect(presentRelations.country_slugs).toEqual([]);
  });
});
