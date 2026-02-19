

# Make Rescue Orphans Actually Fix All Orphans

## Why 130 Orphans Remain

The rescue function found matches but 73% of suggestions were rejected because the source articles already had 8+ outbound links (the default cap). With 1,650 articles at the cap and another 2,939 at 6-7, there simply aren't enough "low-outbound" sources available at the current 0.70 similarity threshold.

## Changes

### 1. `supabase/functions/rescue-orphans/index.ts` -- More aggressive matching

| Parameter | Current | New | Why |
|-----------|---------|-----|-----|
| `similarity_threshold` | 0.70 | 0.55 | Widens the candidate pool significantly |
| `max_results` | 15 | 40 | More candidates means more chances to find one under the cap |
| `maxLinksPerArticle` | 8 | 12 | Rescue-specific cap -- articles with 8-11 outbound links can still be sources |
| Max suggestions per orphan | 3 | 5 | More inbound link options per orphan |

These relaxed parameters only apply during rescue operations, not during regular scans.

### 2. `supabase/functions/rescue-orphans/index.ts` -- Prioritize low-outbound sources

Sort candidates by outbound_count ascending so we prefer sources that have room, rather than picking the most semantically similar first. This is a simple change to the candidate loop -- check outbound_count and prefer lower values.

### 3. `match_semantic_links` RPC -- Return outbound_count

Currently the RPC doesn't return `outbound_count`, forcing the rescue function to make an extra DB query per candidate. Add `outbound_count` to the return columns. This also eliminates the N+1 query problem (currently one extra query per candidate).

### 4. Auto-approve rescue suggestions

Currently rescue suggestions are created as "pending", requiring manual approval and another "Apply Links" click. For rescue operations specifically, auto-set status to "approved" so they're ready for immediate bulk application. This eliminates the manual review step for rescue-generated links since the whole point is automated orphan fixing.

## Files to Change

| File | Change |
|------|--------|
| `supabase/functions/rescue-orphans/index.ts` | Lower threshold to 0.55, raise cap to 12, increase max_results to 40, max 5 suggestions per orphan, sort by outbound_count, auto-approve suggestions |
| New migration SQL | Update `match_semantic_links` RPC to include `ae.outbound_count` in the return columns |

## Expected Outcome

- One click on "Rescue Orphans" will find viable sources for most of the 130 remaining orphans
- Suggestions are auto-approved, so the next "Apply Links" click immediately inserts them
- The outbound cap of 12 for rescue means articles with 8-11 links can still serve as sources (a pool of 2,939 articles at 6-7 outbound becomes available)
- The lower 0.55 threshold catches topically adjacent articles that 0.70 missed

