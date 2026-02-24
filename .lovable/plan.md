

# Hero and How It Works Overhaul

## What Changes

### 1. Hero -- New Headline + Subheadline

**Current:**
> Resolve Your Dispute Step-by-Step, Without a Lawyer

**New (The Problem Solver approach):**
> Don't Get Ignored. **Get Results.**

This is the most emotionally resonant option. It speaks directly to the user's frustration (being ignored by companies) and promises the outcome they want.

**New subheadline:**
> Stop hitting a brick wall with landlords, insurers, and retailers. Our legally-vetted letter templates help you demand action and get the results you deserve -- without the $300/hour lawyer.

This adds the specific dispute categories Gemini recommended ("Oh, this is for me" recognition) while keeping the value proposition sharp.

**Badge text stays:** "Your Step-by-Step Dispute System" (good positioning)

---

### 2. Hero -- Replace Geometric Art with Live Proof Card

The entire right column (lines 128-157 of Hero.tsx) currently renders abstract CSS shapes that communicate nothing. Replace with a "Social Proof" card that shows real platform stats:

- Letters created count (from `letters` table or fallback to "12,000+")
- Resolution success rate (from existing `dispute_outcomes` query)
- A mini testimonial quote or "Trusted by thousands" line
- Category chips showing top use cases: Refunds, Housing, Insurance, Employment

This card will be visible on desktop only (same as current geometric art). On mobile, the stats are already shown inline via the trust indicators row.

---

### 3. Hero -- Upgrade Secondary CTA

**Current:** A tiny `text-muted-foreground` underlined link that says "or browse 550+ letter templates"

**New:** A proper outline button at `size="lg"` with the text "Browse 550+ Templates". Still secondary to the accent CTA but now visible and clickable. Below the two buttons, add a row of 4 category chips (Refunds, Housing, Insurance, Contractors) as quick-links that scroll to the categories section or navigate to the category page, giving "window shoppers" an immediate entry point.

---

### 4. How It Works -- Simplify to 3 Steps

**Current:** 4 steps with verbose descriptions and legal disclaimers baked into step text.

**New:** 3 crisp steps per Gemini's suggestion:

| Step | Title | Description |
|------|-------|-------------|
| 01 | Tell Your Story | Describe your situation in plain English. Our system asks the right questions to understand exactly what went wrong -- no legalese required. |
| 02 | Get Your Custom Letter | We select the strongest legal arguments for your specific case and generate a professional, legal-safe letter ready for your signature. |
| 03 | Send and Resolve | We provide the exact mailing address or agency complaint link you need. Send your letter and track your path to resolution. |

Section headline changes from "How It Works" to **"3 Steps to Resolution"**.

The "Track Until Resolved" functionality is not removed from the product; it is folded into step 3's description ("track your path to resolution") rather than being its own step, which felt like padding.

---

### 5. Trust Indicators Row -- Tighten

The 4-item trust indicator row below the CTAs stays but gets updated copy to match the new tone:

| Current | New |
|---------|-----|
| Certainty, not guesswork | Used by 10,000+ consumers |
| Pre-validated letters | Pre-validated legal language |
| Legal-safe language | State-specific citations |
| (dynamic success stat) | (dynamic success stat -- unchanged) |

---

## Files Modified

| File | Changes |
|------|---------|
| `src/components/home/Hero.tsx` | New headline/subheadline, replace geometric right column with proof card, upgrade secondary CTA with outline button + category chips, update trust indicator copy |
| `src/components/home/HowItWorks.tsx` | Reduce to 3 steps, update titles/descriptions, change section headline to "3 Steps to Resolution" |

No new files. No database changes. No new dependencies.

---

## Technical Details

### Hero.tsx Changes
- Lines 76-80: Replace h1 content with new headline using accent span on "Get Results"
- Lines 83-85: Replace subheadline paragraph with category-specific copy
- Lines 88-98: Replace CTA area -- keep accent Button as primary, add outline Button as secondary, add category chip links below
- Lines 101-124: Update trust indicator text
- Lines 128-157: Replace entire geometric composition div with a proof card component (inline, not a separate file) showing stats from the existing `successStats` query plus a `letters` count query
- The proof card will use `Card` from ui/card with stats, a mini quote, and category chips
- Add a second query for total letter count (simple count from `letters` table)

### HowItWorks.tsx Changes  
- Lines 10-35: Replace 4-step array with 3-step array using new titles and descriptions
- Lines 72-84: Update section header -- h2 becomes "3 Steps to Resolution", subtext updated
- Icons: MessageSquare (Tell), FileCheck (Get Letter), CheckCircle (Send and Resolve) -- drop ClipboardList
- Step numbers become 01, 02, 03

