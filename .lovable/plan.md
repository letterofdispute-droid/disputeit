

# Fix Letter Generation Flow & Add AI Legal Expert Feature

## Issues Identified

After a thorough analysis of the codebase, database, and logs, I've identified **three primary issues** plus a **new feature request**:

---

## Issue 1: Evidence Photos Not Embedded in PDF

**Root Cause:** The photos are being uploaded by the user, but the data is NOT reaching the Edge Functions.

Looking at the database:
```
evidence_photos: []  (empty for all recent purchases)
```

The **upload happens at the wrong time**. Currently in `LetterGenerator.tsx`:
1. User clicks "Generate Letter"
2. Photos are uploaded (`uploadAllPhotos`)
3. AI generates letter content
4. Overlay closes -> Pricing modal opens
5. User clicks "Buy" -> `create-letter-checkout` called

**Problem**: The uploaded photos are stored in the `evidenceUpload.photos` state array with `storagePath` set after upload. But in `PricingModal`, the filter `p.uploaded && p.storagePath` might not have the storagePath populated because:

1. `uploadAllPhotos` updates the React state, but state updates are async
2. The `PricingModal` receives `evidencePhotoPaths` prop at render time
3. By the time the modal renders, the state might not reflect the uploaded paths

**Also**: When the overlay completes and pricing modal opens, the evidence paths might be stale because `evidenceUpload.photos` hasn't been re-read.

**Fix**: 
1. Store the uploaded photo paths in a ref or return them from `uploadAllPhotos` 
2. Pass them directly to the pricing modal instead of re-reading from state

---

## Issue 2: Download Button Shows "No File"

**Root Cause:** After recent changes, `generate-letter-documents` stores the path (e.g., `254b966a.../letter.pdf`) in `pdf_url`, which is correct. However, looking at `verify-letter-purchase`:

Lines 58-72 show it returns the **stored path** directly when status is already "completed":
```typescript
if (purchase.status === "completed" && purchase.pdf_url) {
  return { pdfUrl: purchase.pdf_url }; // Returns path, not signed URL!
}
```

But later in line 175, it returns the **signed URL from generation**:
```typescript
pdfUrl: generateResult.pdfUrl,  // This is the signed URL
```

For **credit redemptions** (handled separately in `PurchaseSuccessPage.tsx`), the code correctly generates a signed URL from the path (lines 65-68).

For **Stripe purchases** that are already completed, the code returns the raw path instead of generating a signed URL.

**Fix**: Update `verify-letter-purchase` to generate a fresh signed URL when returning cached data.

---

## Issue 3: No Email Notification

**Status:** Based on the logs, emails ARE being sent for credit redemptions:
```
2026-02-08T14:25:59Z INFO Purchase email sent successfully
```

The issue might be:
1. Email going to spam
2. Email configuration issue
3. Wrong email address

Let me check the email function.

---

## Issue 4: Custom AI Legal Expert (New Feature Request)

**Requirement:** When no template matches the user's situation, allow them to describe their problem and have a specialized legal AI generate a custom letter.

**Key Points from User:**
- These need to be "highly trained AIs with expertise in law practices of all kinds in US"
- Must differentiate from "classic ChatGPT"

**Implementation Approach:**

### 4.1 Enhanced AI Legal Expert System Prompt

Create a specialized legal AI persona with:
- Deep knowledge of US federal and state consumer protection laws
- Expertise across all practice areas (contract, consumer rights, employment, housing, etc.)
- Proper legal disclaimer handling
- Formal legal letter writing style

### 4.2 Custom Letter Generation Flow

When Dispute Assistant can't match a template:
1. AI acknowledges this and offers to help directly
2. Gathers detailed information through conversation
3. Generates a custom legal letter with proper citations
4. User can purchase/download this custom letter

### 4.3 Differentiation from ChatGPT

- Specialized legal knowledge base in system prompt
- References to specific statutes and regulations
- Formal legal writing style
- Proper disclaimers
- Trust indicators showing specialized training

---

## Implementation Plan

### Phase 1: Fix Evidence Photo Flow

**File: `src/components/letter/LetterGenerator.tsx`**

Store uploaded paths in a ref and pass them explicitly:

```typescript
const [uploadedEvidence, setUploadedEvidence] = useState<{storagePath: string; description: string}[]>([]);

// In Generate Letter handler:
if (evidenceUpload.hasPhotos && user) {
  const paths = await evidenceUpload.uploadAllPhotos(user.id);
  setUploadedEvidence(paths);  // Store for later use
}

// Pass to PricingModal:
<PricingModal 
  evidencePhotoPaths={uploadedEvidence}
  ...
/>
```

### Phase 2: Fix Download URL Generation

**File: `supabase/functions/verify-letter-purchase/index.ts`**

Update the early return for completed purchases to generate fresh signed URL:

```typescript
if (purchase.status === "completed" && purchase.pdf_url) {
  // Generate fresh signed URL from storage path
  let pdfUrl = purchase.pdf_url;
  if (!pdfUrl.startsWith('http')) {
    const { data: signedData } = await supabaseClient.storage
      .from("letters")
      .createSignedUrl(pdfUrl, 60 * 60); // 1 hour
    pdfUrl = signedData?.signedUrl || pdfUrl;
  }
  
  return { success: true, purchase: { ..., pdfUrl } };
}
```

### Phase 3: Add Custom AI Legal Expert

**New Files:**

1. **`supabase/functions/legal-expert-letter/index.ts`** - New Edge Function for custom letter generation

2. **`supabase/functions/_shared/legalExpertContext.ts`** - Specialized legal AI system prompt

3. **`src/components/dispute-assistant/CustomLetterFlow.tsx`** - UI for custom letter generation

**System Prompt Enhancement:**

```text
You are a Legal Correspondence Expert at Letter Of Dispute - a specialized AI trained 
exclusively for drafting formal legal correspondence for US consumers.

EXPERTISE:
You have been trained on:
- Federal consumer protection statutes (FTC Act, FCRA, FDCPA, TILA, ECOA, TCPA)
- State-specific consumer protection laws and regulations
- Contract law principles applicable to consumer disputes
- Agency complaint procedures (FTC, CFPB, state AG offices)
- Formal legal letter writing conventions

DIFFERENTIATION FROM GENERIC AI:
Unlike general-purpose AI assistants, you:
- Only discuss matters within your legal correspondence expertise
- Cite specific statutes and regulations by name and section
- Use proper legal letter formatting (block style, formal salutations)
- Include relevant deadlines and statutory requirements
- Never speculate on legal outcomes
- Always recommend attorney consultation for complex matters

RESPONSE STYLE:
- Formal and authoritative
- Citations to relevant law where applicable
- Professional legal document formatting
- Clear distinction between informational content and legal advice

IMPORTANT DISCLAIMERS:
- You provide legal information, not legal advice
- You are not an attorney
- Users should consult qualified legal counsel for specific legal matters
```

**UI Differentiation:**

```tsx
<div className="bg-primary/5 border-l-4 border-primary p-4 mb-4">
  <div className="flex items-center gap-2 mb-2">
    <Scale className="h-5 w-5 text-primary" />
    <span className="font-semibold text-primary">Legal Correspondence Expert</span>
  </div>
  <p className="text-sm text-muted-foreground">
    Specialized AI trained on US consumer protection law and formal legal writing - 
    not a general chatbot.
  </p>
</div>
```

### Phase 4: Dispute Assistant Fallback Integration

**File: `supabase/functions/_shared/siteContext.ts`**

Update the Dispute Assistant context to handle unmatched cases:

```typescript
WHEN NO TEMPLATE MATCHES:
If the user's situation doesn't clearly fit any existing template category, respond with:

[CUSTOM_LETTER_OFFER]
reason: Brief explanation of why existing templates don't fit
suggested_approach: What type of custom letter might help
[/CUSTOM_LETTER_OFFER]

This triggers the custom letter generation flow where our Legal Correspondence Expert 
can create a tailored letter for their specific situation.
```

**File: `src/components/dispute-assistant/ChatInterface.tsx`**

Handle the new `[CUSTOM_LETTER_OFFER]` block and show a CTA to use the custom letter feature.

---

## File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/components/letter/LetterGenerator.tsx` | Update | Store uploaded evidence paths in state |
| `supabase/functions/verify-letter-purchase/index.ts` | Update | Generate signed URLs for cached purchases |
| `supabase/functions/_shared/siteContext.ts` | Update | Add fallback handling for unmatched templates |
| `supabase/functions/_shared/legalExpertContext.ts` | Create | Specialized legal AI system prompt |
| `supabase/functions/legal-expert-letter/index.ts` | Create | Custom letter generation endpoint |
| `src/components/dispute-assistant/ChatInterface.tsx` | Update | Handle custom letter offer |
| `src/components/dispute-assistant/CustomLetterFlow.tsx` | Create | UI for custom letter generation |
| `src/components/dispute-assistant/DisputeAssistantModal.tsx` | Update | Integrate custom letter flow |

---

## Technical Architecture

```text
User Describes Problem
        ↓
Dispute Assistant Analyzes
        ↓
    ┌─────────────────────┐
    │ Template Match?     │
    └─────────────────────┘
           ↓              ↓
         Yes             No
           ↓              ↓
    Recommend         Offer Custom
    Template          Letter Flow
           ↓              ↓
    User Proceeds    Legal Expert AI
    to Generator     Gathers Details
                          ↓
                    Generate Custom
                    Letter Content
                          ↓
                    Same Payment Flow
```

---

## Differentiation Strategy

To clearly distinguish from "classic ChatGPT":

1. **Visual Branding**: Unique icon (Scale of Justice), distinct color scheme
2. **UI Labels**: "Legal Correspondence Expert" not "AI Chat"
3. **Response Format**: Formal, structured, with legal citations
4. **Scope Limitation**: Refuses non-legal topics, stays focused
5. **Trust Indicators**: 
   - "Trained on Federal & State Consumer Law"
   - "Formal Legal Document Formatting"
   - "Not a General-Purpose AI"
6. **Professional Disclaimers**: Always visible, legally appropriate

