

# Replace Em-Dashes with Hyphens in Page SEO Metadata

## What
Run a database update to replace all em-dash characters (—) with standard hyphens (-) in `meta_title` and `meta_description` columns across all rows in the `pages` table, regardless of page group.

## How
Two SQL UPDATE statements using the database insert tool (data operation, not schema):

```sql
-- Update meta_title
UPDATE pages SET meta_title = REPLACE(meta_title, '—', '-') WHERE meta_title LIKE '%—%';

-- Update meta_description  
UPDATE pages SET meta_description = REPLACE(meta_description, '—', '-') WHERE meta_description LIKE '%—%';
```

This aligns with the existing content quality rule that em-dashes must be replaced with standard hyphens globally.

## Scope
- All page groups (static, legal, tools, templates, guides, state-rights, small-claims, auth)
- Only rows that actually contain em-dashes are touched
- No schema changes needed

