

## Persist AI Analysis Recommendations + Clear Button

### Problem
Recommendations live only in `recommendationsMutation.data` (React state). Lost on refresh.

### Approach
Create a `gsc_recommendations_cache` table to store the JSON blob, then load it via `useQuery` on mount.

### Implementation

**1. Create DB table** (`gsc_recommendations_cache`)
- Columns: `id` (uuid, pk), `recommendations` (jsonb), `created_at` (timestamptz), `updated_at` (timestamptz)
- Single-row pattern: always upsert on `id = 'singleton'` (or use text PK)
- RLS: allow read/write for authenticated users

**2. Edit `SearchConsolePanel.tsx`**
- Add `useQuery(['gsc-recommendations-cache'])` that reads the cached row on mount
- In `recommendationsMutation.onSuccess`: upsert the result into the cache table
- Derive `recs` from the cache query data (not mutation data), so it survives refresh
- Add a **"Clear Analysis"** button (with `Trash2` icon, destructive outline variant) next to the AI Analysis button
- Clear button: deletes the cache row, resets the query, switches tab back to overview

**3. Files changed**
- New migration: create `gsc_recommendations_cache` table + RLS
- Edit: `src/components/admin/seo/SearchConsolePanel.tsx` — add cache query, upsert on success, clear button

