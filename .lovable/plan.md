

## Smarter "Add to Queue" → Campaign-Aware Actions

Currently each uncovered query only offers "Add single article." Instead, upgrade to three action tiers:

### New Action Buttons per Uncovered Query Card

1. **"Add Single Article"** (existing, keep as-is) — for low-volume queries not worth a full campaign.

2. **"Create Campaign"** (new) — opens a pre-filled version of `CustomCampaignDialog` with:
   - Campaign name = query text
   - Vertical = `suggestedVertical` from AI
   - Pillar title = `suggestedTitle`
   - 3 empty cluster rows for the user to fill (or AI-suggested clusters — see step 3)

3. **"Link to Existing Pillar"** (new, conditional) — before rendering, query `blog_posts` for published articles matching the same vertical/keyword. If matches exist, show a dropdown/button that lets the user pick an existing article as the pillar and creates cluster articles linked via `parent_queue_id`.

### Implementation Steps

1. **Add `suggestClusters` to `gsc-recommendations` edge function** — for each uncovered query, also return `suggestedClusters: Array<{title, articleType, keyword}>` (3-5 cluster ideas). This uses the same AI call, just expand the prompt schema.

2. **Create `CampaignFromQueryDialog.tsx`** — a lightweight dialog (reuses patterns from `CustomCampaignDialog`) that opens pre-filled with the pillar title, vertical, and AI-suggested clusters. User can edit/add/remove before submitting. On submit: creates `content_plan` + pillar queue item (priority 100) + cluster queue items with `parent_queue_id`.

3. **Add existing-pillar detection** — in `OpportunitiesTab`, run a single query on mount: `supabase.from('blog_posts').select('id, title, slug, category_id').eq('status', 'published')` filtered by relevant verticals. For each uncovered query, check if any published article's title/keywords overlap. If a match exists, show "Attach to existing: [Article Title]" as a third button that creates cluster items linked to that article.

4. **Update `OpportunitiesTab.tsx`** button layout — replace current two-button row with three options:
   - `+ Add Single` (outline, secondary)
   - `🚀 Create Campaign` (primary, prominent)
   - `🔗 Link to "[Existing Article]"` (conditional, shown only when match found)

### Files to Create/Edit

- **Create** `src/components/admin/seo/gsc/CampaignFromQueryDialog.tsx` — pre-filled campaign dialog
- **Edit** `src/components/admin/seo/gsc/OpportunitiesTab.tsx` — add campaign button, existing-pillar matching, new dialog trigger
- **Edit** `src/components/admin/seo/gsc/types.ts` — add `suggestedClusters` to uncovered query type
- **Edit** `supabase/functions/gsc-recommendations/index.ts` — expand AI prompt to include cluster suggestions per uncovered query
- **Edit** `src/components/admin/seo/gsc/useGscActions.ts` — add `createCampaign` mutation (plan + pillar + clusters insert)

