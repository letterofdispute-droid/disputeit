

# Fix: Handle Duplicate URL Suggestions Correctly

## Root Cause (Confirmed)

The rejected suggestions are NOT failing because of missing fallback logic. They are failing because **the links are already present in the article content**.

- 4,932 out of 5,115 currently approved suggestions already have their target URL in the source article
- This happened because we kept resetting rejected suggestions back to "approved", but the links from those suggestions were already successfully applied to the articles in previous runs
- The duplicate URL check (`content.includes(href="${targetUrl}")`) correctly detects this and returns `null`, which then gets marked as "rejected"

In other words: these links were already applied -- the suggestions just had the wrong status.

## Fix (Two Parts)

### 1. Update the edge function to mark duplicates as "applied" instead of "rejected"

When a URL already exists in the article, the link IS there -- so the suggestion should be marked as `applied` (not rejected). Change `insertLinkContextually` to return a special sentinel value (e.g., `'ALREADY_EXISTS'`) when the URL is already present, and update `processBatch` to set status to `applied` for those cases.

**Changes to `supabase/functions/apply-links-bulk/index.ts`:**

- `insertLinkContextually`: Return `'ALREADY_EXISTS'` string instead of `null` when the duplicate URL check triggers
- `processBatch`: Check for the `'ALREADY_EXISTS'` return value and mark the suggestion as `applied` with `applied_at` timestamp, instead of `rejected`

### 2. Clean up existing data: flip the 654 "Could not find suitable insertion point" rejections

Run a SQL update to mark the currently rejected duplicate-URL suggestions as `applied`, since those links are already in the articles:

```sql
-- Mark suggestions as 'applied' where the link already exists in the article
UPDATE link_suggestions ls
SET status = 'applied', applied_at = NOW(), hierarchy_violation = NULL
FROM blog_posts bp
WHERE ls.source_post_id = bp.id
  AND ls.status IN ('rejected', 'approved')
  AND (
    bp.content LIKE '%/templates/' || ls.target_slug || '"%'
    OR bp.content LIKE '%/articles/%/' || ls.target_slug || '"%'
    OR bp.content LIKE '%/guides/' || ls.target_slug || '"%'
  );
```

## Technical Details

**Edge function change (lines ~307-310 in `insertLinkContextually`):**

```typescript
// Before:
if (content.includes(`href="${targetUrl}"`)) {
  console.log(`[INSERT] Suggestion ${suggestion.id}: duplicate URL, skipping`);
  return null;
}

// After:
if (content.includes(`href="${targetUrl}"`)) {
  console.log(`[INSERT] Suggestion ${suggestion.id}: URL already in article, marking as applied`);
  return 'ALREADY_EXISTS';
}
```

**Processing change (lines ~523-545 in `processBatch`):**

```typescript
if (result === 'ALREADY_EXISTS') {
  // Link already in article - mark as applied
  await supabaseAdmin
    .from('link_suggestions')
    .update({ status: 'applied', applied_at: new Date().toISOString() })
    .eq('id', suggestion.id);
  appliedCount++;
} else if (result) {
  // New link inserted
  updatedContent = result;
  // ... existing save logic ...
} else {
  // Could not insert
  // ... existing rejection logic ...
}
```

## Expected Outcome

- The ~4,932 duplicate suggestions will be correctly marked as "applied"
- The remaining ~183 genuinely new suggestions will be processed normally (phrase-match, AI, or fallback)
- Future runs will not create this loop of reset-then-reject
- The stats will accurately reflect reality

