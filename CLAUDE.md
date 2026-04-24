# CLAUDE.md — automationlist

This file briefs AI assistants at the start of every session. Read it fully before making changes.

---

## Tech Stack & Versions

| Package | Version |
|---------|---------|
| `astro` | ^5.16.6 |
| `@astrojs/node` | ^9.5.1 (standalone SSR adapter) |
| `@supabase/supabase-js` | ^2.84.0 |
| `@supabase/ssr` | ^0.8.0 |
| `tailwindcss` | 4.1.10 (v4 — no config file) |
| `@tailwindcss/vite` | 4.1.10 |
| `@tailwindcss/typography` | 0.5.19 |
| `@lucide/astro` | ^0.575.0 |
| `sharp` | ^0.34.5 |
| `@sentry/astro` | ^10.30.0 |
| `vitest` | ^4.1.0 |
| Node.js target | 20 (Alpine, Docker) |

**Key constraints:**
- **Tailwind v4**: no `tailwind.config.js`. All config is via the `@tailwindcss/vite` plugin. Brand color utilities (`brand-50` through `brand-900`, `container-px`) are defined in CSS/Tailwind layer — do not try to configure them in a JS config file.
- **Astro SSR**: `output: 'server'` globally. All pages are SSR (`prerender = false`) unless explicitly noted. Do not add `export const prerender = true` without confirming it works with the adapter.
- **TypeScript throughout**: no `.jsx`/`.tsx`. Use Astro component syntax (`.astro`) for UI, `.ts` for logic.

---

## Project Structure

```
src/
├── components/
│   ├── admin/          # Admin-only form components
│   └── (public)        # Public-facing UI components
├── data/
│   ├── keyword-map.json
│   └── slug-reference.json
├── icons/categories/   # SVG icons for category taxonomy
├── layouts/
│   └── BaseLayout.astro
├── lib/
│   ├── admin/          # Admin utilities (auth, country resolve, JSON import)
│   ├── api/            # Shared API response helpers
│   ├── network/        # resilientFetch (8s timeout, 1 retry)
│   └── vendors/        # Vendor-specific utilities
├── pages/
│   ├── api/            # All API endpoints (admin + public)
│   ├── admin/          # Admin UI pages
│   ├── en/             # English public pages
│   ├── de/             # German public pages
│   └── (root)          # index, robots.txt, sitemap.xml, submit-listing
├── scripts/            # Client-side TS (submit listing flow)
├── styles/globals.css
├── types/              # All TypeScript types (re-exported from index.ts)
└── utils/seo.ts
```

---

## Database Schema & Naming Conventions

### Supabase Clients — Three Distinct Clients

| File | Key | Purpose |
|------|-----|---------|
| `src/lib/supabaseClient.ts` | `SUPABASE_ANON_KEY` | Public reads; uses `resilientFetch` |
| `src/lib/supabaseAdminClient.ts` | `SUPABASE_SERVICE_ROLE_KEY` | Admin writes; bypasses RLS; `autoRefreshToken: false, persistSession: false` |
| `src/lib/supabaseServer.ts` | `SUPABASE_ANON_KEY` via `@supabase/ssr` | Cookie-based auth for middleware + admin page protection |

**Rule:** Never use the admin client on public-facing pages. Never use the anon client for write operations.

### Tables

| Table | Key Columns |
|-------|------------|
| `vendors` | `id` (UUID), `name`, `slug`, `country` (TEXT, required), `description_en`, `description_de`, `website`, `email`, `phone`, `address`, `city`, `region`, `year_founded` (INT), `employee_count` (TEXT — supports ranges like "50–100"), `hourly_rate` (TEXT), `languages` (TEXT, comma-separated), `plan` (`'free'|'pro'|'featured'|'deactivated'`), `priority` (INT, default 5), `profile_score` (INT 0–100), `featured` (BOOL), `featured_until` (TIMESTAMP), `og_member` (BOOL), `logo_url`, `logo_width`, `logo_height`, `logo_format`, `logo_alt`, `logo_background_variant` (`'light'|'neutral'|'dark'|'brand'`), `meta_title`, `meta_title_de`, `meta_description`, `meta_description_de`, `canonical_url`, `taking_new_projects` (BOOL), `linkedin_url` (TEXT), `specialization_text` (TEXT), `countries_served` (TEXT), `created_at`, `updated_at` |
| `categories` | `id`, `slug`, `name_en`, `name_de`, `headline_en/de`, `description_en/de`, `card_description_en/de`, `icon_name`, `order_index`, `is_active`, `meta_title_en/de`, `meta_description_en/de`, `faq_en/de` (JSON) |
| `technologies` | same bilingual + SEO pattern as categories |
| `industries` | same bilingual + SEO pattern as categories |
| `countries` | `id`, `slug`, `name_en`, `name_de`, `flag_emoji`, `is_active`, `headline_en/de`, `description_en/de`, `meta_title/meta_description en/de`, `faq_en/de` |
| `certifications` | `id`, `slug`, `name`, `reference_url`, `category`, `is_active` |
| `vendor_categories` | `vendor_id`, `category_id`, `is_primary` |
| `vendor_technologies` | `vendor_id`, `technology_id` |
| `vendor_industries` | `vendor_id`, `industry_id` |
| `vendor_certifications` | `vendor_id`, `certification_id` |
| `vendor_countries` | `vendor_id`, `country_id` |
| `pending_listings` | Public form submissions; `status`: `'pending'|'rejected'` |
| `user_roles` | `user_id`, `role` — admin check requires `role === 'admin'` |

**Materialized views** (refreshed via `rpc('refresh_vendor_counts')`):
- `category_vendor_counts` — `category_id`, `vendor_count`
- `industry_vendor_counts` — `industry_id`, `vendor_count`
- `country_vendor_counts` — `country`, `vendor_count`

**Storage bucket:** `vendor-logos` — logos stored at path `optimized/{filename}__{variant}.{ext}`

### Critical Column Notes
- `employee_count` is **TEXT**, not a number. Supports ranges like "50–100". Never cast to `Number`.
- `country` on `vendors` is a plain TEXT field (English country name), NOT a foreign key.
- `vendor_countries` (junction table) handles structured M2M country associations separately from the `country` field.
- `languages` on `vendors` is a comma-separated TEXT field (legacy), not a junction table.

---

## M2M Relationship Pattern

All five junction tables follow the same pattern. **Never deviate from this.**

### Save pattern — delete-all-then-reinsert

```ts
await supabaseAdmin.from('vendor_categories').delete().eq('vendor_id', id);
for (const slug of categorySlugs) {
  const { data: cat } = await supabaseAdmin.from('categories').select('id').eq('slug', slug).single();
  if (cat?.id) await supabaseAdmin.from('vendor_categories').insert({ vendor_id: id, category_id: cat.id });
}
// Repeat for vendor_technologies, vendor_industries, vendor_certifications, vendor_countries
```

### Two save paths — both must stay in sync

Every vendor field must be handled in **both** places:
1. **Direct form POST** — `src/pages/admin/new.astro` + `src/pages/admin/edit/[id].astro`
2. **API endpoints** — `src/pages/api/admin/create-vendor.ts` + `src/pages/api/admin/update-vendor.ts`

The code has explicit `// NOTE: Field list must stay in sync` comments marking these locations. When adding a new vendor field, update all four files.

### Form field names for M2M (repeated checkboxes)

```html
<input type="checkbox" name="category_slugs" value="{slug}" />
<input type="checkbox" name="technology_slugs" value="{slug}" />
<input type="checkbox" name="industry_slugs" value="{slug}" />
<input type="checkbox" name="certification_slugs" value="{slug}" />
<input type="checkbox" name="country_slugs" value="{slug}" />
```

Extracted server-side with `form.getAll("category_slugs").map(s => String(s).trim()).filter(Boolean)`.

### Full vendor join query (used in edit page)

```ts
supabaseAdmin.from('vendors').select(`
  *,
  vendor_categories(categories:categories(id, slug, name_en, name_de)),
  vendor_technologies(technologies:technologies(id, slug, name_en, name_de)),
  vendor_industries(industries:industries(id, slug, name_en, name_de)),
  vendor_certifications(certifications:certifications(id, slug, name, reference_url, category)),
  vendor_countries(countries:countries(id, slug, name_en, name_de, flag_emoji))
`).eq('id', id).maybeSingle()
```

### `normalizeVendor()` in `src/lib/vendors/vendorUtils.ts`

Extracts slug arrays from the M2M join objects into flat `category_slugs[]`, `technology_slugs[]`, etc. Always call this before using a vendor's relation slugs.

---

## Bilingual EN/DE Patterns

All public pages exist under both `/en/` and `/de/`. Routing is mirrored exactly.

### Language detection
- Root `/` → 301 redirect to `/{lang}/` based on `Accept-Language` (middleware)
- Only redirects to `/de/` if German is the highest-quality preference; defaults to `/en/`

### Bilingual DB fields
Taxonomy tables (`categories`, `technologies`, `industries`, `countries`) have `name_en`/`name_de`, `description_en`/`description_de`, `headline_en`/`headline_de`, `meta_title_en`/`meta_title_de`, `meta_description_en`/`meta_description_de`, `faq_en`/`faq_de`.

Vendors have `description_en`/`description_de`, `meta_title`/`meta_title_de`, `meta_description`/`meta_description_de`.

### hreflang
`BaseLayout.astro` auto-generates `<link rel="alternate" hreflang="...">` by swapping `/en/` ↔ `/de/` in the current path.

### Language resolution pattern (pages)
```ts
const lang = Astro.params.lang ?? 'en';  // or from URL prefix
const name = lang === 'de' ? record.name_de || record.name_en : record.name_en;
```

---

## Slug Conventions

| Entity | Format | How Set |
|--------|--------|---------|
| Vendors | `kebab-case` | Manually in admin; auto-generated from name in form JS |
| Categories | `kebab-case` | Manually |
| Technologies | `kebab-case` | `normalizeTech(str)` from `src/lib/normalizeTech.ts` |
| Industries | `kebab-case` | Manually |
| Countries | Slugified country name | `slugifyCountry(name)` from `src/lib/countryUtils.ts` — `"United States" → "united-states"` |
| Certifications | `kebab-case` | Manually |

**Country URL params** use slugified names (hyphens). Resolved back to country name via `parseCountryParam()` (decodes URI, replaces hyphens with spaces, then normalizes).

**Logo filename format:** `{sanitized-name}__{variant}.{ext}` — variant is one of `white/light/gray/dark/brand`; format is `.webp` for raster, original extension for SVG.

---

## Pro Gating / Paywall Pattern

Applies on vendor detail pages (`src/pages/en/vendor/[slug].astro`, `src/pages/de/vendor/[slug].astro`).

- `plan`: `'free' | 'pro' | 'featured' | 'deactivated'`
- `isFeatured(v)` (`src/lib/isFeatured.ts`): true if `plan === 'featured'` OR (`featured === true` AND `featured_until > now()`)
- Free users see field labels but values show `🔒 Pro only` / `🔒 Nur Pro`
- First item of technologies/industries is always shown; subsequent locked for free plan
- First 2 categories always shown; additional locked for free
- `specialization_text` is **never** locked — always visible to all
- Single upgrade CTA card at bottom (`isFree` condition) — **no inline upgrade links anywhere**
- `DISABLE_PRO_PAYWALL=true` env var disables all gating (dev/testing)

---

## Admin Auth Pattern

Middleware (`src/middleware.ts`) handles all `/admin/*` routes:
1. Creates SSR Supabase client with request cookies
2. Calls `supabase.auth.getUser()`
3. Queries `user_roles` for `role === 'admin'`
4. Sets `Astro.locals.isAdmin`
5. Returns 302 (page routes) or 401 JSON (API routes) if not admin

Pages additionally call `protectAdminRoute(Astro.locals)` as a secondary check. API routes call `protectAdminApiRoute(cookies)`.

---

## API Endpoints Reference

### Public
- `GET /api/health` — DB connectivity check
- `POST /api/submit-listing` — public form → `pending_listings`; rate-limited 5/hour per IP

### Admin Auth
- `POST /api/admin/login` — sign in; rate-limited 5/15 min per IP
- `POST /api/admin/logout`

### Admin Vendor CRUD
- `POST /api/admin/create-vendor` — creates vendor + all M2M (accepts FormData or JSON)
- `POST /api/admin/update-vendor` — updates vendor + M2M
- `POST /api/admin/delete-vendor` — deletes vendor + logo from storage
- `POST /api/admin/upload-logo` — Sharp processing (max 300px, webp@80%), stores to `vendor-logos`
- `POST /api/admin/delete-logo`
- `POST /api/admin/refresh-counts` — refreshes materialized views via `rpc('refresh_vendor_counts')`
- `POST /api/admin/export-slugs`, `export-template`, `export-vendor-urls`

### Admin Listings
- `POST /api/admin/approve-listing` — creates vendor from pending + handles M2M, deletes pending
- `POST /api/admin/reject-listing`, `bulk-reject-listings`, `bulk-delete-listings`, `delete-listing`

### Admin Taxonomy CRUD (categories, technologies, industries, countries)
- Pattern: `POST /api/admin/create-{entity}`, `update-{entity}`, `delete-{entity}`

### API Response Helpers (`src/lib/api/responses.ts`)
Always use these for consistency:
```ts
successResponse(data?, status=200)   // { success: true, data? }
errorResponse(message, status=400)   // { error: message }
unauthorizedResponse(message?)       // 401
```

---

## Key Utility Functions

| File | Function | Purpose |
|------|----------|---------|
| `src/lib/vendors/vendorUtils.ts` | `normalizeVendor(v)` | Extracts M2M slugs into flat arrays |
| `src/lib/vendors/completenessScore.ts` | `calculateCompletenessScore(v)` | 0–100 profile completeness |
| `src/lib/vendors/vendorFormatters.ts` | `formatTechnologies`, `truncateDescription` | Display formatting |
| `src/lib/isFeatured.ts` | `isFeatured(v)` | Featured plan check (plan OR featured+date) |
| `src/lib/countryUtils.ts` | `slugifyCountry`, `parseCountryParam`, `getCountryNameMap` | Country slug/name handling |
| `src/lib/metaDescription.ts` | `resolveMetaDescription(vendor, lang)` | Cascades meta → description |
| `src/lib/linkify.ts` | `linkifyText(text, keywordMap, opts)` | Keyword → anchor links in text |
| `src/lib/cache.ts` | `getCached`, `setCached` | In-memory TTL cache (300s vendor lists, 3600s country maps) |
| `src/lib/rateLimit.ts` | `checkRateLimit`, `getClientIP` | In-memory rate limiter (resets on restart) |
| `src/lib/env.ts` | `getRequiredEnvVar`, `getBooleanEnvVar` | Env var access (`process.env` first, then `import.meta.env`) |
| `src/utils/seo.ts` | `buildVendorTitle(name, cat, country, manual)` | SEO title with 60-char cap + ` \| Automation List` suffix |
| `src/lib/admin/authUtils.ts` | `protectAdminRoute`, `protectAdminApiRoute` | Admin route guards |

---

## Component Map

### Admin Form Components (`src/components/admin/`)

| Component | Renders |
|-----------|---------|
| `VendorForm.astro` | Full vendor form — wraps all section components |
| `BasicInfoSection.astro` | name, slug, description_en/de |
| `ContactSection.astro` | website, email, phone, address, city, region, country |
| `CategorizationSection.astro` | Collapsible checkbox groups: categories / technologies / industries / certifications / countries / languages; grouped certifications by `cert.category`; badge counts; search filter |
| `CompanyInfoSection.astro` | year_founded, employee_count, hourly_rate, taking_new_projects, linkedin_url, specialization_text |
| `PlanSection.astro` | plan, priority, featured, featured_until, og_member |
| `LogoUploadSection.astro` | File upload + preview + background variant picker |
| `SEOSection.astro` | meta_title, meta_title_de, meta_description, meta_description_de, canonical_url |
| `CategoryForm.astro` | Category CRUD (all bilingual fields + FAQ JSON editor) |
| `FormInput/FormSection/FormSelect/FormTextarea.astro` | Reusable form field wrappers |

### Client-Side Scripts (`src/components/admin/`)
- `vendor-form.ts` — `initVendorForm()`: logo upload AJAX, slug auto-generation, form feedback
- `admin-delete.ts` — delete confirmation dialogs
- `title-length-feedback.ts` — meta title char count feedback

### Public Components (key ones)
- `LogoBox.astro` — logo with background variant support + initials fallback
- `VendorCard.astro` — vendor card in listing grids
- `VendorFilter.astro` — filter sidebar
- `Pagination.astro` — pagination links
- `Breadcrumb.astro` — breadcrumb nav (`items[]`, `lang`)
- `CollapsibleIntro.astro` — collapsible text (category/tech descriptions)
- `CookieBanner.astro` — GDPR consent (controls GA loading via `localStorage.cookie_consent`)

---

## Deployment

**Platform:** Koyeb (primary)
- Config: `koyeb.yaml`
- Build: `Dockerfile` (multi-stage, Node 20 Alpine, non-root user `astro`)
- Port: 4321
- Start command: `node ./dist/server/entry.mjs`
- Healthcheck: `GET /` every 30s

**Local dev:** `docker-compose.dev.yml` or `npm run dev`

**Build:** `npm run build` → `npm run start`

### Environment Variables

| Variable | Required | Notes |
|----------|----------|-------|
| `SUPABASE_URL` | YES | `https://*.supabase.co` |
| `SUPABASE_ANON_KEY` | YES | Public key |
| `SUPABASE_SERVICE_ROLE_KEY` | YES | Server-only, never expose to client |
| `DISABLE_PRO_PAYWALL` | No | `true/1/yes/on` unlocks all Pro fields |
| `SENTRY_DSN` | No | Server-side error tracking |
| `NODE_ENV` | No | `development` / `production` |
| `PORT` | No | Default 4321 |
| `HOST` | No | Default `0.0.0.0` |

Env loaded via `src/lib/env.ts`: checks `process.env` first (Docker/runtime), then `import.meta.env` (build-time/local).

---

## Analytics

Google Analytics `G-ERFBQMBSJP` is hardcoded in `BaseLayout.astro`. GA loads **client-side only** after `localStorage.getItem('cookie_consent') === 'accepted'`. Zero SSR GA execution. Do not move this to SSR.

---

## AI Content Publishing Workflow

AI-generated content is always staged and never auto-published.

- Generated content (including descriptions, meta titles, and translations) must write to draft columns only.
- A human approval step is required before any AI-generated content can go live.
- Do not implement direct AI-to-live publish paths in admin UI, API routes, scripts, or background jobs.

---

## Rules — Never Change These

1. **`employee_count` is TEXT.** Never cast to `Number`. Supports ranges like "50–100".

2. **Two save paths must stay in sync.** When adding a vendor field: update `new.astro`, `edit/[id].astro`, `create-vendor.ts`, and `update-vendor.ts`. All four.

3. **M2M pattern is delete-all-then-reinsert.** Do not try to diff and patch — the delete-all pattern is intentional for simplicity and correctness.

4. **Admin client never on public pages.** The service role key bypasses RLS. Only use `supabaseAdmin` in `src/pages/api/admin/*` and admin pages.

5. **Pro gating: no inline upgrade links.** Only one upgrade CTA card per vendor detail page (`isFree` condition at bottom). Never add inline upgrade prompts.

6. **`specialization_text` is never Pro-gated.** Always show to all users.

7. **Tailwind v4 — no config file.** Do not create `tailwind.config.js/ts`. All Tailwind customization goes through the Vite plugin and CSS.

8. **All pages are SSR.** Do not add `export const prerender = true` to pages without testing with the Node adapter.

9. **`SUPABASE_SERVICE_ROLE_KEY` is server-only.** Never reference it in client-side code or Astro component script blocks that run on the client.

10. **Rate limiters are in-memory only.** They reset on server restart. This is a known limitation — do not assume they persist across deployments.

11. **JSON import excluded fields.** `specialization_text`, all `logo_*`, all `meta_*` fields are intentionally excluded from the JSON import utility (`src/lib/admin/jsonUtils.ts`). Do not add them without understanding the import flow.

12. **Country `slug` vs `country` field.** `vendors.country` is a plain TEXT English name (legacy). `vendor_countries` is the structured M2M. Both may coexist. Do not conflate them.

---

## Vendor JSON Import Format

The **DB is the source of truth** for all valid slugs. The admin endpoint `GET /api/admin/export-slugs` (auth-protected) queries all taxonomy tables live and downloads a `slug-reference.json` file. Import-ready JSON files live in `/scripts/import/`.

There is no static `src/data/slug-reference.json` file — it was removed because it went stale. Always download the current slug list from the admin UI.

### Rules
- **Never invent slugs.** Download current slugs from `/api/admin/export-slugs` and resolve against that.
- **`country` field** = full English name (`"Germany"`, not `"DE"` or `"Deutschland"`).
- **`languages` field** = comma-separated full names (`"English, German"`, not `"en, de"`). Valid values come from `VENDOR_LANGUAGE_OPTIONS` in `src/lib/admin/languageOptions.ts`.
- **Required fields** for import: `name`, `slug`, `country`, `category_slugs` (array).
- **Excluded from JSON import** (intentional — handled separately): `specialization_text`, all `logo_*` fields, all `meta_*` fields.
- The JSON import utility lives in `src/lib/admin/jsonUtils.ts` and has an explicit `allowedFields` allowlist. Do not add excluded fields without understanding the full import flow.

### Import workflow
1. Download current slugs from `/admin/vendors/json/` → "slug-reference.json" link (served live from DB)
2. Prepare JSON in `/scripts/import/`
3. Use admin UI at `/admin/vendors/json/` (upload → preview → import → results)
4. For bulk updates: `/admin/vendors/json-update/`

---

## Out of Scope — Do Not Build

These features are explicitly excluded from this project. Do not add them, suggest them, or scaffold them:

- **No public user accounts.** Auth is admin-only. There is no user registration, login, or session for public visitors.
- **No vendor self-edit portal.** Vendors cannot manage their own listings. All edits go through admin.
- **No real-time features.** No WebSockets, no Supabase Realtime subscriptions, no live updates.
- **No client-side data fetching on public pages.** All data for public pages is fetched SSR in the Astro frontmatter. Do not add `fetch()` calls or Supabase queries inside `<script>` tags on public pages.
- **No payment/billing integration.** Plan upgrades (`free` → `pro`) are handled manually by admin — there is no Stripe or payment flow.
