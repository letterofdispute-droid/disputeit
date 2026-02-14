
# Improve Pillar Title Generation

## Problem

Pillar titles are generated verbatim from `template_name`, producing awkward titles like:
- "The Complete Guide to Contractor No-Show/Abandonment Letter"
- "The Complete Guide to Defective Product Return Letter"

## Solution

Add a `cleanTemplateName` helper function that:
1. Strips common suffixes: "Letter", "Complaint", "Dispute", "Template"
2. Removes trailing slashes and cleans up punctuation artifacts
3. Produces natural titles like "The Complete Guide to Contractor No-Shows"

## Changes

**File: `src/components/admin/seo/TemplateCoverageMap.tsx`**

Add a helper function before the component:

```typescript
function cleanTemplateName(name: string): string {
  return name
    .replace(/\s*(Letter|Complaint Letter|Dispute Letter|Template)\s*$/i, '')
    .replace(/\/+$/, '')
    .trim();
}
```

Update line 80 to use it:

```typescript
suggested_title: `The Complete Guide to ${cleanTemplateName(plan.template_name)}`,
```

Also update the keyword seeds (lines 82-83) to use the cleaned name:

```typescript
suggested_keywords: [
  cleanTemplateName(plan.template_name).toLowerCase(),
  `${cleanTemplateName(plan.template_name).toLowerCase()} guide`,
  'consumer rights',
  'dispute letter',
],
```

## Examples

| Before | After |
|--------|-------|
| The Complete Guide to Contractor No-Show/Abandonment Letter | The Complete Guide to Contractor No-Show/Abandonment |
| The Complete Guide to Defective Product Return Letter | The Complete Guide to Defective Product Return |
| The Complete Guide to Bank Fee Dispute Letter | The Complete Guide to Bank Fee Dispute |
| The Complete Guide to HOA Fine Complaint Letter | The Complete Guide to HOA Fine |

## Scope

- 1 file modified
- No database changes
