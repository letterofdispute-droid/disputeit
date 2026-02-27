

## Smart Coverage Detection for Opportunities Tab

### Current State
The `OpportunitiesTab` already fetches published `blog_posts` and does single-post matching per query. But it only finds one match and shows a "Link to existing" button. It doesn't count total topic coverage or adjust the primary action accordingly.

### Changes

**File: `src/components/admin/seo/gsc/OpportunitiesTab.tsx`**

1. Expand the `pillarMatches` logic to also compute a **coverage count** per query — count all posts whose title/keyword overlap with the query (not just find the first match). Store as `Record<number, { count: number; bestMatch: ExistingPost }>`.

2. Add a **smart recommendation badge** above the action buttons when coverage is detected:
   - If count >= 5: Show info banner: `"You already have {count} articles covering this topic — consider adding as cluster to existing pillar"` with the "Link to Existing" button promoted to primary.
   - If count 1-4: Show subtle note: `"{count} related articles exist"` with both Campaign and Link buttons equally weighted.
   - If count 0: Show "Create Campaign" as primary (current behavior).

3. **Reorder buttons** based on coverage:
   - High coverage (5+): `Link to Existing` (primary) → `Add Single` (outline) → `Keyword` (ghost). Hide "Create Campaign" or demote to ghost.
   - Low/no coverage: Keep current order with `Create Campaign` primary.

### Technical Details
- The coverage count uses the same `existingPosts` data already fetched. The `useMemo` just changes from `find` (first match) to `filter` (all matches), storing both count and best match.
- Badge uses existing `Badge` component with `bg-blue-500/10 text-blue-700 border-blue-200` styling for the info banner.
- No new database queries or mutations needed.

