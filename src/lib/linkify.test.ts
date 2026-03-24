import { describe, it, expect } from "vitest";
import { linkifyText, escapeHtml, regexEscape } from "./linkify";
import { getKeywordMap } from "./keyword-map";

describe("escapeHtml", () => {
  it("escapes all special HTML characters", () => {
    expect(escapeHtml('a & b < c > d "e"')).toBe("a &amp; b &lt; c &gt; d &quot;e&quot;");
  });

  it("returns empty string unchanged", () => {
    expect(escapeHtml("")).toBe("");
  });
});

describe("regexEscape", () => {
  it("escapes regex special characters including /", () => {
    expect(regexEscape("SCADA/HMI")).toBe("SCADA\\/HMI");
    expect(regexEscape("a.b*c+d")).toBe("a\\.b\\*c\\+d");
  });
});

describe("getKeywordMap", () => {
  it("returns EN entries as a Map", () => {
    const map = getKeywordMap('en');
    expect(map).toBeInstanceOf(Map);
    expect(map.size).toBeGreaterThan(0);
    expect(map.get('siemens')).toBe('/en/technology/siemens');
  });

  it("returns DE entries", () => {
    const map = getKeywordMap('de');
    expect(map.get('siemens')).toBe('/de/technology/siemens');
  });

  it("returns empty Map for unknown lang", () => {
    const map = getKeywordMap('xx' as any);
    expect(map.size).toBe(0);
  });

  it("filters out _comment_ keys", () => {
    const map = getKeywordMap('en');
    for (const k of map.keys()) expect(k).not.toMatch(/^_comment/);
  });
});

describe("linkifyText", () => {
  const map = new Map([
    ["plc", "/en/technology/plc"],
    ["scada/hmi", "/en/technology/scada-hmi"],
    ["scada", "/en/technology/scada"],
    ["mes", "/en/category/mes"],
  ]);

  it("links a basic keyword", () => {
    const result = linkifyText("We use PLC in automation.", map);
    expect(result).toContain('<a href="/en/technology/plc"');
    expect(result).toContain(">PLC</a>");
  });

  it("preserves original casing of matched text", () => {
    const result = linkifyText("Using Plc here.", map);
    expect(result).toContain(">Plc</a>");
  });

  it("longest-first: SCADA/HMI beats SCADA", () => {
    const result = linkifyText("SCADA/HMI systems are common.", map);
    expect(result).toContain('href="/en/technology/scada-hmi"');
    expect(result).not.toContain('href="/en/technology/scada"');
  });

  it("respects maxLinks cap", () => {
    const m = new Map([
      ["a", "/a"],
      ["b", "/b"],
      ["c", "/c"],
    ]);
    const result = linkifyText("a b c", m, { maxLinks: 2 });
    const count = (result.match(/<a /g) || []).length;
    expect(count).toBe(2);
  });

  it("firstMatchOnly: only links first occurrence of each keyword (default)", () => {
    const result = linkifyText("PLC and PLC again.", map);
    const count = (result.match(/<a /g) || []).length;
    expect(count).toBe(1);
  });

  it("firstMatchOnly: false links all occurrences", () => {
    const result = linkifyText("PLC and PLC again.", map, { firstMatchOnly: false, maxLinks: 10 });
    const count = (result.match(/<a /g) || []).length;
    expect(count).toBe(2);
  });

  it("XSS: escapes <script> in input", () => {
    const result = linkifyText('<script>alert("xss")</script>', map);
    expect(result).not.toContain("<script>");
    expect(result).toContain("&lt;script&gt;");
  });

  it("returns empty string for empty input", () => {
    expect(linkifyText("", map)).toBe("");
  });

  it("returns escaped text when map is empty", () => {
    const result = linkifyText("Hello <world>", new Map());
    expect(result).toBe("Hello &lt;world&gt;");
  });

  it("does not link partial word matches", () => {
    // "mes" should not match inside "measurement"
    const result = linkifyText("measurement systems", map);
    expect(result).not.toContain("<a");
  });

  // --- Plural / suffix matching ---

  it("plural s: links 'PLCs' to PLC url, preserving full matched text", () => {
    const result = linkifyText("modern PLCs are fast", map);
    expect(result).toContain('href="/en/technology/plc"');
    expect(result).toContain(">PLCs</a>");
  });

  it("plural es: links 'Buses' when keyword is 'Bus'", () => {
    const busMap = new Map([["bus", "/en/technology/bus"]]);
    const result = linkifyText("industrial Buses connect devices", busMap);
    expect(result).toContain('href="/en/technology/bus"');
    expect(result).toContain(">Buses</a>");
  });

  it("no false strip on natural-s keyword: 'Siemens' matches exactly", () => {
    const m = new Map([["siemens", "/en/vendor/siemens"]]);
    const result = linkifyText("Siemens offers solutions", m);
    expect(result).toContain('href="/en/vendor/siemens"');
    expect(result).toContain(">Siemens</a>");
  });

  it("no match inside longer word even with suffix rule: 'complexity'", () => {
    const result = linkifyText("complexity is high", map);
    expect(result).not.toContain("<a");
  });

  it("exact match still works without suffix: SCADA in 'SCADA systems'", () => {
    const result = linkifyText("SCADA systems are used", map);
    expect(result).toContain('href="/en/technology/scada"');
    expect(result).toContain(">SCADA</a>");
  });

  it("longest-first still respected with suffix: SCADA/HMI beats SCADA", () => {
    const result = linkifyText("SCADA/HMI software is complex", map);
    expect(result).toContain('href="/en/technology/scada-hmi"');
    expect(result).not.toContain('href="/en/technology/scada"');
  });

  it("firstMatchOnly: plural and singular count as same keyword", () => {
    // "PLC" then "PLCs" — both map to the same canonical key, only first should link
    const result = linkifyText("PLC and PLCs are common", map, { firstMatchOnly: true, maxLinks: 10 });
    const count = (result.match(/<a /g) || []).length;
    expect(count).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Integration: getKeywordMap + linkifyText pipeline
// ---------------------------------------------------------------------------

describe("linkify integration", () => {
  // Inline maps mirroring the shape of real data — no Supabase needed
  const enMap = new Map([
    ["opc ua",            "/en/technology/opc-ua"],
    ["profinet/profibus", "/en/technology/profinet-profibus"],
    ["profinet / profibus","/en/technology/profinet-profibus"],
    ["mes",               "/en/category/mes-specialists"],
    ["scada / hmi",       "/en/category/scada-hmi"],
    ["scada/hmi",         "/en/category/scada-hmi"],
    ["scada",             "/en/category/scada-hmi"],
    ["plc",               "/en/category/plcs"],
    ["food and beverage", "/en/industry/food-and-beverage"],
    ["food & beverage",   "/en/industry/food-and-beverage"],
    ["food&beverage",     "/en/industry/food-and-beverage"],
  ]);

  const deMap = new Map([
    ["sps",    "/de/category/plcs"],
    ["opc ua", "/de/technology/opc-ua"],
  ]);

  it("multiple links: MES, OPC UA, SCADA/HMI all link", () => {
    const result = linkifyText("Modern MES systems use OPC UA and SCADA/HMI interfaces.", enMap);
    expect((result.match(/<a /g) || []).length).toBe(3);
    expect(result).toContain('href="/en/category/mes-specialists"');
    expect(result).toContain('href="/en/technology/opc-ua"');
    expect(result).toContain('href="/en/category/scada-hmi"');
  });

  it("maxLinks cap: stops after 2 even if more would match", () => {
    const result = linkifyText("Modern MES systems use OPC UA and SCADA/HMI.", enMap, { maxLinks: 2 });
    expect((result.match(/<a /g) || []).length).toBe(2);
  });

  it("FAQ maxLinks 1: only first match links", () => {
    const result = linkifyText("MES software integrates with SCADA systems.", enMap, { maxLinks: 1, firstMatchOnly: true });
    expect((result.match(/<a /g) || []).length).toBe(1);
    expect(result).toContain('href="/en/category/mes-specialists"');
  });

  it("URL-based self-exclusion: MES does not link when filtered from map", () => {
    const filtered = new Map([...enMap].filter(([_, url]) => url !== '/en/category/mes-specialists'));
    const result = linkifyText("Our MES specialists work with MES platforms.", filtered);
    expect(result).not.toContain('href="/en/category/mes-specialists"');
  });

  it("URL-based self-exclusion: OPC UA removed, MES still links", () => {
    const filtered = new Map([...enMap].filter(([_, url]) => url !== '/en/technology/opc-ua'));
    const result = linkifyText("OPC UA enables MES connectivity.", filtered);
    expect(result).not.toContain('href="/en/technology/opc-ua"');
    expect(result).toContain('href="/en/category/mes-specialists"');
  });

  it("German page: SPS and OPC UA link with /de/ URLs", () => {
    const result = linkifyText("SPS-Systeme kommunizieren über OPC UA.", deMap);
    expect(result).toContain('href="/de/category/plcs"');
    expect(result).toContain('href="/de/technology/opc-ua"');
  });

  it("plural + compact variant in one sentence", () => {
    const result = linkifyText("Connecting PLCs via PROFINET/PROFIBUS to MES systems.", enMap, { maxLinks: 10 });
    expect(result).toContain('href="/en/category/plcs"');
    expect(result).toContain('href="/en/technology/profinet-profibus"');
    expect(result).toContain('href="/en/category/mes-specialists"');
  });

  it("XSS safety: script tag escaped, MES still links", () => {
    const result = linkifyText("<script>alert('xss')</script> MES systems.", enMap);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
    expect(result).toContain('href="/en/category/mes-specialists"');
  });
});

// ---------------------------------------------------------------------------
// seenKeywords — page-level dedup across multiple linkifyText calls
// ---------------------------------------------------------------------------

describe("seenKeywords", () => {
  const map = new Map([
    ["mes", "/en/category/mes"],
    ["scada", "/en/technology/scada"],
    ["plc", "/en/technology/plc"],
    ["opc ua", "/en/technology/opc-ua"],
    ["mqtt", "/en/technology/mqtt"],
  ]);

  it("cross-call dedup: keyword linked in call 1 is not linked in call 2", () => {
    const seenKeywords = new Set<string>();
    const result1 = linkifyText("MES systems are great.", map, { seenKeywords });
    const result2 = linkifyText("MES integrates with SCADA.", map, { seenKeywords });
    expect(result1).toContain('href="/en/category/mes"');
    expect(result2).not.toContain('href="/en/category/mes"');
    expect(result2).toContain('href="/en/technology/scada"');
  });

  it("plural dedup across calls: 'PLCs' in call 1 prevents 'PLC' in call 2", () => {
    const seenKeywords = new Set<string>();
    const result1 = linkifyText("Modern PLCs are fast.", map, { seenKeywords });
    const result2 = linkifyText("Every PLC runs a program.", map, { seenKeywords });
    expect(result1).toContain('href="/en/technology/plc"');
    expect(result2).not.toContain('href="/en/technology/plc"');
  });

  it("without seenKeywords: same keyword links independently in both calls (backward compat)", () => {
    const result1 = linkifyText("MES systems are great.", map);
    const result2 = linkifyText("MES integrates with SCADA.", map);
    expect(result1).toContain('href="/en/category/mes"');
    expect(result2).toContain('href="/en/category/mes"');
  });

  it("seenKeywords skips don't count against maxLinks", () => {
    // mes and scada are pre-seen; plc, opc ua, mqtt are new — maxLinks: 3 should allow all 3 new ones
    const seenKeywords = new Set<string>(["mes", "scada"]);
    const result = linkifyText("MES SCADA PLC OPC UA MQTT", map, { maxLinks: 3, seenKeywords });
    const linkCount = (result.match(/<a /g) || []).length;
    expect(linkCount).toBe(3);
    expect(result).toContain('href="/en/technology/plc"');
    expect(result).toContain('href="/en/technology/opc-ua"');
    expect(result).toContain('href="/en/technology/mqtt"');
  });

  it("FAQ scenario: seen keyword skipped, new keyword links with maxLinks: 1", () => {
    const seenKeywords = new Set<string>(["mes"]);
    const result = linkifyText("MES is relevant. SCADA also applies.", map, { maxLinks: 1, firstMatchOnly: true, seenKeywords });
    expect(result).not.toContain('href="/en/category/mes"');
    expect(result).toContain('href="/en/technology/scada"');
  });

  it("full page simulation: each canonical key appears as <a> at most once across all calls", () => {
    const pageMap = new Map([
      ["mes",            "/en/category/mes-specialists"],
      ["opc ua",         "/en/technology/opc-ua"],
      ["food & beverage","/en/industry/food-and-beverage"],
      ["food&beverage",  "/en/industry/food-and-beverage"],
    ]);
    const seenKeywords = new Set<string>();

    const paragraphs = [
      "MES systems are essential for modern manufacturing.",
      "OPC UA provides connectivity across automation layers.",
      "Food & Beverage producers benefit from MES implementations.",
      "The combination of MES and OPC UA is powerful.",
      "Food & Beverage is a key vertical for OPC UA adoption.",
    ];
    const faqAnswers = [
      "MES integrates with OPC UA to provide unified visibility.",
      "Food & Beverage companies often implement MES solutions.",
    ];

    const allOutputs = [
      ...paragraphs.map(p => linkifyText(p, pageMap, { maxLinks: 5, firstMatchOnly: true, seenKeywords })),
      ...faqAnswers.map(a => linkifyText(a, pageMap, { maxLinks: 1, firstMatchOnly: true, seenKeywords })),
    ];

    // Each unique href must appear exactly once across all outputs combined
    const combined = allOutputs.join('');
    const hrefMatches = combined.match(/href="[^"]+"/g) || [];
    const hrefCounts = new Map<string, number>();
    for (const href of hrefMatches) {
      hrefCounts.set(href, (hrefCounts.get(href) || 0) + 1);
    }
    for (const [href, count] of hrefCounts.entries()) {
      expect(count, `${href} appeared ${count} times`).toBe(1);
    }
  });
});
