

# Fix: Reset All Ghost "Applied" Suggestions (Take 3)

## The Root Cause

The previous two migrations used a flawed strategy: counting total `<a href=` tags in the HTML and assuming the oldest N "applied" suggestions matched those links. But those existing links are pre-existing content links -- they have nothing to do with our link suggestions system.

**Verified data:**
- Total "applied" suggestions: 8,740
- Suggestions where the anchor text actually appears as a link (`>anchor</a>`): 583
- Ghost suggestions (marked applied but link doesn't exist): 8,157

## The Fix

This time, the approach is definitive: check each "applied" suggestion individually to see if its specific anchor text exists as a clickable link in the source article's HTML. If not, reset it to "approved."

### Database Migration

```sql
-- Reset "applied" suggestions where the anchor text does NOT exist 
-- as a link in the source article's HTML content.
-- This is a direct verification: does ">anchor_text</a>" appear in the content?
UPDATE link_suggestions ls
SET status = 'approved', applied_at = NULL
FROM blog_posts bp
WHERE bp.id = ls.source_post_id
  AND ls.status = 'applied'
  AND bp.content NOT LIKE '%>' || ls.anchor_text || '</a>%';
```

This resets the 8,157 ghost suggestions back to "approved" and keeps only the 583 that are genuinely applied.

### Expected Result After Migration

- Applied: ~583 (only suggestions with verified links in the HTML)
- Approved: ~28,334 (20,177 current + 8,157 recovered)
- Rejected: 1,405 (unchanged)

### No Code Changes Needed

The `apply-links-bulk` edge function already has the race condition fixes from the previous edit. This is purely a data correction.

## After Implementation

1. Stats will show ~28k approved and ~583 applied
2. Run "Apply to Articles" to process the recovered suggestions
3. The existing error handling will prevent ghost applications going forward

## Files

- One database migration (SQL only)

