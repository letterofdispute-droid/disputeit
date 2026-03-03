

# Plan: Fix CSV Export for Database Import

## Problem
The current `export-data` function produces CSVs with human-readable headers (`ID`, `Title`, `Slug`, `Featured`) instead of actual database column names (`id`, `title`, `slug`, `featured`). It also only exports 14 of 30+ columns. Supabase's CSV import requires exact column name matches.

## Solution
Create a new edge function `migrate-csv` that exports a table as a raw CSV with:
- Headers matching exact database column names
- All columns included
- Proper handling of arrays (PostgreSQL `{a,b}` format), JSON, booleans, and nulls
- Pagination support for the 95MB dataset — export in chunks (e.g. 500 rows per call) so you can download multiple CSVs and import them sequentially

## How it works
1. Call `GET /migrate-csv?table=blog_posts&offset=0&limit=500` → returns CSV chunk 1
2. Call with `offset=500` → chunk 2, etc.
3. Each CSV file will have proper headers and be directly importable into the new project's Table Editor
4. Response includes a header `X-Next-Offset` and `X-Total-Count` so you know when you're done

## Steps
1. Create `supabase/functions/migrate-csv/index.ts`
2. Deploy it
3. You download each chunk and import via the Supabase Table Editor

## Why not fix the push function?
The push function keeps hitting deployment/404 issues. CSV import through the Supabase UI is the most reliable path — we just need the CSV format to be correct.

