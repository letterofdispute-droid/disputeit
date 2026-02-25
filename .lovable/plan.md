

# Fix: "Create Missing Plans" Ignoring Existing Plans (1000-Row Limit Bug)

## Root Cause

The `createMissingPlansMutation` in `TemplateCoverageMap.tsx` (line 255-257) fetches existing plan slugs like this:

```ts
const { data: existingPlans } = await supabase
  .from('content_plans')
  .select('template_slug');
```

No pagination. The `content_plans` table contains both template-based plans (~621) and keyword campaign plans (hundreds more), easily exceeding the **1000-row PostgREST default limit**. So the query returns only 1000 rows, misses some existing slugs, and reports them as "missing". The insert then either:
- Fails silently due to the unique constraint on `template_slug`, or
- Reports success with `{ created: 0 }` since the conflict prevents actual inserts

Either way, the count doesn't change because the plans already exist.

## Fix (1 file)

**`src/components/admin/seo/TemplateCoverageMap.tsx`** — lines 252-282

Add paginated fetching for existing plan slugs (same pattern already used in `createAllPillarsMutation` above):

```ts
// Fetch ALL existing plan slugs in batches
const allSlugs: string[] = [];
let offset = 0;
const batchSize = 1000;
while (true) {
  const { data, error } = await supabase
    .from('content_plans')
    .select('template_slug')
    .range(offset, offset + batchSize - 1);
  if (error) throw error;
  if (!data || data.length === 0) break;
  allSlugs.push(...data.map(p => p.template_slug));
  if (data.length < batchSize) break;
  offset += batchSize;
}

const existingSlugs = new Set(allSlugs);
```

The rest of the mutation logic (finding missing templates, building rows, inserting) stays the same.

## Impact

- The "Create X Missing Plans" button will correctly identify only genuinely missing templates
- No false positives from the 1000-row limit truncation
- Consistent with the pagination pattern already used in the pillar mutation above

