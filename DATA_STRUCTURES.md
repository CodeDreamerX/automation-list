# Data Structures Documentation

This document describes all the data structures used in the automationlist application.

## Vendor

The main entity representing a vendor/company in the directory.

### Database Schema (vendors table)

**Actual Supabase Schema:**

```sql
create table public.vendors (
  id uuid not null default gen_random_uuid (),
  name text not null,
  slug text not null,
  country text not null,
  region text null,
  address text null,
  website text null,
  email text null,
  phone text null,
  languages text null,
  certifications text null,
  tags text null,
  description text null,
  logo_url text null,
  created_at timestamp with time zone not null default now(),
  city text null,
  year_founded integer null,
  employee_count integer null,
  hourly_rate text null,
  plan text null default 'free'::text,
  featured boolean null default false,
  priority integer null default 5,
  featured_until timestamp with time zone null,
  og_member boolean null default false,
  meta_title text null,
  meta_description text null,
  canonical_url text null,
  updated_at timestamp with time zone null default now(),
  logo_alt text null,
  logo_width integer null,
  logo_height integer null,
  logo_format text null,
  description_en text null,
  description_de text null,
  constraint vendors_pkey primary key (id),
  constraint vendors_slug_key unique (slug)
);

-- Indexes
create index IF not exists vendors_country_idx on public.vendors using btree (country);
create index IF not exists vendors_slug_idx on public.vendors using btree (slug);
create index IF not exists vendors_tags_idx on public.vendors using btree (tags);
```

**TypeScript Interface:**

> **Note:** The TypeScript types are now centralized in `src/types/vendor.ts`. Import types using:
> ```typescript
> import type { Vendor, VendorWithRelations, VendorFormData } from '../types/vendor';
> // or
> import type { Vendor, VendorWithRelations, VendorFormData } from '../types';
> ```
> 
> This ensures a single source of truth for vendor type definitions across the codebase.

```typescript
interface Vendor {
  // Primary identifiers
  id: string;                    // UUID, auto-generated (gen_random_uuid())
  name: string;                  // NOT NULL - Required
  slug: string;                  // NOT NULL - Required, unique, URL-friendly identifier
  
  // Descriptions (bilingual)
  description?: string | null;   // Legacy field (deprecated, use description_en/de)
  description_en?: string | null; // English description
  description_de?: string | null; // German description
  
  // Contact information
  website?: string | null;       // URL (auto-prefixed with https://)
  email?: string | null;
  phone?: string | null;
  
  // Location
  address?: string | null;
  city?: string | null;
  region?: string | null;
  country: string;               // NOT NULL - Required
  
  // Company details
  year_founded?: number | null;  // integer
  employee_count?: number | null; // integer (not text!)
  hourly_rate?: string | null;   // text (e.g., "€50-100")
  
  // Categorization (stored as comma-separated strings)
  languages?: string | null;     // Comma-separated, e.g., "English, German, French"
  certifications?: string | null; // Comma-separated
  tags?: string | null;          // Comma-separated (indexed)
  
  // Plan & featuring
  plan?: 'free' | 'pro' | 'featured' | 'deactivated' | null; // Default: 'free'
  priority?: number | null;      // integer, default: 5, higher = more prominent
  featured?: boolean | null;     // boolean, default: false
  featured_until?: string | null; // timestamp with time zone (ISO date string)
  og_member?: boolean | null;    // boolean, default: false - Original/Founding member flag
  
  // Logo information
  logo_url?: string | null;       // URL to logo image
  logo_width?: number | null;    // integer - Logo width in pixels
  logo_height?: number | null;   // integer - Logo height in pixels
  logo_format?: string | null;   // text - Image format (png, jpg, webp, svg)
  logo_alt?: string | null;       // Alt text for logo
  
  // SEO metadata
  meta_title?: string | null;
  meta_description?: string | null;
  canonical_url?: string | null;
  
  // Timestamps
  created_at: string;            // timestamp with time zone, NOT NULL, default: now()
  updated_at?: string | null;    // timestamp with time zone, default: now()
}
```

**Database Constraints:**
- Primary Key: `id` (UUID)
- Unique Constraint: `slug` (must be unique)
- Indexes: `country`, `slug`, `tags` (for query performance)

### Relationships (via join tables)

Vendors are related to categories, technologies, and industries through join tables:

> **Type Definition:** `VendorWithRelations` is defined in `src/types/vendor.ts`

```typescript
interface VendorWithRelations extends Vendor {
  // Categories (many-to-many via vendor_categories)
  vendor_categories?: Array<{
    is_primary?: boolean | null;
    categories?: {
      id: string;
      slug: string;
      name_en?: string | null;
      name_de?: string | null;
    } | null;
  }> | null;
  
  // Technologies (many-to-many via vendor_technologies)
  vendor_technologies?: Array<{
    technologies?: {
      id: string;
      slug: string;
      name_en?: string | null;
      name_de?: string | null;
    } | null;
  }> | null;
  
  // Industries (many-to-many via vendor_industries)
  vendor_industries?: Array<{
    industries?: {
      id: string;
      slug: string;
      name_en?: string | null;
      name_de?: string | null;
    } | null;
  }> | null;
  
  // Normalized arrays (computed from relationships)
  category_slugs?: string[];     // Array of category slugs
  technology_slugs?: string[];   // Array of technology slugs
  industry_slugs?: string[];     // Array of industry slugs
}
```

### Join Tables

```typescript
// vendor_categories (many-to-many)
interface VendorCategory {
  vendor_id: string;             // FK to vendors.id
  category_id: string;          // FK to categories.id
  is_primary?: boolean | null;  // Whether this is the primary category
}

// vendor_technologies (many-to-many)
interface VendorTechnology {
  vendor_id: string;            // FK to vendors.id
  technology_id: string;        // FK to technologies.id
}

// vendor_industries (many-to-many)
interface VendorIndustry {
  vendor_id: string;            // FK to vendors.id
  industry_id: string;         // FK to industries.id
}
```

---

## Category

Categories represent different types of automation products/services.

### Database Schema (categories table)

> **Note:** The TypeScript types are now centralized in `src/types/category.ts`. Import types using:
> ```typescript
> import type { Category, CategoryDisplay, CategoryBasic, CategoryFormData } from '../types/category';
> // or
> import type { Category, CategoryDisplay, CategoryBasic, CategoryFormData } from '../types';
> ```
> 
> This ensures a single source of truth for category type definitions across the codebase.

```typescript
interface Category {
  id: string;                   // UUID
  slug: string;                 // URL-friendly identifier
  name_en?: string | null;     // English name
  name_de?: string | null;     // German name
  description_en?: string | null; // English description
  description_de?: string | null; // German description
  icon_name?: string | null;   // Icon identifier (e.g., "plcs", "scada-hmi")
  order_index?: number | null; // Display order
  is_active?: boolean;         // Whether category is active
}
```

### Usage in Components

> **Type Definition:** `CategoryDisplay` and `CategoryBasic` are defined in `src/types/category.ts`

```typescript
interface CategoryDisplay {
  id: string;
  slug: string;
  name_en: string;
  name_de: string;
  description_en?: string;
  description_de?: string;
  icon_name?: string;
  count?: number;              // Vendor count (from materialized view)
}
```

---

## Technology

Technologies represent specific technologies or tools used by vendors.

### Database Schema (technologies table)

> **Note:** The TypeScript types are now centralized in `src/types/technology.ts`. Import types using:
> ```typescript
> import type { Technology, TechnologyDisplay, TechnologyBasic, TechnologyFormData } from '../types/technology';
> // or
> import type { Technology, TechnologyDisplay, TechnologyBasic, TechnologyFormData } from '../types';
> ```
> 
> This ensures a single source of truth for technology type definitions across the codebase.

```typescript
interface Technology {
  id: string;                   // UUID
  slug: string;                 // URL-friendly identifier
  name_en?: string | null;     // English name
  name_de?: string | null;     // German name
  description_en?: string | null; // English description
  description_de?: string | null; // German description
  icon_name?: string | null;   // Icon identifier
  order_index?: number | null; // Display order
  is_active?: boolean;         // Whether technology is active
}
```

---

## Industry

Industries represent industry sectors that vendors serve.

### Database Schema (industries table)

```typescript
interface IndustryDB {
  id: string;                   // UUID
  slug: string;                 // URL-friendly identifier
  name_en?: string | null;     // English name
  name_de?: string | null;     // German name
  description_en?: string | null; // English description
  description_de?: string | null; // German description
  order_index?: number | null; // Display order
  is_active?: boolean;         // Whether industry is active
}
```

### Resolved Interface (for display)

```typescript
interface Industry {
  id: string;
  slug: string;
  name: string;                // Resolved by lang with fallback to name_en
  description?: string;        // Optional, resolved by lang
}
```

---

## Form Data Structures

### VendorForm Props

```typescript
interface VendorFormProps {
  vendor: Vendor | null;        // Vendor data (null for new vendor)
  categories?: Array<{
    id: string;
    slug: string;
    name_en: string;
    name_de: string;
  }>;
  technologies?: Array<{
    id: string;
    slug: string;
    name_en: string;
    name_de: string;
  }>;
  industries?: Array<{
    id: string;
    slug: string;
    name_en: string;
    name_de: string;
  }>;
}
```

### CSV Import Structure

**Note**: CSV imports may include fields that don't exist in the database schema. These are processed and converted to the proper structure.

```typescript
interface CSVVendorRow {
  // Required fields
  name: string;
  slug: string;
  country: string;
  category_slugs: string;        // Semicolon-separated slugs (e.g., "plcs;scada-hmi")
  
  // Optional fields
  region?: string;
  city?: string;
  address?: string;
  website?: string;
  email?: string;
  phone?: string;
  description?: string;        // Legacy field (not stored, use description_en/de)
  description_en?: string;     // English description
  description_de?: string;      // German description
  technologies?: string;        // Legacy comma-separated (NOT stored in DB, ignored)
  technology_slugs?: string;   // Semicolon-separated slugs (stored via vendor_technologies)
  languages?: string;          // Comma-separated (e.g., "English, German, French")
  certifications?: string;     // Comma-separated
  tags?: string;              // Comma-separated
  industries?: string;        // Legacy comma-separated (NOT stored in DB, use industry_slugs)
  industry_slugs?: string;    // Semicolon-separated slugs (stored via vendor_industries)
  year_founded?: number;       // integer
  employee_count?: number;     // integer (NOT text - converted from CSV string)
  hourly_rate?: string;       // text (e.g., "€50-100")
  plan?: 'free' | 'pro' | 'featured' | 'deactivated';
  featured?: boolean;         // Converted from "true"/"false" strings
  priority?: number;          // integer, 1-5
  og_member?: boolean;        // Converted from "true"/"false" strings
  
  // Internal processing fields (added during CSV parsing)
  _categorySlugs?: string[];   // Processed array from category_slugs
  _technologySlugs?: string[]; // Processed array from technology_slugs
  _industrySlugs?: string[];  // Processed array from industry_slugs
}
```

**CSV Processing Notes**:
- `category_slugs` and `technology_slugs` are semicolon-separated in CSV (e.g., "plcs;scada-hmi")
- `languages`, `certifications`, `tags` are comma-separated
- `employee_count` is converted from string to integer during import
- `technologies` and `industries` (comma-separated) are legacy fields and are NOT stored in the database
- Use `technology_slugs` and `industry_slugs` (semicolon-separated) instead

---

## API Request/Response Structures

### Create Vendor Request

```typescript
// FormData or JSON
interface CreateVendorRequest {
  // All vendor fields (see Vendor schema above)
  category_slugs?: string[];   // Array of category slugs
  technology_slugs?: string[]; // Array of technology slugs
  industry_slugs?: string[];  // Array of industry slugs
}
```

### Update Vendor Request

```typescript
interface UpdateVendorRequest {
  id: string;                  // Required for updates
  // All vendor fields (see Vendor schema above)
  category_slugs?: string[];   // Array of category slugs
  technology_slugs?: string[]; // Array of technology slugs
  industry_slugs?: string[];  // Array of industry slugs
}
```

### API Response

```typescript
interface VendorApiResponse {
  success: boolean;
  data?: Vendor;
  error?: string;
}
```

---

## Component Props

### VendorCard Props

```typescript
interface VendorCardProps {
  vendor: Vendor;
  hrefPrefix?: string;          // Default: "/en/vendor"
  showFeaturedBadge?: boolean;  // Default: true
  compact?: boolean;           // Default: false
  lang?: "en" | "de";         // Default: "en"
}
```

### FeaturedVendors Props

```typescript
interface FeaturedVendorsProps {
  title?: string;              // Default: "Featured Vendors"
  vendors: Vendor[];
  viewAllHref: string;
  viewAllText?: string;        // Default: "View All Vendors →"
  vendorHrefPrefix: string;
  vendorLinkText?: string;     // Default: "View Profile →"
  formatTechnologies?: (tech: string | null) => string;
  truncateDescription?: (text: string | null | undefined, maxLength?: number) => string;
  isFeatured?: (vendor: Vendor) => boolean;
}
```

---

## Query Structures

### Supabase Query Pattern

When fetching vendors with relationships:

```typescript
const { data: vendors } = await supabase
  .from('vendors')
  .select(`
    *,
    vendor_categories (
      is_primary,
      categories:categories (
        id,
        slug,
        name_en,
        name_de
      )
    ),
    vendor_technologies (
      technologies:technologies (
        id,
        slug,
        name_en,
        name_de
      )
    ),
    vendor_industries (
      industries:industries (
        id,
        slug,
        name_en,
        name_de
      )
    )
  `)
  .order('created_at', { ascending: false });
```

### Normalized Vendor Shape

After fetching, vendors are normalized to include slug arrays:

```typescript
const normalizedVendor = {
  ...vendor,
  category_slugs: vendor.vendor_categories?.map(vc => vc.categories?.slug).filter(Boolean) || [],
  technology_slugs: vendor.vendor_technologies?.map(vt => vt.technologies?.slug).filter(Boolean) || [],
  industry_slugs: vendor.vendor_industries?.map(vi => vi.industries?.slug).filter(Boolean) || []
};
```

---

## Notes

1. **Bilingual Support**: Most entities support English (`_en`) and German (`_de`) fields. Components resolve the appropriate language based on the `lang` prop. The `description` field (without language suffix) is a legacy field that may still exist in some records but should not be used for new entries.

2. **Technologies Field**: The `technologies` field does **NOT** exist in the actual database schema. Technologies are only linked via the `vendor_technologies` join table. Some legacy code or CSV imports may reference a `technologies` text field, but this is not part of the database schema.

3. **Data Types**: 
   - `employee_count` is stored as `integer` in the database, not text
   - `year_founded` is `integer`
   - `hourly_rate` is `text` (allows ranges like "€50-100")
   - `priority` is `integer` with default value of 5
   - `featured` and `og_member` are `boolean` with default `false`

4. **Slug Arrays**: For easier form handling and filtering, vendors include `category_slugs`, `technology_slugs`, and `industry_slugs` arrays that are computed from the join table relationships. These are not stored in the database but are computed at query time.

5. **Logo Handling**: Logos are stored with metadata (width, height, format, alt text) and can have background variants (white, light, gray, dark, brand) encoded in the URL filename pattern: `__{variant}.{ext}`.

6. **Plan System**: Vendors have a `plan` field that controls visibility and features:
   - `free`: Basic listing (default)
   - `pro`: Enhanced listing
   - `featured`: Featured placement
   - `deactivated`: Hidden from public view

7. **Priority System**: Vendors can have a priority (integer, default: 5) that affects sorting. Higher priority vendors appear first in listings. Null values are sorted last.

8. **Database Constraints**:
   - `id`: Primary key (UUID, auto-generated)
   - `slug`: Unique constraint (must be unique across all vendors)
   - Indexes on: `country`, `slug`, `tags` (for query performance)
   - `name` and `country` are NOT NULL (required fields)

