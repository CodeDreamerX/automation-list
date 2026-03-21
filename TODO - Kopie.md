# TODO — Automation-List
> Synced from Todoist · 2026-03-21 11:44
> Edit tasks in Todoist, not here.

## Urgent

### P1 Urgent
- [ ] Submit Nebenerwerb permission letter to HR + manager
  > Blocks all commercial activity — Paddle / outreach / LinkedIn / claiming

## Admin & Legal

### P2 High
- [ ] Review employment contract Nebenerwerb clause with lawyer if needed
  > Only if HR pushes back on permission request
- [ ] Research Swiss sole proprietorship registration (Einzelunternehmen) threshold
  > Needed before first CHF of revenue
- [ ] Set up Paddle account (payment processor)
  > Blocked until Nebenerwerb approval

## Finance

### P3 Medium
- [ ] Build monthly cost tracking spreadsheet for AutomationVector
  > Running costs — Koyeb / Supabase / domains / APIs
- [ ] Confirm Automation Central pricing — CHF 89/month + CHF 790/year
  > Drop monthly only if 80%+ choose annual

## Marketing

### P1 Urgent
- [ ] Backlink sprint 1: Product Hunt (DR90), AlternativeTo (DR80), Clutch.co (DR80), SaaSHub (DR60)
  > > Free listings. Create accounts, submit Automation-List, write descriptions + screenshots. Highest DR first.

### P2 High
- [ ] Plan backlink outreach — Swissmem VDMA ZVEI trade publications
  > Highest priority SEO leverage — rank and tank risk
- [ ] Backlink sprint 2: GoodFirms (DR70), SoftwareSuggest (DR60), Uneed ($30 DR72)
  > GoodFirms + SoftwareSuggest free. Uneed paid — coordinate launch day with LinkedIn post.

### P3 Medium
- [ ] Draft outreach email to listed vendors for reciprocal links
  > Use vendor email from directory data
- [ ] Write first LinkedIn post as AutomationVector — establish presence
  > Blocked until Nebenerwerb approval

### P4 Low
- [ ] Pitch article to Automationspraxis or A&D trade publication
  > Builds backlinks and credibility in DACH market

## Automation-List

### P2 High
- [ ] Write Robotics category page intro
  > 1017 impressions — same situation as system integrators
- [ ] Energy & Utilities page SEO — title tag meta description intro paragraph
  > Analysis done — implementation pending
- [ ] Add vendor filters on all listing pages — filter by country and by industry
  > Applies to all category, industry, and technology pages. Generic reusable filter component. Currently no filtering anywhere — UX dead-end for serious buyers. Improves time-on-page signals for Google.
- [ ] GSC: 404 audit
  > Technical 3.56% of all crawl requests are hitting dead pages — roughly 57 requests wasted. Pull the full list via GSC → Pages → Not Found (404), identify the patterns (old slugs? renamed categories? deleted vendors?) and either fix the pages or set up 301 redirects to the closest live equivalent.
- [ ] Add "Related Categories" block to each category page
  > Show 3-4 related categories at bottom of each listing page (e.g. MES → SCADA/HMI, System Integrators, Industrial IT & IoT). Use vendor overlap to determine relatedness. Highest-impact internal linking fix.
- [ ] Turn category card subtitles into internal links on /categories index
  > Keywords like "PLC, SCADA, MES" are plain text — link them to matching category or technology pages. Turns index into a hub page distributing link equity.
- [ ] Add inline links in category intro paragraphs
  > Terms like "OPC UA", "ERP", "OEE" should link to matching technology, category, or future glossary pages. Combine with intro writing tasks (System Integrators, Robotics).

### P3 Medium
- [ ] Run vendor description rating script — review low-scoring vendors
  > Script already built — just needs running
- [ ] Run enrichment pipeline descriptions_only mode — next batch
  > 73% success rate on last run
- [ ] Write MES Software Selection Guide pillar page (EN + DE)
  > Tier 1 pillar — strongest credibility angle
- [ ] Write System Integrators Evaluation Guide pillar page (EN + DE)
  > Tier 1 pillar
- [ ] Research glossary/wiki architecture — 20-30 core terms EN+DE
  > MES / SCADA / OEE / PLC / DCS — rankable /glossary/[slug] pages, internal linking engine
- [ ] Vendor Sorting Logic
  > Vendors are currently only sorted from A-Z, new sorting logic should be based on Profile score.
- [ ] Add "Top Countries for [Category]" section on category pages
  > Contextual country links per category (e.g. "Find MES Specialists in Switzerland / Germany"). Matches search intent, bridges category↔country silo. More valuable once country filter ships.

### P4 Low
- [ ] Build integration pages — SAP OPC-UA etc (pSEO scalable)
  > High LLM citation potential
- [ ] Set up GSC API daily pull to Supabase FAQ candidates pipeline
  > 300 req/day = 15% of quota — plenty of headroom
- [ ] Build internal anchor map for Automation-List
  > Crawl-based — needed before serious link building
- [ ] Ratings/reviews feature — Phase 1 project references data model
  > Deferred 6-9 months — add as backlog only

## Automation Central

### P3 Medium
- [ ] Define Automation Central MVP scope — which engine ships first
  > Stack Checker as free lead magnet confirmed
- [ ] Set up Automation Central repo and base architecture
  > Blocked until Nebenerwerb approval

## Audits

### P4 Low
- [ ] Define AutomationVector Audits service packages and pricing
  > Post-Emmi only — Red Flag and Comprehensive Review tiers
- [ ] Draft Audits landing page copy
  > Post-Emmi only

## Personal

### P1 Urgent
- [ ] Sell Mountainbike
  > Prepare and sell my unused Mountainbike

### P2 High
- [ ] Setup Wifes Laptop
  > Laptop is setup but i need to introduce it to her

### P3 Medium
- [ ] Finalize monthly cost model Switzerland + Portugal dual living
  > Two-person household — double cost problem during PT phases
- [ ] Roots & Future — donor update and impact report
  > Mentioned as Cowork use case — check what's outstanding
- [ ] Yearly Office cleanup
  > Archive and clean up my Office mess

### P4 Low
- [ ] Research Portugal Algarve property market — EUR 600K target range
  > From 2030 onward — early research phase

---
_Auto-generated. Run `npm run todos` to refresh._