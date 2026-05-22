import { describe, it, expect } from "vitest";
import { slugifyCountry, parseCountryParam } from "./countryUtils";

describe("slugifyCountry", () => {
  it("slugifies a standard country name", () => {
    expect(slugifyCountry("United States")).toBe("united-states");
  });

  it("strips special characters from accented names", () => {
    expect(slugifyCountry("Côte d'Ivoire")).toBe("cte-divoire");
  });

  it("strips parentheses and collapses whitespace", () => {
    expect(slugifyCountry("Korea (South)")).toBe("korea-south");
  });

  it("returns empty string for empty input", () => {
    expect(slugifyCountry("")).toBe("");
  });

  it("returns empty string for non-string input", () => {
    expect(slugifyCountry(null as unknown as string)).toBe("");
    expect(slugifyCountry(undefined as unknown as string)).toBe("");
  });
});

describe("parseCountryParam", () => {
  it("converts hyphenated slug to normalized country name", () => {
    expect(parseCountryParam("united-kingdom")).toBe("united kingdom");
  });

  it("decodes percent-encoded spaces", () => {
    expect(parseCountryParam("united%20kingdom")).toBe("united kingdom");
  });

  it("returns empty string for empty input", () => {
    expect(parseCountryParam("")).toBe("");
  });

  it("returns empty string for non-string input", () => {
    expect(parseCountryParam(null as unknown as string)).toBe("");
    expect(parseCountryParam(undefined as unknown as string)).toBe("");
  });
});
