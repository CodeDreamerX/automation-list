import { describe, it, expect } from "vitest";
import { looksLikeSvgFromBuffer } from "./upload-logo-sniff";

describe("looksLikeSvgFromBuffer", () => {
  it("detects buffer starting with <svg", () => {
    const buffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    expect(looksLikeSvgFromBuffer(buffer)).toBe(true);
  });

  it("detects buffer starting with <?xml", () => {
    const buffer = Buffer.from('<?xml version="1.0"?><svg></svg>');
    expect(looksLikeSvgFromBuffer(buffer)).toBe(true);
  });

  it("returns false for PNG magic bytes", () => {
    const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(looksLikeSvgFromBuffer(buffer)).toBe(false);
  });

  it("returns false for empty buffer", () => {
    expect(looksLikeSvgFromBuffer(Buffer.alloc(0))).toBe(false);
  });
});
