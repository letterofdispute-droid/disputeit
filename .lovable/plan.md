

# Move "Choose Your Letter Type" Section Up on Homepage

## Rationale
Currently the homepage order is:
1. Hero
2. Trust Badges Strip
3. What Is a Dispute Letter (educational)
4. Real World Scenarios (educational)
5. Success Stories (social proof)
6. Why Not ChatGPT (differentiation)
7. **Letter Categories** (action)
8. How It Works
9. Trust Indicators
10. Pricing
11. FAQ

The Letter Categories grid is the main conversion entry point -- users pick a category to start building their letter. Moving it directly under the trust bar puts action before education, which is better for users who already know what they need.

## Proposed New Order
1. Hero
2. Trust Badges Strip
3. **Letter Categories** (moved up)
4. What Is a Dispute Letter
5. Real World Scenarios
6. Success Stories
7. Why Not ChatGPT
8. How It Works
9. Trust Indicators
10. Pricing
11. FAQ

## File to Modify

**`src/pages/Index.tsx`** -- Reorder the `<LetterCategories />` component from its current position (after WhyNotChatGPT) to immediately after the Trust Badges Strip `<div>` block. No other changes needed.
