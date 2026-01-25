

# Fix Contractors Templates Integration

## Problem Identified

The `contractorsTemplates.ts` file was created with 7 templates but was never integrated into `allTemplates.ts`. This means the Contractors category templates are not available in the application.

## Required Changes

### File: `src/data/allTemplates.ts`

**1. Add Import Statement (after line 13)**
```typescript
import { contractorsTemplates } from './templates/contractorsTemplates';
```

**2. Add Category Mapping (in `categoryIdToName` object)**
```typescript
'contractors': 'Contractors',
```

**3. Add Templates to Array (in `allTemplates` array)**
```typescript
...contractorsTemplates,
```

## Summary of Changes

| Location | Change |
|----------|--------|
| Line 14 (new) | Add import for `contractorsTemplates` |
| Line 28 (in mapping) | Add `'contractors': 'Contractors'` entry |
| Line 53 (in array) | Add `...contractorsTemplates` spread |

## Impact

After this fix:
- All 7 contractor templates will appear on the site
- The `/category/contractors` page will show templates
- Static HTML generation will include contractor letter pages
- Routes will be generated for all contractor template slugs

