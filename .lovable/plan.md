

# Backend & Dashboard Sync Audit Results

## Overall Status: One Real Gap Found

After reviewing the admin dashboard, SEO metrics pipeline, link counting system, template coverage data, and frontend console/network logs, everything is aligned **except for one functional gap** you specifically called out.

## What's In Sync (Verified)

| System | Status |
|---|---|
| `templateCategories.ts` counts vs `siteContext.ts` CATEGORIES | MATCH (all 14 categories identical) |
| `useSEOMetrics` hook via `get_seo_metrics` RPC | Working (200 responses, no errors) |
| `get_template_progress` RPC | Working (returns accurate generated/total per template) |
| Admin Dashboard stats (letters, users, views) | Working via direct queries |
| Network requests | All 200s, no failures |
| Console errors | One harmless React ref warning in AlertDialogContent (Radix library issue, cosmetic) |

## The Gap: Link Counts Do NOT Auto-Update on Manual Edits

You said you expect link counts to update each time you add a link in any page or post. **Currently, they don't.**

Here's how it works today:

1. **Automated link insertion** (`apply-links-bulk` edge function): Calls `increment_link_counters` per link -- counts update correctly.
2. **Manual editing** (AdminBlogEditor `handleSave`): Saves the post content directly to `blog_posts` table. **No link count reconciliation runs.** The `inbound_count` and `outbound_count` in `article_embeddings` go stale.
3. **Manual fix**: You must go to the SEO dashboard Links tab and click "Sync Counters" (which calls `reconcile_link_counts` RPC) to re-sync.

### The Fix

Add an automatic call to `reconcile_link_counts` after every blog post save in `AdminBlogEditor.tsx`. When a post is saved (create or update), the system should fire a background reconciliation so link counts stay accurate without manual intervention.

**File: `src/pages/admin/AdminBlogEditor.tsx`**
- After the successful `.update()` or `.insert()` call, fire `supabase.rpc('reconcile_link_counts')` as a fire-and-forget background call
- This runs the full HTML regex scan across all published posts and updates `article_embeddings.inbound_count` and `outbound_count`
- No UI blocking needed -- it runs silently in the background

### Performance Note

The `reconcile_link_counts` function has a 120-second timeout and scans all published posts. For the current content volume this is fine. If the blog grows to thousands of posts, a targeted single-post reconciliation function would be more efficient, but that's a future optimization.

## Summary

| Item | Status | Action |
|---|---|---|
| Template counts (UI vs AI context) | In sync | None |
| SEO metrics RPC | Working | None |
| Dashboard stats | Working | None |
| Link counts auto-update on manual edit | **BROKEN** | Add auto-reconcile after blog post save |
| Console errors | 1 cosmetic Radix warning | None (library issue) |
| Network errors | None | None |

### Scope
- 1 file changed: `src/pages/admin/AdminBlogEditor.tsx`
- Add ~5 lines after the save success block

