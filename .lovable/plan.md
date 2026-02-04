
# UK to US Market Focus: Site-Wide Content Correction

## ✅ COMPLETED - February 2026

All phases of the US market transition have been successfully implemented. The platform now prioritizes US consumers, American English, and US regulations.

## Problem Identified (Resolved)

The screenshot showed the Dispute Assistant saying: **"you still have rights under UK consumer law regarding 'reasonable time'"** - but you're targeting the **US market**.

After exploring the codebase, I found **UK-centric content throughout 80+ files**:

### Key Issues Found

1. **AI Context Files (Root Cause)** - `supabase/functions/_shared/siteContext.ts`
   - Tagline: "Professional dispute and complaint letter templates for **UK consumers**"
   - Describes platform as "UK-focused"
   - Blog writer context: "Write for **UK readers**", "Use **British English spelling**"
   - Dispute Assistant context: "helping **UK consumers**", "recommend consulting a **solicitor**"

2. **Jurisdiction Configuration** - All 43+ template files list UK as the **first** jurisdiction option (appearing as default)

3. **Legal References** - Heavy emphasis on UK laws:
   - Consumer Rights Act 2015 (UK)
   - Landlord and Tenant Act 1985 (UK)
   - Financial Ombudsman Service (UK)
   - Environmental Health (UK)
   - Trading Standards (UK)

4. **Terminology** - British spellings and terms:
   - "Postcode" instead of "ZIP code"
   - "Neighbour" instead of "Neighbor"
   - "colour" instead of "color"
   - "solicitor" instead of "attorney/lawyer"
   - "ombudsman" (UK-specific)

5. **Category Knowledge** - `src/data/categoryKnowledge.ts`:
   - UK regulatory bodies listed first
   - UK-specific escalation paths
   - References to UK acts and tribunals

6. **Jurisdiction Phrases** - `src/data/jurisdictionPhrases.ts`:
   - UK is first in the array (default selection)
   - UK-specific escalation paths throughout

---

## Solution

Make the site US-first while keeping international support:

### Phase 1: AI Context Updates (Immediate Impact) ✅ COMPLETED

**File: `supabase/functions/_shared/siteContext.ts`**

| Current | New | Status |
|---------|-----|--------|
| "UK consumers" | "American consumers" | ✅ Done |
| "UK-focused platform" | "US-focused platform" | ✅ Done |
| "British English spelling" | "American English spelling" | ✅ Done |
| "consult a solicitor" | "consult an attorney" | ✅ Done |
| "UK consumer rights focus" | "US consumer rights focus" | ✅ Done |
| UK regulations listed first | US regulations listed first | ✅ Done |

**Edge functions deployed:** `generate-blog-content`, `dispute-assistant`

### Phase 2: Jurisdiction Order Changes

**All 43+ template files** - Reorder jurisdictions array:
```text
Current: [UK, EU, US, INTL]
New:     [US, UK, EU, INTL]
```

This affects how default jurisdiction is selected.

### Phase 3: Terminology Updates ✅ COMPLETED

| British | American | Status |
|---------|----------|--------|
| Postcode | ZIP Code | ✅ Done |
| Neighbour | Neighbor | ✅ Done |
| colour | color | ✅ Done |
| favour | favor | ✅ Done |
| solicitor | attorney/lawyer | ✅ Done |
| ombudsman | state agency / commissioner | ✅ Done |

### Phase 4: Legal Reference Priority ✅ COMPLETED

Reordered legal references to prioritize US laws:

| Law/Regulation | Status |
|----------------|--------|
| FTC Act | ✅ Added to consumer categories |
| State Consumer Protection Laws | ✅ Primary reference |
| Magnuson-Moss Warranty Act | ✅ Added to Refunds/Warranty sections |
| Fair Credit Reporting Act (FCRA) | ✅ Already prioritized in Financial |
| Fair Debt Collection Practices Act (FDCPA) | ✅ Already prioritized in Financial |
| State Lemon Laws | ✅ Referenced in Vehicle category |
| Implied Warranty of Habitability | ✅ Moved to first position in Housing |

### Phase 5: Category Knowledge Updates ✅ COMPLETED

**File: `src/data/categoryKnowledge.ts`**

| Category | Changes |
|----------|---------|
| Travel | ✅ US DOT and FAA first in regulatoryBodies |
| Insurance | ✅ State Insurance Commissioner and NAIC first |
| Housing | ✅ Local Housing Authority and HUD first, US regulations prioritized |
| Utilities | ✅ FCC and State PUC added first |
| Employment | ✅ EEOC, DOL, NLRB first in regulatoryBodies |
| Contractors | ✅ US escalation paths (licensing board, BBB) |
| Refunds | ✅ Magnuson-Moss and State Consumer Protection Laws added |
| Financial | ✅ CFPB and FTC already first |

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/_shared/siteContext.ts` | Complete rewrite for US focus |
| `src/data/jurisdictionPhrases.ts` | Reorder US first, update terminology |
| `src/data/categoryKnowledge.ts` | US regulatory bodies first, US escalation paths |
| 43+ template files in `src/data/templates/` | Reorder jurisdiction arrays to US first |
| `src/data/templates/hoa/*` | Change "Neighbour" to "Neighbor" |
| Various vehicle templates | "Postcode" to "ZIP Code", "colour" to "color" |

---

## Technical Details

### siteContext.ts Changes

```typescript
// Before
tagline: 'Professional dispute and complaint letter templates for UK consumers',

// After
tagline: 'Professional dispute and complaint letter templates for US consumers',

// Before
- References to UK consumer rights law
- Use British English spelling (colour, favour, organise, etc.)
- Reference UK-specific regulations: Consumer Rights Act 2015...

// After
- References to US consumer protection law
- Use American English spelling (color, favor, organize, etc.)
- Reference US-specific regulations: FTC Act, Magnuson-Moss...
```

### Jurisdiction Array Reordering

Each template file currently has:
```typescript
const standardJurisdictions = [
  { code: 'UK', name: 'United Kingdom', ... },
  { code: 'EU', name: 'European Union', ... },
  { code: 'US', name: 'United States', ... },
  { code: 'INTL', name: 'International / Other', ... },
];
```

Will become:
```typescript
const standardJurisdictions = [
  { code: 'US', name: 'United States', ... },
  { code: 'UK', name: 'United Kingdom', ... },
  { code: 'EU', name: 'European Union', ... },
  { code: 'INTL', name: 'International / Other', ... },
];
```

---

## Why This Matters

1. **Dispute Assistant** will reference US law instead of UK law
2. **Default jurisdiction** on forms will be US
3. **Blog content** will be written for American readers
4. **Legal references** will prioritize US regulations
5. **Terminology** will use American spellings

---

## Scope

This update affected:
- 1 edge function context file (`siteContext.ts`)
- 2 core data files (`categoryKnowledge.ts`, `jurisdictionPhrases.ts`)
- 43+ template files (jurisdiction array reordering)
- 100+ individual text changes

---

## Summary of Changes

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | AI Context Updates (`siteContext.ts`) | ✅ Completed |
| Phase 2 | Jurisdiction Order Changes (US first) | ✅ Completed |
| Phase 3 | Terminology Updates (American English) | ✅ Completed |
| Phase 4 | Legal Reference Priority (US laws first) | ✅ Completed |
| Phase 5 | Category Knowledge Updates (US agencies) | ✅ Completed |

### Deployed Edge Functions
- `generate-blog-content` - Now writes for US readers with American English
- `dispute-assistant` - Now references US consumer law and recommends US escalation paths

### Impact
- Dispute Assistant references US law (FTC Act, State Consumer Protection Laws, etc.)
- Default jurisdiction on all templates is now US
- Blog content generated with American English spelling
- All regulatory bodies prioritize US agencies (FTC, CFPB, State AG, etc.)
