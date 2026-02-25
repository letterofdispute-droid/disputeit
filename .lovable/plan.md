

# Sixth-Pass Audit: Final 20 Discrepancies Found

## Why Issues Keep Appearing

Every previous pass focused on a different layer of the template system, each time missing the next layer:

- Passes 1-2: Fixed Financial, Vehicle, Mortgage subcategory templates
- Pass 3: Fixed slug name mismatches across those categories
- Pass 4: Fixed E-commerce slugs
- Pass 5: Added subdirectory templates for 10 remaining categories

The pattern: each pass handled the **subdirectory** template files but never verified the **core** template files (e.g., `insuranceTemplates.ts`, `housingTemplates.ts`, `hoaTemplates.ts`). These core files define templates directly AND import from subdirectories. The directly-defined core templates were never cross-referenced.

This sixth pass is the final one because I have now exhaustively read every single template source file -- both core and subdirectory -- for all 14 categories.

---

## Finding 1: 15 Missing Slugs (templates exist, not in siteContext whitelist)

### Insurance Core (4 missing)
From `src/data/templates/insuranceTemplates.ts` -- these are the 4 core templates defined directly in the file before subdirectory imports:

| Missing slug | Source |
|---|---|
| `insurance-claim-denial-appeal` | insuranceTemplates.ts (core) |
| `insurance-claim-underpayment` | insuranceTemplates.ts (core) |
| `insurance-claim-delay` | insuranceTemplates.ts (core) |
| `insurance-cancellation-refund` | insuranceTemplates.ts (core) |

### Insurance Business (3 missing)
From `src/data/templates/insurance/travelPetBusinessTemplates.ts` -- these are at the end of the file, after the travel/pet templates that were correctly listed:

| Missing slug | Source |
|---|---|
| `employers-liability-claim` | travelPetBusinessTemplates.ts |
| `cyber-insurance-claim` | travelPetBusinessTemplates.ts |
| `directors-officers-claim` | travelPetBusinessTemplates.ts |

### Housing Core (5 missing)
From `src/data/templates/housingTemplates.ts` -- the 6 core templates. One (`deposit-deduction-dispute`) is already listed, but 5 are not:

| Missing slug | Source |
|---|---|
| `landlord-repairs-general` | housingTemplates.ts (core) |
| `landlord-heating-complaint` | housingTemplates.ts (core) |
| `deposit-return-request` | housingTemplates.ts (core) |
| `rent-increase-dispute` | housingTemplates.ts (core) |
| `landlord-harassment-complaint` | housingTemplates.ts (core) |

### HOA Core + Fee Disputes (3 missing)
From `src/data/templates/hoaTemplates.ts` (core) and `hoa/feeDisputeTemplates.ts`:

| Missing slug | Source |
|---|---|
| `hoa-complaint-letter` | hoaTemplates.ts (core) |
| `hoa-architectural-request` | hoaTemplates.ts (core) |
| `hoa-audit-request` | hoa/feeDisputeTemplates.ts |

---

## Finding 2: 5 Hallucinated/Wrong Slugs in siteContext

| siteContext slug (WRONG) | Issue | Fix |
|---|---|---|
| `hoa-fee-dispute` (line 356) | No template exists with this slug | Remove |
| `hoa-rule-violation-appeal` (line 360) | No template; `hoa-violation-appeal` already listed | Remove (duplicate) |
| `hoa-maintenance-request` (line 368) | No template exists with this slug | Remove |
| `hoa-neighbor-noise-complaint` (line 372) | No template; `neighbor-noise-complaint` already listed | Remove (duplicate) |
| `subscription-cancellation-refund` in refunds (line 134) | Template belongs to E-commerce, not Refunds; already listed under ecommerce | Remove from refunds section |

---

## Implementation Plan

### File: `supabase/functions/_shared/siteContext.ts`

1. **Insurance section (lines 257-279)**: Add 7 missing slugs:
   - Add core templates: `insurance-claim-denial-appeal`, `insurance-claim-underpayment`, `insurance-claim-delay`, `insurance-cancellation-refund`
   - Add business templates: `employers-liability-claim`, `cyber-insurance-claim`, `directors-officers-claim`

2. **Housing section (lines 177-196)**: Add 5 missing core slugs:
   - `landlord-repairs-general`, `landlord-heating-complaint`, `deposit-return-request`, `rent-increase-dispute`, `landlord-harassment-complaint`

3. **HOA section (lines 354-374)**: Add 3 missing slugs and remove 4 hallucinated:
   - Add: `hoa-complaint-letter`, `hoa-architectural-request`, `hoa-audit-request`
   - Remove: `hoa-fee-dispute`, `hoa-rule-violation-appeal`, `hoa-maintenance-request`, `hoa-neighbor-noise-complaint`

4. **Refunds section (line 134)**: Remove `subscription-cancellation-refund` (belongs in ecommerce, already listed there)

### Why This Is the Last Pass

This is the first time every single template source file has been exhaustively read -- both the root-level core files (`insuranceTemplates.ts`, `housingTemplates.ts`, `hoaTemplates.ts`, etc.) AND every subdirectory file. Previous passes always missed one layer or the other. The total fix count is small (20 items), confirming convergence.

### Summary

| Action | Count |
|---|---|
| Missing slugs to add | 15 |
| Hallucinated slugs to remove | 5 |
| **Total fixes** | **20** |
| Files changed | 1 (`siteContext.ts`) |

