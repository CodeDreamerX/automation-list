# CSV Import Format Guide

This guide explains how to format your CSV file for importing vendors into the system.

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
| `description` | Text | No | Company description | "Leading automation solutions..." |
| `technologies` | Text | No | Technologies used (comma-separated) | "Python, JavaScript, PLC" |
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
| `technology_slugs` | Text | No | Semicolon-separated technology slugs | "python;javascript;plc" |

## Important Formatting Rules

### 1. Separators
- **Category slugs**: Use semicolons (`;`) to separate multiple categories
  - Example: `plcs;scada-hmi;robotics`
- **Technology slugs**: Use semicolons (`;`) to separate multiple technologies
  - Example: `python;javascript;plc`
- **Other comma-separated fields**: Use commas (`,`) for technologies, languages, certifications, tags, industries
  - Example: `Python, JavaScript, PLC`

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

## Example CSV File

```csv
name,slug,country,category_slugs,region,city,website,email,description,technologies,languages,year_founded,employee_count,featured,priority,technology_slugs
Acme Corporation,acme-corp,Germany,plcs;scada-hmi,Bavaria,Munich,https://acme.com,contact@acme.com,Leading automation solutions provider,Python;JavaScript;PLC,English;German,2010,50-100,true,1,python;javascript;plc
Tech Solutions Inc,tech-solutions,United States,robotics;vision-safety,California,San Francisco,https://techsolutions.com,info@techsolutions.com,Robotics and vision systems expert,Robotics;Vision Systems,English;Spanish,2005,100-200,false,3,robotics;vision-systems
Automation Pro,automation-pro,France,mes-scada;industrial-it-iot,Île-de-France,Paris,https://automationpro.fr,sales@automationpro.fr,MES and SCADA solutions,SCADA;MES;IoT,English;French,2015,25-50,true,2,scada;mes;iot
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

## Getting Category and Technology Slugs

To find valid category and technology slugs:
1. Log into the admin panel
2. Navigate to Categories or Technologies sections
3. Check the slugs used in the system
4. Use those exact slugs in your CSV (case-insensitive, but lowercase is recommended)

