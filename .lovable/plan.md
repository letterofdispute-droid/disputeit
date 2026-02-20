
# Fix: 4 Real UX Bugs Found in Testing

## What's Broken (from user testing)

### Bug 1 - Recommendation links to category page, not the specific template
In `LetterRecommendation.tsx`, "View Letter Template" links to `/templates/${recommendation.category}` - the category browse page. The user then has to scroll through and find the right template themselves. This is the core of the "double flow" complaint.

**Root cause:** The AI's `[RECOMMENDATION]` block provides `letter: specific-letter-name` (e.g. `unauthorized-charge-dispute`) which is actually a template slug, but `LetterRecommendation.tsx` ignores this slug and just links to the category. The slug needs to be resolved to a full URL: `/templates/{categoryId}/{subcategorySlug}/{templateSlug}`.

**Fix:** In `LetterRecommendation.tsx`:
- Use `getTemplateBySlug(recommendation.letter)` to find the actual template
- If found, resolve its full URL using `inferSubcategory` for the subcategory slug
- "View Letter Template" button links directly to `/templates/{categoryId}/{subcat}/{slug}`
- "Browse Category" remains as the fallback secondary button

### Bug 2 - User has to re-type their issue description in the letter form
After the intake flow (where user describes their situation), clicking through to a template page requires re-entering the same information. The `dispute_intake_context` already in `sessionStorage` contains the dispute description but is never used to pre-fill form fields.

**Fix:** In `LetterGenerator.tsx`, on mount:
- Read `sessionStorage.getItem('dispute_intake_context')` and `sessionStorage.getItem('dispute_intake_answers')` (a new key we store)
- Extract the user's issue description from the intake answers
- Pre-fill the first `textarea` field (typically `issueDescription`, `description`, or `details`) with the intake description if the field is currently empty

We also need to store the raw intake description in `DisputeIntakeFlow.tsx` - currently the intake has no "describe your issue" text field. Looking at the flow again:

The intake flow is: Category → Credit card → Date + Company response. There is **no free-text description field** in the current intake. The user is confused because after the 3 steps they see the AI recommendation, and only in the AI chat does a description get typed. But the user said they "described an issue" during intake - this suggests they typed in the AI chat after intake completed (which auto-triggered the AI), and then expected that text to carry over.

**Revised fix:** Store the intake answers (disputeType, dates, etc.) in sessionStorage in a structured format, and use them to pre-fill the letter form:
- Pre-fill date fields (`incidentDate`, `date`, `purchaseDate`) from `answers.incidentDate`
- Add a brief pre-fill banner: "We've pre-filled some details from your intake" so the user knows it happened

### Bug 3 - Mobile: Two buttons side by side don't fit
In `LetterRecommendation.tsx`, the button row `<div className="flex gap-2">` puts both buttons side by side. On mobile (360px screens), "View Letter Template →" and "Browse Financial" overflow or truncate.

**Fix:** Change `flex gap-2` to `flex flex-col gap-2 sm:flex-row` so they stack on mobile and go side-by-side on sm+ screens.

### Bug 4 - Download PDF button grayed out immediately after purchase
On `PurchaseSuccessPage.tsx`, the "Download PDF" button is `disabled={!purchase.pdfUrl}`. 

Looking at the code: for credit purchases (amount = 0), `pdfUrl` is set from `purchaseData.pdf_url` after calling `supabase.storage.createSignedUrl`. If `pdf_url` is null/empty in the DB at that point (PDF not yet generated), the button stays grayed out.

For paid Stripe purchases, `pdfUrl` comes from `verify-letter-purchase` edge function response.

**Fix:** 
- Add a "Generating your PDF..." loading state when `purchase` exists but `purchase.pdfUrl` is falsy
- Poll the `letter_purchases` table every 3 seconds (up to 30s) until `pdf_url` is populated, then generate a signed URL and enable the button
- Show a spinner on the button with "Preparing PDF..." text while polling
- After 30s timeout, show "PDF generation is taking longer than expected. Check your email or visit your dashboard."

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dispute-assistant/LetterRecommendation.tsx` | Link directly to template slug URL + stack buttons on mobile |
| `src/components/dispute-assistant/DisputeIntakeFlow.tsx` | Store structured answers to sessionStorage on complete |
| `src/components/dispute-assistant/DisputeAssistantModal.tsx` | Store intake answers to sessionStorage when calling `handleIntakeComplete` |
| `src/components/letter/LetterGenerator.tsx` | Pre-fill date field from intake sessionStorage on mount |
| `src/pages/PurchaseSuccessPage.tsx` | Poll for PDF URL when initially missing, show loading state on button |

## Technical Details

### Resolving template slug to URL
```
recommendation.letter → getTemplateBySlug(slug) → template
categoryId = getCategoryIdFromName(template.category)
subcategorySlug = inferSubcategory(template.id, template.category)?.slug || 'general'
url = /templates/${categoryId}/${subcategorySlug}/${template.slug}
```

### PDF polling logic
```typescript
// After purchase is set and pdfUrl is missing, poll every 3s up to 10 attempts
useEffect(() => {
  if (!purchase || purchase.pdfUrl) return;
  let attempts = 0;
  const interval = setInterval(async () => {
    attempts++;
    const { data } = await supabase.from('letter_purchases').select('pdf_url').eq('id', purchase.id).single();
    if (data?.pdf_url) {
      // generate signed URL and update purchase state
      clearInterval(interval);
    }
    if (attempts >= 10) clearInterval(interval);
  }, 3000);
  return () => clearInterval(interval);
}, [purchase]);
```

### Intake pre-fill in LetterGenerator
When the component mounts, read from sessionStorage:
```
dispute_intake_answers: JSON of { disputeType, incidentDate, paidByCreditCard, companyResponded }
```
If `incidentDate` is set and the template has a date field, pre-fill it automatically and show a subtle "Pre-filled from your intake" banner.

## No Backend Changes Required
All fixes are purely frontend. No migrations, no edge function changes.
