

# Fix: "Missing Pillars" Count Shows Wrong Number

## Problem

The `missingPillarCount` calculation (line 124) is wrong in two ways:

1. **Naive math**: It does `templatePlans.length - totalPillarCount`. This counts ALL pillar articles in `content_queue`, including keyword-campaign pillars that aren't tied to template plans. So it over-subtracts and could even go negative (clamped to 0), but more importantly it doesn't check *which* plans actually have pillars.

2. **Doesn't match the mutation logic**: The actual `createAllPillarsMutation` (lines 131-142) correctly checks by `plan_id` — it fetches all plans, fetches all pillar queue items, builds a Set of `plan_id`s, and filters to plans without a pillar. The count query should use the same logic.

## Fix

**File: `src/components/admin/seo/TemplateCoverageMap.tsx`**, lines 116-126

Replace the naive count query with one that mirrors the mutation logic:

1. Fetch all `plan_id` values from `content_queue` where `article_type = 'pillar'` (using `head: false` but selecting only `plan_id`)
2. Build a Set of plan IDs that already have pillars
3. Count how many `templatePlans` are NOT in that Set
4. Use pagination to avoid the 1000-row limit on the pillar query (fetch in batches, or use `count: exact` with a filter per plan)

Since the number of pillar rows could exceed 1000, the cleanest approach is:
- Use `count: 'exact', head: true` to get the total pillar count
- Then fetch plan_ids in pages of 1000 to build the complete Set
- Or better: fetch the `plan_id` list from `content_queue` where `article_type = 'pillar'` AND `plan_id` is in the list of template plan IDs — this scopes it correctly

**Revised query logic:**
```typescript
const { data: missingPillarCount } = useQuery({
  queryKey: ['missing-pillar-count', templatePlans.length],
  queryFn: async () => {
    if (templatePlans.length === 0) return 0;
    
    const planIds = templatePlans.map(p => p.id);
    
    // Fetch in batches of 500 to stay under limits
    const existingPillarPlanIds = new Set<string>();
    for (let i = 0; i < planIds.length; i += 500) {
      const batch = planIds.slice(i, i + 500);
      const { data } = await supabase
        .from('content_queue')
        .select('plan_id')
        .eq('article_type', 'pillar')
        .in('plan_id', batch);
      (data || []).forEach(r => existingPillarPlanIds.add(r.plan_id));
    }
    
    return planIds.filter(id => !existingPillarPlanIds.has(id)).length;
  },
  enabled: templatePlans.length > 0,
});
```

This mirrors the mutation's logic exactly, so the button count will match what the mutation would actually queue.

## Scope
- **1 file changed**: `src/components/admin/seo/TemplateCoverageMap.tsx`
- **~15 lines** replaced in the `missingPillarCount` query

