
# Update Pricing Pages with Accurate Features and Stronger Value Proposition

## What's changing

Three components need updates to reflect the actual product capabilities and provide stronger reasons to buy:

### 1. Pricing Cards - Add missing features (3 files)

The current feature lists are too sparse and don't mention key capabilities. Update the feature bullets in all three locations:

**PDF Only ($9.99) features:**
- Professional letter with legal-safe phrasing
- PDF download, ready to send
- Attach up to 10 evidence photos embedded in PDF
- Cites relevant US federal law
- 500+ dispute-specific templates

**PDF + Edit Access ($14.99) features:**
- Everything in PDF Only
- 30 days of in-app editing
- Export updated PDF anytime
- AI-powered form assistance
- Make unlimited changes

Files to update:
- `src/pages/PricingPage.tsx` (dedicated pricing page - lines 35-40 and 50-55)
- `src/components/home/Pricing.tsx` (homepage pricing section - lines 13-16 and 25-28)
- `src/components/letter/PricingModal.tsx` (checkout modal - lines 42-45 and 51-54)

### 2. WhyNotChatGPT section - Stronger differentiation

Update `src/components/home/WhyNotChatGPT.tsx` to emphasize that our models are purpose-built for dispute scenarios, not generic AI. Add a 4th proof point about evidence support, and strengthen the existing copy:

- **Certainty**: 500+ templates built for specific dispute types. No prompt engineering needed.
- **Correctness**: Purpose-trained models produce legal-safe language with proper citations. Generic AI may weaken your case.
- **Evidence Support**: Attach up to 10 photos directly embedded in your PDF. ChatGPT can't do that.
- **Time Saved**: 5 minutes from start to professional PDF. No back-and-forth with a chatbot.

Update the subtitle to emphasize purpose-built vs generic: "Our models are trained specifically for consumer disputes. Generic AI produces inconsistent, potentially harmful results."

### 3. PricingPage comparison section - Update ChatGPT comparison

In `src/pages/PricingPage.tsx`, update the "Why not just use ChatGPT?" comparison card (lines 83-91) to include stronger problems:
- Add: "Can't attach evidence photos to your letter"
- Add: "Not trained on dispute-specific legal language"
- Update solution text to mention purpose-built models and evidence embedding

## Technical Details

- **Files modified**: `src/pages/PricingPage.tsx`, `src/components/home/Pricing.tsx`, `src/components/home/WhyNotChatGPT.tsx`, `src/components/letter/PricingModal.tsx`
- All changes are data/copy updates to existing arrays and components
- No new dependencies or structural changes needed
- The WhyNotChatGPT grid changes from 3 columns to 4 columns on desktop (`md:grid-cols-4`)
