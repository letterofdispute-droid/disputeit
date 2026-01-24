

# Comprehensive UX Enhancement Plan

## Overview

This plan addresses three major improvements:
1. **Rename "template" to "Letter Builder"** across the entire application
2. **Fix the Hero yellow button** to provide a meaningful action
3. **Add AI-Powered Guided Dispute Creator** in the Hero section

---

## Part 1: Rename "Template" to "Letter Builder"

### Terminology Changes

| Old Term | New Term |
|----------|----------|
| "template" | "letter builder" |
| "templates" | "letter builders" / "letters" |
| "Pre-validated templates" | "Pre-validated letter builders" |
| "Browse Templates" | "Start Building" |
| "Use Template" | "Build Your Letter" |
| "{N} templates" | "{N} letter builders" |

### Files to Update

**UI/User-Facing Text:**
1. `src/components/home/Hero.tsx` - Badge and trust indicators
2. `src/components/home/LetterCategories.tsx` - Category counts and buttons
3. `src/components/home/TrustIndicators.tsx` - Proof points
4. `src/components/home/WhyNotChatGPT.tsx` - Value proposition
5. `src/components/home/Pricing.tsx` - What you're paying for
6. `src/pages/CategoryPage.tsx` - Page titles, counts, buttons
7. `src/pages/ArticleCategoryPage.tsx` - CTA text
8. `src/components/layout/Footer.tsx` - Disclaimer

**Data Structures:**
1. `src/data/templateCategories.ts` - Rename `templateCount` to `letterCount`
2. Update interface `TemplateCategory` to `LetterCategory`

**Note:** Internal code names (like function names, file names) can remain as-is for now to minimize refactoring risk.

---

## Part 2: Fix Hero Yellow Button

### Current State
- Button text: "Create Your Letter"
- Links to: `/#letters` (scrolls to categories section)
- **Problem**: Users expect immediate action but just get scrolled down

### Proposed Solution

**Option A (Recommended): Link to AI Guided Dispute**
- Change button to open the new AI Guided Dispute modal/flow
- Text: "Start Your Dispute" or "Get Help Now"

**Option B: Link to Most Popular Category**
- Change button to navigate to the most requested category (Healthcare)
- Text: "Start Your Letter"

### Implementation

Update `Hero.tsx`:
```typescript
// Change primary CTA to launch AI guided flow
<Button variant="hero" size="xl" onClick={openGuidedDispute}>
  Start Your Dispute
  <ArrowRight className="h-5 w-5" />
</Button>

// Keep secondary as category browser
<Button variant="heroOutline" size="xl" asChild>
  <Link to="/#letters">
    Browse Letter Builders
  </Link>
</Button>
```

---

## Part 3: AI-Powered Guided Dispute Creator

### Concept: "Dispute Assistant"

A conversational AI that helps users:
1. Describe their situation in plain language
2. Get matched to the right letter builder
3. Optionally, have AI help draft the letter based on their story

### User Flow

```text
[User clicks "Start Your Dispute"]
     ↓
[Modal opens with AI chat interface]
     ↓
AI: "Hi! I'm here to help you resolve your dispute. 
     Tell me what happened - I'll find the right letter for you."
     ↓
[User types: "My landlord won't return my deposit"]
     ↓
AI: "I understand - that's frustrating. Let me ask a few questions:
     1. How long ago did your tenancy end?
     2. Did your landlord give a reason for keeping the deposit?
     3. What's the deposit amount?"
     ↓
[User answers questions]
     ↓
AI: "Based on what you've told me, I recommend the 
     'Security Deposit Return Request' letter builder.
     
     [View Letter Builder]  [Continue with AI Help]"
```

### Technical Implementation

**New Components:**
1. `src/components/dispute-assistant/DisputeAssistantModal.tsx` - Main modal container
2. `src/components/dispute-assistant/ChatInterface.tsx` - Message display
3. `src/components/dispute-assistant/ChatInput.tsx` - User input field
4. `src/components/dispute-assistant/LetterRecommendation.tsx` - Result card

**New Edge Function:**
1. `supabase/functions/dispute-assistant/index.ts` - AI conversation handler

**AI System Prompt (Fine-tuned for disputes):**

```text
You are a Dispute Assistant helping users create formal complaint letters.

ROLE:
- Help users identify the right type of dispute letter
- Ask clarifying questions to understand their situation
- Match them to the appropriate letter builder from the available categories
- Be empathetic but professional
- Never provide legal advice

AVAILABLE CATEGORIES:
- Refunds & Purchases (15 letters)
- Landlord & Housing (14 letters)
- Travel & Transportation (12 letters)
- Healthcare & Medical Billing (50 letters)
[... full list ...]

CONVERSATION STYLE:
- Keep responses concise (2-3 sentences max per turn)
- Ask one question at a time
- Use plain language, not legal jargon
- Be supportive: "I understand that's frustrating"

WHEN RECOMMENDING:
- Explain why you chose that letter type
- Provide the category and specific letter name
- Offer to help gather details for the letter
```

**State Management:**

```typescript
interface DisputeAssistantState {
  isOpen: boolean;
  messages: Message[];
  recommendedLetter: LetterTemplate | null;
  userContext: {
    category?: string;
    issueType?: string;
    details?: Record<string, string>;
  };
}
```

### Hero Section Redesign

**Current Layout:**
```
[Badge]
[Headline]
[Subheadline]
[Two Buttons]
[Trust Indicators]
```

**New Layout (Option A - AI Search Bar):**
```
[Badge]
[Headline]
[Subheadline]

[Search Input: "Describe your dispute..."] [→ Get Help]

[Or browse: Refunds • Housing • Healthcare • Travel • More]

[Trust Indicators]
```

**New Layout (Option B - Keep Buttons + Add Search):**
```
[Badge]
[Headline]
[Subheadline]

[     Describe your situation...     ] [Get Help →]

[Start Your Dispute]  [Browse Letter Builders]

[Trust Indicators]
```

### Edge Function Implementation

```typescript
// supabase/functions/dispute-assistant/index.ts

const systemPrompt = `You are a Dispute Assistant...`

// Categories context for the AI
const categoriesContext = `
Available letter types:
- Refunds: Product returns, service refunds, subscription cancellations...
- Housing: Deposit disputes, repair requests, lease issues...
- Healthcare: Insurance denials, billing errors, debt collection...
[...]
`;

// Main handler
serve(async (req) => {
  const { messages, userContext } = await req.json();
  
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt + categoriesContext },
        ...messages,
      ],
      stream: true,
    }),
  });
  
  return new Response(response.body, {
    headers: { "Content-Type": "text/event-stream" },
  });
});
```

---

## Implementation Order

### Phase 1: Naming Update (Quick Win)
1. Update all user-facing "template" text to "letter builder"
2. Update button CTAs to be more action-oriented
3. Update data structures if needed

**Files changed:** ~10 files, mostly text changes

### Phase 2: Hero Button Fix
1. Create placeholder for AI assistant
2. Update Hero button to open modal (even if simple initially)
3. Add secondary "Browse Letter Builders" option

**Files changed:** 2-3 files

### Phase 3: AI Dispute Assistant (Full Feature)
1. Create edge function with dispute-focused system prompt
2. Build chat interface components
3. Implement letter recommendation logic
4. Add streaming chat display
5. Connect to existing letter builder pages

**Files changed:** 8-10 new files

### Phase 4: Hero Search Integration
1. Add search/describe input to Hero section
2. Quick-match to categories based on keywords
3. Full AI conversation on complex queries

---

## Summary of Deliverables

| Item | Type | Effort |
|------|------|--------|
| Rename "template" → "letter builder" | Text updates | Small |
| Fix Hero yellow button | UX improvement | Small |
| Dispute Assistant modal | New feature | Medium |
| Edge function for AI | Backend | Medium |
| Hero search bar | UI enhancement | Small |
| Letter recommendation logic | Logic | Medium |

---

## Benefits

1. **"Letter Builder"** sounds more helpful and less generic than "template"
2. **Meaningful CTA** converts more visitors who want immediate help
3. **AI Guided Flow** reduces friction for users who don't know what letter they need
4. **Search in Hero** captures high-intent users immediately
5. **Empathetic AI** builds trust and positions the product as a helper, not just a tool

