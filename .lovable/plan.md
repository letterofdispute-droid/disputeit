

# Fix Broken Links: Root Cause Analysis and Comprehensive Repair

## What Actually Happened

After investigating the database, here's the real picture:

1. **The old pattern fixer works** -- it already converted most `/blog/`, `/category/`, and bare-slug URLs. Running it again on the first 200 posts now shows 0 issues.

2. **The 831 "unfixable" from the screenshot were from the previous run.** When the scanner found a `/blog/slug` that didn't match any real article, it BOTH marked it "unfixable" AND rewrote it to a guessed path (`/articles/{category}/{slug}`). This created new broken links pointing to non-existent articles.

3. **The real remaining problem is 135 orphan slugs across ~3,375 posts.** These are internal links (already in `/articles/category/slug` format) that point to articles that simply don't exist -- they were hallucinated by the AI content generator. The current scanner completely ignores these because they already have the "correct" URL format.

4. **74 posts still have old `/blog/` or absolute URLs** that need the original pattern fix.

### Current state summary:
| Issue | Count |
|-------|-------|
| Posts with old `/blog/` or absolute URLs still remaining | 74 |
| Unique orphan slugs (articles that don't exist) | 135 |
| Posts containing at least one orphan link | ~3,375 |

## Plan

### 1. Edge Function: Add Orphan Link Detection and Repair

Add a **new Pattern 10** to `fix-broken-links/index.ts` that:
- Validates every `/articles/category/slug` link against the `slugToCategory` lookup map
- If the target slug doesn't exist: attempt fuzzy matching (prefix match, contains match)
- If no fuzzy match: **strip the `<a>` tag but keep the visible text** (so the content reads normally but the dead link is removed)
- Count these as "fixed" not "unfixable"

Also fix Pattern 1: stop rewriting unfixable `/blog/slug` to a guessed path. Instead, strip the `<a>` tag.

### 2. Edge Function: Stop Creating False "Unfixable" Entries

- Pattern 1 currently marks a link as unfixable but ALSO rewrites it. Change: if no match found, strip the `<a>` tag entirely and count as "fixed"
- Remove the concept of "unfixable" from the scanner -- every broken link should either be fixed to a valid destination or have its `<a>` tag stripped

### 3. UI: Simplify the Scanner Display

Update `BrokenLinkScanner.tsx`:
- Remove the "Unfixable" stat (since everything will now be fixed)
- Replace with a "Stripped" count (links where the `<a>` was removed because no valid target exists)
- Show 4 stats instead of 5: Scanned, Issues, Fixed (rewritten), Stripped (tag removed)

## Technical Details

### Edge Function Changes (`supabase/functions/fix-broken-links/index.ts`)

**Pattern 1 fix** (line 136-137): Replace fallback rewrite with tag stripping:
```javascript
// Before (creates new broken link):
unfixable.push({ url: `/blog/${slug}`, reason: 'No matching article found' });
return `href="/articles/${post.category_slug}/${slug}"`;

// After (strips the dead link):
fixCount++;
return null; // signal to strip <a> tag
```

**New Pattern 10**: Validate all existing `/articles/` links:
```javascript
// Check every href="/articles/cat/slug" link
// If slug doesn't exist in slugToCategory map:
//   1. Try fuzzy match -> rewrite to correct slug
//   2. No match -> strip <a> tag, keep text
```

The tag stripping will use a regex that captures `<a href="...">TEXT</a>` and replaces with just `TEXT`.

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/fix-broken-links/index.ts` | Add orphan link validation (Pattern 10), fix Pattern 1 fallback, strip dead links instead of rewriting to guessed paths |
| `src/components/admin/seo/BrokenLinkScanner.tsx` | Replace "Unfixable" with "Stripped" stat, simplify display |

