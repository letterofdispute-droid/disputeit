
# Automated Quality Gate for Link Suggestions

## Problem Summary

Of the ~23k pending suggestions:
- **12,638** have anchor text that's just the beginning of the target article title (e.g., "Five Common Blunders When Addressing") -- poor SEO practice
- **11,013** have relevance scores below 60 -- too low to be useful
- **134** are self-links (article linking to itself)
- Many anchors are 5+ words long and read like truncated headlines rather than natural link phrases

You cannot review 23k items manually. The fix is a two-phase approach: (1) bulk-clean the bad ones now, (2) prevent them from being created in future scans.

## Phase 1: Database Cleanup (immediate)

Run a single migration that:

1. **Auto-reject self-links** (134 rows) -- set status to 'rejected'
2. **Auto-reject relevance below 55** (~11k rows) -- these are noise
3. **Auto-reject title-prefix anchors** (~12k rows) -- where the anchor text is just the start of the target title
4. After cleanup, the remaining pending suggestions should be around 3-5k high-quality ones that are actually worth the "Approve All >= 85%" button

## Phase 2: Stricter Quality Gates in Scan Function

### File: `supabase/functions/scan-for-semantic-links/index.ts`

**1. Raise minimum relevance threshold from current similarity_threshold to 55 at score level**

Add a filter after line 285 to skip suggestions with `relevance_score < 55`.

**2. Enforce anchor word count (2-6 words) at insert time**

After `selectAnchorText` returns, validate:
- Word count between 2 and 6
- Character length between 8 and 60
- Anchor is NOT a prefix of the target title (first N words matching = bad)
- If validation fails, skip this suggestion entirely rather than inserting bad data

**3. Explicitly exclude self-links**

Add a check in both forward and reverse processing to skip when `source.content_id === match.content_id` or `source.slug === match.slug`.

**4. Improve the title-segment fallback in `selectAnchorText`**

The current "last resort" logic at line 154-168 extracts title segments, which produces poor anchors. Change it to:
- If no quality anchor variant exists AND no primary keyword fits, return `null`
- When `selectAnchorText` returns null, skip that suggestion instead of inserting with a bad anchor
- This prevents the "title prefix as anchor" problem at the source

## What This Means For You

After Phase 1 runs, you'll have roughly 3-5k suggestions left that:
- Have relevance scores above 55
- Have proper 2-6 word anchor text (not truncated titles)
- Are not self-links

You can then use the existing "Approve >= 85%" button to auto-approve the best ~2-4k, and "Reject All" the rest. No manual review of 23k items needed.

## Technical Summary

| Change | Type | Impact |
|--------|------|--------|
| Auto-reject self-links, low relevance, title-prefix anchors | DB migration | Cleans ~18k bad suggestions immediately |
| Minimum relevance 55 filter at insert | Edge function | Prevents low-quality suggestions |
| Anchor validation (2-6 words, no title prefix) | Edge function | Prevents bad anchor text |
| Self-link exclusion | Edge function | Prevents self-referencing links |
| selectAnchorText returns null instead of title fallback | Edge function | Stops generating title-based anchors |
