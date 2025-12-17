# CSV Import Format Guide

This guide explains how to format your CSV file for importing vendors into the system.

## Quick Start

1. **Download the template**: Use `vendor_import_template.csv` as a starting point
2. **Fill in required fields**: `name`, `slug`, `country`, `category_slugs`
3. **Add optional fields** as needed
4. **Upload via admin panel**: Navigate to `/admin/vendors/csv/upload`
5. **Preview and validate**: Review the preview before final import
6. **Import**: Confirm the import to add vendors to the database

## Required Fields

The following fields are **required** and must be present in every row:

- `name` - Vendor name (e.g., "Acme Corporation")
- `slug` - URL-friendly identifier (e.g., "acme-corporation")
- `country` - Country name (e.g., "Germany", "United States")
- `category_slugs` - Semicolon-separated category slugs (e.g., "plcs;scada-hmi;robotics")

## All Available Fields

Here are all the fields you can include in your CSV:

| Field Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| `name` | Text | ✅ Yes | Vendor company name | "Acme Corporation" |
| `slug` | Text | ✅ Yes | URL-friendly identifier (lowercase, hyphens) | "acme-corporation" |
| `country` | Text | ✅ Yes | Country name | "Germany" |
| `category_slugs` | Text | ✅ Yes | Semicolon-separated category slugs | "plcs;scada-hmi" |
| `region` | Text | No | Region/state | "Bavaria" |
| `city` | Text | No | City name | "Munich" |
| `address` | Text | No | Street address | "123 Main St" |
| `website` | URL | No | Website URL (must start with http:// or https://) | "https://example.com" |
| `email` | Email | No | Contact email (must contain @) | "contact@example.com" |
| `phone` | Text | No | Phone number | "+49 123 456789" |
| `description` | Text | No | Company description (English) - maps to description_en | "Leading automation solutions..." |
| `description_en` | Text | No | Company description in English | "Leading automation solutions..." |
| `description_de` | Text | No | Company description in German | "Führender Anbieter von Automatisierungslösungen..." |
| `technologies` | Text | No | ⚠️ **DEPRECATED** - Not stored in database. Use `technology_slugs` instead. | "Python, JavaScript, PLC" |
| `languages` | Text | No | Languages supported (comma-separated) | "English, German, French" |
| `certifications` | Text | No | Certifications (comma-separated) | "ISO 9001, CE Mark" |
| `tags` | Text | No | Tags (comma-separated) | "automation, robotics, iot" |
| `industries` | Text | No | Industries served (comma-separated) | "Manufacturing, Automotive" |
| `year_founded` | Number | No | Year company was founded | "2010" |
| `employee_count` | Number/Text | No | Number of employees | "50-100" or "75" |
| `hourly_rate` | Number/Text | No | Hourly rate | "€50-100" or "75" |
| `plan` | Text | No | Plan type (default: "free") | "free", "pro", "featured", "deactivated" |
| `featured` | Boolean | No | Featured vendor (true/false/1/yes) | "true" or "false" |
| `priority` | Number | No | Priority (1-5, default: 5) | "1", "2", "3", "4", "5" |
| `og_member` | Boolean | No | OG member status (true/false/1/yes) | "true" or "false" |
| `technology_slugs` | Text | No | ✅ **Use this instead of `technologies`** - Semicolon-separated technology slugs that link to existing technologies | "python;javascript;plc" |

## Important Formatting Rules

### 1. Separators
- **Category slugs**: Use semicolons (`;`) to separate multiple categories
  - Example: `plcs;scada-hmi;robotics`
- **Technology slugs**: Use semicolons (`;`) to separate multiple technology slugs
  - Example: `python;javascript;plc`
  - ⚠️ **Important**: Use `technology_slugs` (not `technologies`) to link technologies
- **Other comma-separated fields**: Use commas (`,`) for languages, certifications, tags, industries
  - Example: `English, German, French`
  - ⚠️ **Note**: The `technologies` field is deprecated and not stored in the database

### 2. Boolean Values
For `featured` and `og_member` fields, you can use:
- `true` / `false`
- `1` / `0`
- `yes` / `no`
- Case-insensitive

### 3. Website URLs
- Must start with `http://` or `https://`
- If you omit the protocol, the system will add `https://` automatically
- Example: `https://example.com` or `example.com` (will become `https://example.com`)

### 4. Email Addresses
- Must contain the `@` symbol
- Example: `contact@example.com`

### 5. Column Names
- Column names are **case-insensitive**
- You can use `Name`, `name`, `NAME` - all will work
- Spaces around column names are automatically trimmed

### 6. Empty Values
- Leave cells empty for optional fields
- Empty values will be set to `null` in the database

### 7. Description Fields
- `description` field maps to `description_en` (English description) if `description_en` is not provided
- Use `description_en` for English descriptions and `description_de` for German descriptions
- If you only provide `description`, it will be used as the English description

## Example CSV File

### Minimal Example (Required Fields Only)
```csv
name,slug,country,category_slugs
Acme Corporation,acme-corp,Germany,plcs;scada-hmi
Tech Solutions Inc,tech-solutions,United States,robotics;vision-safety
```

### Full Example (All Fields)
```csv
name,slug,country,category_slugs,region,city,website,email,description,description_de,technologies,languages,year_founded,employee_count,featured,priority,technology_slugs
Acme Corporation,acme-corp,Germany,plcs;scada-hmi,Bavaria,Munich,https://acme.com,contact@acme.com,Leading automation solutions provider,Führender Anbieter von Automatisierungslösungen,Python;JavaScript;PLC,English;German,2010,50-100,true,1,python;javascript;plc
Tech Solutions Inc,tech-solutions,United States,robotics;vision-safety,California,San Francisco,https://techsolutions.com,info@techsolutions.com,Robotics and vision systems expert,,Robotics;Vision Systems,English;Spanish,2005,100-200,false,3,robotics;vision-systems
Automation Pro,automation-pro,France,mes-scada;industrial-it-iot,Île-de-France,Paris,https://automationpro.fr,sales@automationpro.fr,MES and SCADA solutions,Solutions MES et SCADA,SCADA;MES;IoT,English;French,2015,25-50,true,2,scada;mes;iot
```

## Validation Rules

The system will validate your CSV and report:

- **Errors** (rows will be skipped):
  - Missing required fields (name, slug, country, category_slugs)
  - Duplicate slugs within the CSV file
  - Slug already exists in the database

- **Warnings** (rows will import but with warnings):
  - Invalid email format (missing @)
  - Invalid website URL (missing http:// or https://)
  - Duplicate slugs within the CSV

## Tips

1. **Use UTF-8 encoding** when saving your CSV file
2. **Include a header row** with column names
3. **Test with a small file first** (2-3 rows) before importing large datasets
4. **Check category and technology slugs** - they must match existing slugs in the system
5. **Preview before importing** - the system will show you a preview with validation results
6. **Use quotes** for fields containing commas, quotes, or newlines:
   ```csv
   name,description
   "Acme Corp","Leading provider of automation solutions, including PLCs and SCADA systems"
   ```

## File Requirements

- File format: `.csv`
- Maximum file size: 10MB
- Encoding: UTF-8 recommended
- First row: Must contain column headers
- Empty rows: Will be automatically skipped

## Import Workflow

The CSV import process follows these steps:

1. **Upload**: Upload your CSV file via `/admin/vendors/csv/upload`
2. **Preview**: Review the parsed data, validation results, and warnings
3. **Validate**: Check for errors and warnings before proceeding
4. **Import**: Confirm the import to add vendors to the database
5. **Review**: Check the import results summary

### What Happens During Import

- **Vendor Creation**: Each valid row creates a new vendor record
- **Category Linking**: Category slugs are matched to existing categories and linked
- **Technology Linking**: Technology slugs are matched to existing technologies and linked
- **Slug Validation**: Duplicate slugs (within CSV or existing in database) are skipped
- **Data Normalization**: 
  - Website URLs without protocol get `https://` prepended
  - Boolean values are normalized (`true`/`1`/`yes` → true)
  - Category and technology slugs are lowercased and trimmed
  - Empty values are converted to `null`

## Getting Category and Technology Slugs

To find valid category and technology slugs:
1. Log into the admin panel
2. Navigate to Categories or Technologies sections
3. Check the slugs used in the system
4. Use those exact slugs in your CSV (case-insensitive, but lowercase is recommended)

## Troubleshooting

### Common Issues

**Issue**: "Missing required fields" error
- **Solution**: Ensure all four required fields (`name`, `slug`, `country`, `category_slugs`) are present in every row

**Issue**: "Slug already exists" warning
- **Solution**: Use a unique slug for each vendor, or update existing vendors through the admin panel instead

**Issue**: "Unknown category slug" warning
- **Solution**: Verify the category slug exists in the system. Check the Categories section in the admin panel

**Issue**: "Unknown technology slug" warning
- **Solution**: Verify the technology slug exists in the system. Check the Technologies section in the admin panel

**Issue**: Import fails with parse errors
- **Solution**: 
  - Ensure file is saved as UTF-8 encoding
  - Check for special characters and escape them properly
  - Verify CSV format (commas as separators, proper quoting)

**Issue**: Website URL validation fails
- **Solution**: Include `http://` or `https://` prefix, or leave empty (system will add https:// automatically)

**Issue**: Email validation fails
- **Solution**: Ensure email contains `@` symbol

### Best Practices

1. **Start Small**: Test with 2-3 rows first to verify format
2. **Use Template**: Start from `vendor_import_template.csv` to ensure correct column order
3. **Validate Slugs**: Double-check category and technology slugs before importing
4. **Check Preview**: Always review the preview page before confirming import
5. **Backup Data**: Consider backing up your database before large imports
6. **Unique Slugs**: Ensure each vendor has a unique slug
7. **Consistent Formatting**: Use consistent date formats, number formats, etc.

---

# AI Agent Instructions: CSV Generation Guide

## Purpose
This section provides precise instructions for AI agents generating CSV files for vendor imports. Follow these specifications exactly to ensure successful imports.

## File Structure Requirements

### Basic Format
- **File Type**: CSV (`.csv` extension)
- **Encoding**: UTF-8
- **Line Endings**: Unix-style (`\n`) or Windows-style (`\r\n`) - both accepted
- **Header Row**: REQUIRED - must be the first row
- **Column Separator**: Comma (`,`)
- **Text Qualifier**: Double quotes (`"`) - use when field contains commas, quotes, or newlines

### Header Row Format
```csv
name,slug,country,category_slugs,region,city,address,website,email,phone,description,description_en,description_de,languages,certifications,tags,industries,year_founded,employee_count,hourly_rate,plan,featured,priority,og_member,technology_slugs
```

**Important**: 
- Column names are case-insensitive, but use lowercase for consistency.
- ⚠️ **Do NOT include `technologies` column** - it is deprecated and will cause import errors. Use `technology_slugs` instead.

## Required Fields (MUST be in every row)

| Field | Type | Format | Example | Validation |
|-------|------|--------|---------|------------|
| `name` | Text | Any text | `Acme Corporation` | Cannot be empty |
| `slug` | Text | Lowercase, hyphens only | `acme-corporation` | Must be unique, no spaces/special chars |
| `country` | Text | Country name | `Germany` | Cannot be empty |
| `category_slugs` | Text | Semicolon-separated | `plcs;scada-hmi;robotics` | Must have at least one valid slug |

## Field Specifications

### Text Fields
- **Allowed**: Any UTF-8 characters
- **Empty values**: Leave cell completely empty (not `null`, `N/A`, or `-`)
- **Special characters**: Wrap in double quotes if contains comma, quote, or newline
- **Quote escaping**: Double any internal quotes (`"` becomes `""`)

### Slug Generation Rules
```
Input: "Acme Corporation Inc."
Process:
1. Convert to lowercase: "acme corporation inc."
2. Replace spaces with hyphens: "acme-corporation-inc."
3. Remove special characters: "acme-corporation-inc"
4. Remove trailing hyphens/periods: "acme-corporation-inc"
Result: "acme-corporation-inc"
```

**Slug Requirements**:
- Must be unique within the CSV file
- Must be unique in the database (will be checked during import)
- Only lowercase letters, numbers, and hyphens
- No consecutive hyphens
- No leading/trailing hyphens

### Separator Rules

**Semicolon-separated fields** (use `;`):
- `category_slugs`: `plcs;scada-hmi;robotics`
- `technology_slugs`: `python;javascript;plc`

**Comma-separated fields** (use `,`):
- `languages`: `English, German, French`
- `certifications`: `ISO 9001, CE Mark`
- `tags`: `automation, robotics, iot`
- `industries`: `Manufacturing, Automotive`

**Important**: 
- Do NOT mix separators. Use semicolons ONLY for `category_slugs` and `technology_slugs`.
- ⚠️ **Do NOT use `technologies` field** - it is deprecated and not stored in the database. Use `technology_slugs` instead to link technologies.

### Boolean Fields
Fields: `featured`, `og_member`

**Accepted values** (case-insensitive):
- `true`, `1`, `yes` → true
- `false`, `0`, `no` → false
- Empty → false

**Examples**: `true`, `TRUE`, `True`, `1`, `yes`, `YES`

### Number Fields
Fields: `year_founded`, `priority`, `employee_count`, `hourly_rate`

- **year_founded**: 4-digit year (e.g., `2010`)
- **priority**: Integer 1-5 (default: 5)
- **employee_count**: Can be number (`75`) or range (`50-100`)
- **hourly_rate**: Can be number (`75`) or range with currency (`€50-100`)

**Empty values**: Leave cell empty (becomes `null`)

### URL Fields
Field: `website`

**Format**:
- Must start with `http://` or `https://`
- Or leave empty (system will not auto-add protocol if empty)
- Examples: `https://example.com`, `http://example.com`

**Invalid**: `example.com` (will generate warning but still import)

### Email Fields
Field: `email`

**Format**:
- Must contain `@` symbol
- Examples: `contact@example.com`, `info@company.de`
- Leave empty if not available

**Invalid**: `contact.example.com` (will generate warning but still import)

### Plan Field
Field: `plan`

**Valid values**: `free`, `pro`, `featured`, `deactivated`
**Default**: `free` (if empty or invalid)

## CSV Generation Algorithm

### Step-by-Step Process

1. **Initialize CSV**:
   ```csv
   name,slug,country,category_slugs
   ```

2. **For each vendor**:
   - Generate slug from name
   - Ensure all required fields are present
   - Format optional fields according to type
   - Escape special characters
   - Add row to CSV

3. **Finalize CSV**:
   - Ensure UTF-8 encoding
   - Ensure header row is first
   - Remove empty trailing rows

### Example Generation

**Input Data**:
```json
{
  "name": "Acme Corporation",
  "country": "Germany",
  "categories": ["PLCs", "SCADA/HMI"],
  "website": "https://acme.com",
  "email": "contact@acme.com"
}
```

**Generated CSV Row**:
```csv
Acme Corporation,acme-corporation,Germany,plcs;scada-hmi,,,https://acme.com,contact@acme.com,,,,,,,,,,,,,,,
```

**With More Fields**:
```csv
Acme Corporation,acme-corporation,Germany,plcs;scada-hmi,Bavaria,Munich,123 Main St,https://acme.com,contact@acme.com,+49 123 456789,Leading automation provider,Führender Anbieter,Python;JavaScript;PLC,English;German,ISO 9001;CE Mark,automation;robotics,Manufacturing;Automotive,2010,50-100,€50-100,free,true,1,false,python;javascript;plc
```

## Validation Checklist

Before outputting CSV, verify:

- [ ] File is UTF-8 encoded
- [ ] First row contains column headers
- [ ] Every data row has all 4 required fields
- [ ] All `slug` values are unique within the file
- [ ] All `slug` values are lowercase with hyphens only
- [ ] `category_slugs` uses semicolons (`;`) as separator
- [ ] `category_slugs` has at least one value per row
- [ ] `technology_slugs` uses semicolons (`;`) as separator (if provided)
- [ ] Other list fields use commas (`,`) as separator
- [ ] Website URLs start with `http://` or `https://` (or empty)
- [ ] Email addresses contain `@` (or empty)
- [ ] Boolean fields use `true`/`false`/`1`/`0`/`yes`/`no`
- [ ] Fields with commas/quotes/newlines are wrapped in double quotes
- [ ] Empty optional fields are left empty (not `null` or placeholders)
- [ ] No trailing empty rows

## Common Mistakes to Avoid

❌ **Wrong**: `category_slugs: "plcs,scada-hmi"` (using comma instead of semicolon)
✅ **Correct**: `category_slugs: "plcs;scada-hmi"`

❌ **Wrong**: `technologies: "Python, JavaScript, PLC"` (field not stored in database)
✅ **Correct**: `technology_slugs: "python;javascript;plc"` (use slugs to link technologies)

❌ **Wrong**: `slug: "Acme Corporation"` (uppercase and spaces)
✅ **Correct**: `slug: "acme-corporation"`

❌ **Wrong**: `website: "example.com"` (missing protocol)
✅ **Correct**: `website: "https://example.com"` or empty

❌ **Wrong**: `featured: "yes"` (should work, but `true` is clearer)
✅ **Correct**: `featured: "true"` or `featured: "1"`

❌ **Wrong**: `description: "Leading provider, including PLCs"` (comma not escaped)
✅ **Correct**: `description: "Leading provider, including PLCs"` (wrapped in quotes) or `"Leading provider, including PLCs"`

❌ **Wrong**: Empty field filled with `null` or `N/A`
✅ **Correct**: Leave cell completely empty

## Complete Example CSV

```csv
name,slug,country,category_slugs,region,city,address,website,email,phone,description,description_en,description_de,technologies,languages,certifications,tags,industries,year_founded,employee_count,hourly_rate,plan,featured,priority,og_member,technology_slugs
Acme Corporation,acme-corporation,Germany,plcs;scada-hmi,Bavaria,Munich,123 Main Street,https://acme.com,contact@acme.com,+49 123 456789,Leading automation solutions provider,Leading automation solutions provider,Führender Anbieter von Automatisierungslösungen,Python;JavaScript;PLC,English;German,ISO 9001;CE Mark,automation;robotics;iot,Manufacturing;Automotive,2010,50-100,€50-100,free,true,1,false,python;javascript;plc
Tech Solutions Inc,tech-solutions-inc,United States,robotics;vision-safety,California,San Francisco,456 Tech Blvd,https://techsolutions.com,info@techsolutions.com,+1 555 1234567,Robotics and vision systems expert,Robotics and vision systems expert,,Robotics;Vision Systems,English;Spanish,ISO 9001,robotics;vision,Automotive;Aerospace,2005,100-200,$75-150,pro,false,3,false,robotics;vision-systems
```

## Output Format

When generating CSV:
1. Always include header row
2. One vendor per row
3. Maintain consistent column order (match template)
4. Use proper escaping for special characters
5. Ensure UTF-8 encoding
6. End file with newline

## Testing Recommendations

Before generating large CSV files:
1. Generate 2-3 test rows first
2. Verify format matches template
3. Check slug uniqueness
4. Validate separators (semicolons vs commas)
5. Test import in system if possible

---

**End of AI Agent Instructions**

