

# Fix Pillar Identification and article_type Constraint

## Problems Found

1. **67 queued items have `article_type: 'pillar'`** - these will FAIL when generation runs because the database check constraint only allows: how-to, mistakes, rights, sample, faq, case-study, comparison, checklist. The fix in `plan-from-keywords` was applied but the 67 already-inserted pillar items still have the invalid type.

2. **No way to tell pillars from clusters in the UI** - the queue table checks `item.article_type === 'pillar'` (line 108) to show a "Hub" badge, but since that type is invalid, we need a different identification method. Pillars are items where `parent_queue_id IS NULL` within a keyword-based plan.

3. **Keyword inclusion is already handled** - the `bulk-generate-articles` function already has keyword validation (lines 301-328) and a remediation pass (lines 330-395) that re-prompts the AI to weave in any missing keywords. Primary keywords get 3-5x density, secondaries 1-2x. This system is already working.

## Fix Plan

### Step 1: Database Cleanup - Fix the 67 Invalid article_type Rows

Run SQL to update the 67 pillar items from `'pillar'` to their AI-suggested type. Since we can't recover the original AI suggestion, default them to `'how-to'` (which is the correct type for comprehensive pillar/hub guides):

```sql
UPDATE content_queue SET article_type = 'how-to' WHERE article_type = 'pillar';
```

### Step 2: Update Queue Table UI to Identify Pillars Correctly

**File: `src/components/admin/seo/queue/QueueTable.tsx`**

Replace the `article_type === 'pillar'` check (line 108) with a check for `parent_queue_id IS NULL` on keyword-based plans. Items without a parent are pillars (hubs); items with a parent are clusters.

- Show a **"Pillar"** badge on items where `parent_queue_id` is null AND the plan's `template_slug` contains `-kw-` (keyword-based plans)
- Show a **"Cluster"** badge with the link icon on items where `parent_queue_id` is set

This makes it visually clear in the queue which articles are hub pages vs supporting cluster articles.

### Step 3: Update Generation Logic for Pillar Detection

**File: `supabase/functions/bulk-generate-articles/index.ts`** (line 819)

Change the pillar detection from `item.article_type === 'pillar'` to `!item.parent_queue_id` (items without a parent are pillars). This ensures the comprehensive pillar prompt (2000-3000 words, cluster references) is used for hub articles even though their article_type is now `'how-to'`.

Also update line 831 where it filters siblings with `.neq('article_type', 'pillar')` to use `.not('parent_queue_id', 'is', null)` instead (clusters are items that HAVE a parent).

## Files Changed

- **SQL**: Update 67 rows from `article_type = 'pillar'` to `'how-to'`
- **Modified**: `src/components/admin/seo/queue/QueueTable.tsx` - pillar/cluster badges based on `parent_queue_id`
- **Modified**: `supabase/functions/bulk-generate-articles/index.ts` - pillar detection via `parent_queue_id` instead of `article_type`

## Keyword Assurance

The existing system already ensures keywords appear in articles:
1. AI prompt explicitly lists every keyword with density targets
2. After generation, `validateKeywordUsage()` checks if all keywords appear
3. If any are missing, `remediateKeywords()` makes a second AI call to weave them in
4. Final coverage is logged per article

No changes needed for keyword inclusion - it is already robust.
