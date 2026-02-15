

# AI-Powered Smart Link Discovery (Article-by-Article)

## What Changes

Replace the current "vector match then pick from anchor variants" approach with an AI-driven per-article analysis. The AI reads each article's actual HTML content and finds natural phrases that can become anchor text for links to related articles. The embeddings are still used to narrow down *which* articles are good link targets, but the AI decides *where* in the content to link and *what phrase* to use.

## How It Works

### Step 1: Find Related Articles (keep existing vector matching)
For each source article, use the existing `match_semantic_links` RPC to get the top 15-20 semantically related articles. This narrows the field efficiently without AI calls.

### Step 2: AI Reads the Article Content (NEW)
Send the article's actual content (stripped of HTML, excluding H2/H3 headings and intro/conclusion paragraphs) plus the list of candidate targets to AI (Gemini 2.5 Flash). The AI:

- Reads the full article text
- Identifies 7-10 natural phrases (2-6 words) that already exist in the body text
- Maps each phrase to the most relevant target article
- Ensures links are distributed across different sections (not clustered)
- Prioritizes linking cluster articles to their pillar article
- Prioritizes linking to the related template when relevant
- Rejects any phrase that is an H2, H3, part of the title, or in the first paragraph

### Step 3: Validate and Store
Each AI suggestion is validated:
- Anchor phrase actually exists in the article body (not in headings/intro)
- Word count 2-6, character length 8-60
- No duplicate targets
- Not a self-link
- Respects outbound cap (7-10 per article)

## New Edge Function: `scan-for-smart-links`

A new function (separate from the existing `scan-for-semantic-links`) that processes one article at a time with full AI analysis. The existing function stays as-is for backward compatibility.

### AI Prompt Structure

```text
System: You are an internal linking specialist. Analyze this article 
and find 7-10 natural phrases in the body text that could become 
anchor text linking to the target articles listed below.

Rules:
1. Each anchor MUST be an exact phrase (2-6 words) that already 
   exists in the article body text
2. NEVER use text from H2, H3 headings or the first paragraph
3. Distribute links across different sections of the article
4. Cluster articles MUST link to their pillar article (marked below)
5. Include 1 link to the related template if one exists
6. Each target can only be linked once
7. Prefer phrases that naturally relate to the target topic
8. Anchors must NOT be the target's title or a prefix of it

Article Title: "..."
Article Role: cluster | pillar
Category: insurance
Pillar Article: "..." (slug: ...)

--- ARTICLE BODY (sections) ---
[Section after H2: "Understanding Your Rights"]
paragraph text here...

[Section after H2: "Steps to Take"]
paragraph text here...

--- CANDIDATE TARGETS ---
1. [pillar] "Complete Guide to Insurance Claims" (slug: ...)
2. [template] "Insurance Claim Dispute Letter" (slug: ...)
3. [article] "Common Mistakes in Filing Claims" (slug: ...)
...

Return JSON array:
[
  {
    "anchor_text": "exact phrase from body",
    "target_index": 1,
    "section_heading": "Understanding Your Rights",
    "reasoning": "why this phrase relates to the target"
  }
]
```

### Processing Flow

```text
For each article:
  1. Fetch article content + metadata from blog_posts
  2. Parse content into sections (split by H2/H3)
  3. Identify pillar article for this cluster (from content_plans)
  4. Get top 15 semantic matches via match_semantic_links RPC
  5. Build the AI prompt with sections + candidates
  6. Call Gemini 2.5 Flash
  7. Validate each suggestion:
     - Verify anchor_text exists in body (not in headings)
     - Check word/char limits
     - Check not a title prefix
  8. Insert validated suggestions into link_suggestions table
  9. Self-chain to next article
```

### Batching and Self-Chaining

- Process 3 articles per invocation (AI calls are heavier than vector matching)
- Self-chain pattern identical to existing scan function
- Job tracking via `semantic_scan_jobs` table (reuse existing)
- pg_cron recovery works the same way
- Each AI call processes ~2000 words of article content + 15 targets

### Hierarchy Rules Enforced by AI

| Source Role | Required Links | Optional Links |
|------------|---------------|----------------|
| Cluster | 1 to its pillar, 1 to template | 5-8 to related articles |
| Pillar | 1 to template, 1-2 to category guide | 5-7 to cluster articles |
| Super-pillar | 1-2 to templates | 6-8 to pillars and articles |

## UI Changes

### File: `src/components/admin/seo/links/SemanticScanPanel.tsx`

Add a toggle or separate button: "Smart Scan (AI)" vs the existing "Vector Scan". The smart scan calls the new `scan-for-smart-links` function instead.

### File: `src/hooks/useSemanticLinkScan.ts`

Add a new mutation `smartScan` that calls `scan-for-smart-links`. Reuse the same job polling and progress tracking.

## Why This Is Better

| Current Approach | New Approach |
|-----------------|-------------|
| Picks anchor from pre-generated variants | Finds real phrases in actual article text |
| Anchor often doesn't exist in content | Anchor is guaranteed to exist in body |
| No awareness of article structure | Skips headings, intro, conclusion |
| Random distribution | AI distributes across sections |
| No hierarchy awareness | Enforces pillar/cluster linking rules |
| ~5 links per article | 7-10 links per article |

## Cost Estimate

- ~3,662 articles at 1 AI call each
- Using Gemini 2.5 Flash (fast, cost-effective)
- ~2000 tokens input + ~500 tokens output per call
- Total: ~9M tokens input, ~1.8M output
- Can be run in batches (e.g., one category at a time)

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/scan-for-smart-links/index.ts` | New edge function for AI-powered per-article scanning |
| `supabase/config.toml` | Add `scan-for-smart-links` function config |
| `src/hooks/useSemanticLinkScan.ts` | Add `smartScan` mutation |
| `src/components/admin/seo/links/SemanticScanPanel.tsx` | Add "Smart Scan" button |

