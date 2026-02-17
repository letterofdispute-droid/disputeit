

# Fix Keyword Import: Add Missing Sheet Mappings + Server-Side Stats

## What's Wrong

1. **2 verticals missing**: Your tabs `vehicleAndauto` and likely `consumerRights` don't match any entry in the sheet name map, so those keywords are silently skipped during import.

2. **Incorrect keyword counts in UI**: The stats query fetches all rows client-side but hits a 1,000-row database limit, showing wrong numbers for your 4,527 keywords.

## What Changes

### 1. Update sheet name map in `KeywordManager.tsx`

Add all the exact tab names from your new file:

| Tab Name | Maps To |
|---|---|
| `vehicleAndauto` | `vehicle` |
| `consumerRights` | `consumer-rights` |
| `HOA` (case-sensitive) | `hoa` |
| `Travel` (case-sensitive) | `travel` |
| `Refunds` (case-sensitive) | `refunds` |

The existing lowercase entries stay for backward compatibility.

### 2. Create `get_keyword_stats()` database function

A server-side SQL function that counts keywords per vertical directly in the database (no row limit). Returns `vertical, total, seeds, used, unused` for each vertical.

### 3. Update `useKeywordTargets.ts` hook

Replace the current `.from('keyword_targets').select(...)` approach with a single `.rpc('get_keyword_stats')` call.

## After the Fix

1. Re-upload your new XLSX file using the "Upload XLSX" button in the Keywords tab
2. All 13 verticals will import correctly with accurate counts
3. Click "Plan All Keywords" to start AI clustering

## Files Changed

- **New migration**: `get_keyword_stats()` SQL function
- **Modified**: `src/components/admin/seo/KeywordManager.tsx` -- expanded sheet name map
- **Modified**: `src/hooks/useKeywordTargets.ts` -- use RPC instead of client-side aggregation

