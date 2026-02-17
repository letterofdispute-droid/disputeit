

# Overhaul: Smart Keyword Clustering + Pillar/Cluster Linking Strategy

## The Real Problem

The current `plan-from-keywords` function treats keywords 1:1 with articles. Each seed becomes one pillar, and each variation that the AI picks becomes one cluster article. This is wasteful and naive:

- **Contractors** has 246 unused variation keywords across 5 groups. The "contractor bad work" group alone has 61 unused keywords like "can i sue a contractor for bad work", "how to sue contractor for bad work", "suing contractor for bad work" -- these are all the SAME intent and should be ONE article targeting all three.
- The AI is told "create 3-6 clusters per pillar" but each cluster only consumes 1 keyword. So from 246 keywords, only ~25 get used.
- There is no pillar/cluster role stored -- `article_type` says "pillar" but the generation pipeline doesn't differentiate pillar content from cluster content (no hub-and-spoke linking instructions).

## The Fix: 3 Parts

### Part 1: Rewrite the AI Planning Prompt (Edge Function)

**File: `supabase/functions/plan-from-keywords/index.ts`**

Replace the entire `processOneVertical` function with a smarter approach:

**New Strategy:**
1. Fetch ALL unused keywords for the vertical (seeds + variations), grouped by `column_group`
2. Send each column_group's keywords to the AI with a new prompt that says:
   - "Here are 61 keywords. Group them by SEARCH INTENT into logical article topics."
   - "Each group becomes one article. Assign 3-8 keywords as secondary_keywords per article."
   - "Designate ONE article per column_group as the PILLAR (broadest topic). All others are CLUSTERS."
   - "Each cluster must reference which pillar it belongs to."
3. This way, 61 keywords for "contractor bad work" might produce 8-12 articles (not 1), each targeting 5-8 keywords simultaneously.

**New AI prompt structure:**
```
You are an SEO content strategist. Given these keywords for the 
"{column_group}" topic in the "{vertical}" vertical, create a 
content cluster.

KEYWORDS (group by search intent into articles):
{all 61 keywords listed}

RULES:
1. Group keywords by SEARCH INTENT -- keywords asking the same 
   question in different ways belong to the SAME article
2. Create one PILLAR article (broadest, most comprehensive topic) 
   and multiple CLUSTER articles (specific sub-topics)
3. Each article should target 3-8 keywords (primary + secondaries)
4. Every keyword must be assigned to exactly one article
5. Clusters must link UP to the pillar. Pillar links DOWN to clusters.
6. Article types: how-to, mistakes, rights, sample, faq, case-study, 
   comparison, checklist
7. Pillar should be "how-to" or "rights" type (comprehensive)

Output JSON:
{
  "pillar": {
    "title": "...",
    "article_type": "how-to",
    "primary_keyword": "the broadest keyword",
    "secondary_keywords": ["kw1", "kw2", ...],
    "all_targeted_keywords": ["every keyword this article targets"],
    "meta_title": "under 60 chars",
    "meta_description": "under 160 chars"
  },
  "clusters": [
    {
      "title": "...",
      "article_type": "faq",
      "primary_keyword": "most specific keyword",
      "secondary_keywords": ["kw1", "kw2"],
      "all_targeted_keywords": ["every keyword"],
      "meta_title": "...",
      "meta_description": "...",
      "link_to_pillar_anchor": "suggested anchor text for link to pillar"
    }
  ]
}
```

**Batching for large groups:** Column groups with 100+ keywords will be split into chunks of 50 and processed in multiple AI calls to stay within token limits. Each chunk produces its own clusters, all linking to the same pillar.

**Keyword marking:** Every keyword in `all_targeted_keywords` gets marked as `used_in_queue_id`, ensuring full utilization.

### Part 2: Store Pillar/Cluster Relationship in Queue

**Database migration:**
- Add `parent_queue_id` column to `content_queue` table -- clusters reference their pillar's queue item ID
- Add `pillar_link_anchor` column to `content_queue` -- the suggested anchor text for linking cluster -> pillar

This creates an explicit hierarchy:
```
content_queue (pillar, id=abc)
  |-- content_queue (cluster, parent_queue_id=abc, pillar_link_anchor="contractor bad work guide")
  |-- content_queue (cluster, parent_queue_id=abc, pillar_link_anchor="suing contractors")
  |-- content_queue (cluster, parent_queue_id=abc, pillar_link_anchor="contractor bad work guide")
```

### Part 3: Update Generation to Use Linking Strategy

**File: `supabase/functions/bulk-generate-articles/index.ts`**

When generating a cluster article, the system will:
1. Look up its `parent_queue_id` to find the pillar
2. If the pillar is already generated (has a `blog_post_id`), include a linking instruction in the generation prompt:
   - "Include a contextual link to [Pillar Title] using anchor text '[pillar_link_anchor]' at URL /articles/{category}/{pillar-slug}"
3. If the pillar hasn't been generated yet, store the link instruction for post-generation application

When generating a pillar article, include:
- "This is a comprehensive PILLAR article. It should reference and link to these related sub-topics: [list of cluster titles + URLs if available]"

## Expected Results

| Vertical | Unused Keywords | Current Articles | Expected Articles | Keywords Used |
|---|---|---|---|---|
| contractors | 246 | 0 | 40-50 | 246 (100%) |
| housing | 402 | 0 | 60-80 | 402 (100%) |
| insurance | 402 | 0 | 60-80 | 402 (100%) |
| healthcare | 344 | 0 | 50-70 | 344 (100%) |
| employment | 269 | 0 | 40-55 | 269 (100%) |
| financial | 471 | 34 queued | 70-95 | 471 (100%) |
| travel | 394 | 0 | 55-75 | 394 (100%) |
| vehicle | 322 | 0 | 45-65 | 322 (100%) |
| utilities | 320 | 0 | 45-65 | 320 (100%) |
| ... | ... | ... | ... | ... |
| **Total** | **3,931** | **341** | **~800-1,200** | **3,931 (100%)** |

## Files Changed

- **Modified:** `supabase/functions/plan-from-keywords/index.ts` -- Complete rewrite of `processOneVertical` with intent-grouping AI prompt, per-column_group processing, keyword batching for large groups
- **New migration:** Add `parent_queue_id` (uuid, nullable, FK to content_queue.id) and `pillar_link_anchor` (text, nullable) columns to `content_queue`
- **Modified:** `supabase/functions/bulk-generate-articles/index.ts` -- Add pillar/cluster linking instructions to the generation prompt, look up parent pillar data when generating clusters
- **Modified:** `src/components/admin/seo/queue/QueueTable.tsx` -- Show pillar/cluster badge with linking indicator (cluster shows which pillar it links to)

## Processing Flow

1. Click "Plan All Keywords"
2. For each vertical, process each column_group separately:
   - Fetch all unused keywords in that group
   - Send to AI: "Group these by search intent, designate pillar + clusters"
   - AI returns ~8-15 articles per group, each targeting 3-8 keywords
   - Create content_plan + queue items with parent_queue_id linking
   - Mark ALL keywords as used
3. Queue shows ~800-1,200 articles with clear pillar/cluster hierarchy
4. Generation includes cross-linking instructions automatically

