

# Add "Seed Lemon Law Campaigns" Button to SEO Dashboard

The `seed-state-lemon-campaigns` edge function is deployed but has no UI trigger. I'll add a button to invoke it from the Coverage tab (where other bulk-plan operations live).

## What I'll do

Add a "Seed State Campaigns" button to `TemplateCoverageMap.tsx` that:
1. Calls `supabase.functions.invoke('seed-state-lemon-campaigns')`
2. Shows a loading spinner while running
3. Displays a toast with the result (e.g., "49 states seeded, 294 articles queued")
4. After success, the queued articles will appear in the Queue tab, ready to be generated via the existing "Generate All" bulk workflow

## How it works end-to-end

1. You click **"Seed State Campaigns"** in the Coverage tab
2. The function creates 49 `content_plans` + 294 `content_queue` items (1 pillar + 5 clusters per state)
3. You go to the **Queue tab**, where those 294 items appear with status "queued"
4. You click **"Generate All"** in the Queue tab to start bulk article generation via the existing `bulk-generate-articles` pipeline

## Files changed
- `src/components/admin/seo/TemplateCoverageMap.tsx` — add seed button + invoke logic

