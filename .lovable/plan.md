# Vary Pillar Titles and Fix Publish Ordering

## Problem

1. **Monotonous titles**: All 547 pillar articles use "The Complete Guide to {Topic}" -- looks spammy and unnatural for SEO.
2. **Publish ordering**: When articles are bulk-published, all pillars would appear first (or all together), creating an unnatural publication timeline. Pillars should appear just before their cluster articles.

## Solution

### 1. Varied Title Patterns

Introduce a set of 6-8 rotating title templates that are assigned based on a hash of the template slug (deterministic, so re-running produces the same title). Examples:


| Pattern                                    | Example                                                |
| ------------------------------------------ | ------------------------------------------------------ |
| The Complete Guide to {Topic}              | The Complete Guide to Bank Fee Disputes                |
| {Topic}: What You Need to Know             | Insurance Premium Disputes: What You Need to Know      |
| Understanding {Topic}: A Consumer's Guide  | Understanding Contractor No-Shows: A Consumer's Guide  |
| {Topic} Explained: Your Rights and Options | Sewerage Complaints Explained: Your Rights and Options |
| How to Handle {Topic}                      | How to Handle Electronics Malfunction                  |
| {Topic}: A Step-by-Step Guide              | Late Payment Removal: A Step-by-Step Guide             |


The pattern selection will use a simple hash of the slug modulo the number of patterns, ensuring consistent distribution.

### 2. Pillar Priority Reordering

Currently pillars have `priority: 200` (highest), so they get generated first. Instead, set pillar priority to **-1** (lowest), so cluster articles generate first and the pillar generates last for each template. This is better because:

- Pillars reference cluster articles in their content (the code at line 809 already fetches sibling clusters)
- When published chronologically, the pillar appears after its clusters -- acting as the hub that links them together

### Changes

**File: `src/components/admin/seo/TemplateCoverageMap.tsx**`

- Add a `getPillarTitle(name, slug)` function with 6+ title patterns
- Update the bulk "Create All Pillars" mutation to use varied titles and low priority
- Update keyword seeds to use cleaned name

**File: `supabase/functions/generate-content-plan/index.ts**`

- Update pillar item creation (lines 568-581) to use the same varied title patterns
- Change pillar priority from `200` to `-1`
- Apply `cleanTemplateName` to the title

**Database update (existing queued pillars)**

- Run an UPDATE on the 547 existing queued pillar items to:
  - Assign varied titles based on their template slug
  - Set priority to -1 so they generate after clusters

## Technical Details

```text
Title pattern selection:
  hash = simple string hash of template_slug
  patternIndex = hash % patterns.length
  title = patterns[patternIndex](cleanedName)
```

The same `cleanTemplateName` helper already exists and will be reused. The pattern function will be shared between the frontend component and the edge function (duplicated in both since they run in different environments).

## Scope

- 2 files modified (TemplateCoverageMap.tsx, generate-content-plan/index.ts)
- 1 database data update (rewrite existing queued pillar titles + priorities)
- No schema changes