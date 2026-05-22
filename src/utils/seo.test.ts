import { describe, it, expect } from "vitest";
import {
  buildVendorTitle,
  applyMetaDescriptionCountPlaceholder,
} from "./seo";

const SUFFIX = " | Automation List";

describe("buildVendorTitle", () => {
  it("returns manual title unchanged when provided", () => {
    expect(buildVendorTitle("Acme", "PLC", "Germany", "Custom Title")).toBe(
      "Custom Title"
    );
  });

  it("builds full title when name, category, and country fit within the limit", () => {
    const title = buildVendorTitle("Acme", "PLC", "Germany", null);

    expect(title).toBe(`Acme — PLC — Germany${SUFFIX}`);
    expect(title.length).toBeLessThanOrEqual(60);
  });

  it("falls back to name and category when full title is too long", () => {
    const title = buildVendorTitle(
      "1234567890",
      "ABCDEFGHIJKLMNOPQRST",
      "ABCDEFGHIJKLMNOPQRST",
      null
    );

    expect(title).toBe(`1234567890 — ABCDEFGHIJKLMNOPQRST${SUFFIX}`);
    expect(title.length).toBeLessThanOrEqual(60);
  });

  it("falls back to name only when category and country are empty", () => {
    expect(buildVendorTitle("Acme", "", "", null)).toBe(`Acme${SUFFIX}`);
  });

  it("keeps auto-generated titles within 60 characters", () => {
    const title = buildVendorTitle("Acme", "PLC", "Germany", null);
    expect(title.length).toBeLessThanOrEqual(60);
  });
});

describe("applyMetaDescriptionCountPlaceholder", () => {
  it("returns description unchanged when placeholder is absent", () => {
    expect(
      applyMetaDescriptionCountPlaceholder("Browse automation vendors.", 12)
    ).toBe("Browse automation vendors.");
  });

  it("replaces {count} with the vendor count", () => {
    expect(
      applyMetaDescriptionCountPlaceholder("Browse {count} vendors in this category.", 12)
    ).toBe("Browse 12 vendors in this category.");
  });

  it("replaces multiple placeholders and treats null count as zero", () => {
    expect(
      applyMetaDescriptionCountPlaceholder("{count} vendors ({count} total).", null)
    ).toBe("0 vendors (0 total).");
  });
});
