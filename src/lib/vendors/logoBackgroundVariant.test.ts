import { describe, it, expect } from "vitest";
import {
  mapFormVariantToDbVariant,
  mapDbVariantToFormVariant,
} from "./logoBackgroundVariant";

describe("mapFormVariantToDbVariant", () => {
  it("maps white and light form values to light", () => {
    expect(mapFormVariantToDbVariant("white")).toBe("light");
    expect(mapFormVariantToDbVariant("light")).toBe("light");
  });

  it("maps gray and neutral form values to neutral", () => {
    expect(mapFormVariantToDbVariant("gray")).toBe("neutral");
    expect(mapFormVariantToDbVariant("neutral")).toBe("neutral");
  });

  it("maps dark and brand unchanged", () => {
    expect(mapFormVariantToDbVariant("dark")).toBe("dark");
    expect(mapFormVariantToDbVariant("brand")).toBe("brand");
  });

  it("defaults unknown or empty values to light", () => {
    expect(mapFormVariantToDbVariant("unknown")).toBe("light");
    expect(mapFormVariantToDbVariant("")).toBe("light");
    expect(mapFormVariantToDbVariant(null)).toBe("light");
    expect(mapFormVariantToDbVariant(undefined)).toBe("light");
  });

  it("is case-insensitive", () => {
    expect(mapFormVariantToDbVariant("WHITE")).toBe("light");
    expect(mapFormVariantToDbVariant("Gray")).toBe("neutral");
  });
});

describe("mapDbVariantToFormVariant", () => {
  it("maps light database value to white form value", () => {
    expect(mapDbVariantToFormVariant("light")).toBe("white");
  });

  it("maps neutral database value to gray form value", () => {
    expect(mapDbVariantToFormVariant("neutral")).toBe("gray");
  });

  it("maps dark and brand unchanged", () => {
    expect(mapDbVariantToFormVariant("dark")).toBe("dark");
    expect(mapDbVariantToFormVariant("brand")).toBe("brand");
  });

  it("defaults unknown or empty values to white", () => {
    expect(mapDbVariantToFormVariant("unknown")).toBe("white");
    expect(mapDbVariantToFormVariant("")).toBe("white");
    expect(mapDbVariantToFormVariant(null)).toBe("white");
    expect(mapDbVariantToFormVariant(undefined)).toBe("white");
  });
});

describe("form ↔ db round-trip", () => {
  it("round-trips canonical db values through form and back", () => {
    const dbValues = ["light", "neutral", "dark", "brand"] as const;
    for (const db of dbValues) {
      const form = mapDbVariantToFormVariant(db);
      expect(mapFormVariantToDbVariant(form)).toBe(db);
    }
  });

  it("round-trips common form picker values to db and back to form", () => {
    const formValues = ["white", "light", "gray", "neutral", "dark", "brand"] as const;
    for (const form of formValues) {
      const db = mapFormVariantToDbVariant(form);
      const backToForm = mapDbVariantToFormVariant(db);
      expect(mapFormVariantToDbVariant(backToForm)).toBe(db);
    }
  });
});
