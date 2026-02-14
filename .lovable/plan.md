

# Cleaner Step 1 UI with Smart State Communication

## Problem

After completing Step 1 (4626/4626 embeddings), the panel is cluttered and confusing:
- "Generate All" button is still prominent even though everything is done
- "4015 auto-queued from new articles" is unclear -- what are these? Why 4015?
- "Last job: 4626 processed, 1 failed" + Retry button coexists with the queue alert
- No guidance on what happens when you publish new articles

## Solution

Redesign Step 1 to show **contextual states** instead of dumping everything at once.

### State 1: All Done (current situation -- 4626/4626, no pending queue)
- Show a green success banner: "All 4,626 articles embedded"
- Replace "Generate All" with a subtle "Re-check" or hide it entirely
- Keep "Force Re-embed" as an advanced option only
- Add a note: "New articles are automatically queued when published"

### State 2: New Articles Pending (queue has items)
- Show an actionable alert: "12 new articles need embeddings" with a "Process Now" button
- Explain: "These were auto-queued when you published new articles"

### State 3: In Progress (job running)
- Keep current progress bar (no changes needed)

### State 4: Has Failures
- Show retry prompt with count

### Specific UI changes:

**When 100% complete and no pending queue:**
```
[checkmark] All 4,626 articles embedded
New articles are automatically queued when published.

[Force Re-embed]  (outline, small)
```

**When queue has pending items:**
```
[checkmark] 4,626 / 4,638 articles embedded
[info] 12 new articles ready to process  [Process Now]
These were auto-queued when you published new content.
```

**When job just completed with failures:**
```
[checkmark] 4,626 / 4,627 embedded (1 failed)
[Retry Failed]
```

## Technical Changes

**File: `src/components/admin/seo/links/SemanticScanPanel.tsx`**

- Add `isFullyComplete` computed flag: `embeddingProgress === 100 && !hasPendingQueue && activeJob?.status !== 'processing'`
- When fully complete: show green success state, hide "Generate All", show reassuring auto-queue message
- When pending queue exists: reword from "4015 auto-queued from new articles" to "X new articles ready to process" with clearer explanation underneath
- When job completed with failures: show inline retry, hide "Generate All"
- Move "Generate All" and "Force Re-embed" into the advanced settings section when fully complete (they become maintenance tools, not primary actions)
- Update button labels: "Generate All" becomes "Generate Missing" to clarify it only processes new/unembedded articles
- Add permanent footnote under Step 1: "New articles are automatically queued when published -- just come back and tap Process."

## Scope
- 1 file modified: `src/components/admin/seo/links/SemanticScanPanel.tsx`
- No backend or database changes

