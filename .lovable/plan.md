

# AI Writing Guidelines: Human-Quality Content Generation

## Status: ✅ COMPLETED

Implementation completed on Feb 4, 2026.

---

## What Was Implemented

| Requirement | Status |
|-------------|--------|
| No AI patterns | ✅ Blacklisted 20+ AI-typical phrases |
| Natural flow | ✅ Instructions for varied sentence structure, imperfections |
| No AI jargon | ✅ Explicit forbidden phrases list |
| Standard characters only | ✅ Keyboard-only punctuation enforced |
| Academic sourcing | ✅ Requires citations to FTC, CFPB, statutes |
| CTA integration | ✅ Mandatory Letter Of Dispute mentions |
| Professional + sarcastic | ✅ Dry wit encouraged for absurd situations |
| Human imperfections | ✅ Minor stylistic quirks allowed |

---

## Files Modified

| File | Changes |
|------|---------|
| `supabase/functions/_shared/siteContext.ts` | Added `WRITING_STYLE_GUIDELINES` export (~75 lines) |
| `supabase/functions/generate-blog-content/index.ts` | Integrated guidelines into system prompt |
| `supabase/functions/bulk-generate-articles/index.ts` | Integrated guidelines into system prompt |

---

## Writing Guidelines Summary

The `WRITING_STYLE_GUIDELINES` constant now enforces:

### Forbidden Patterns
- "Delve", "dive into", "game-changer", "groundbreaking"
- "Navigate", "landscape", "realm", "unlock", "unleash"
- "Seamless", "robust", "comprehensive", "cutting-edge"
- "In today's world", "It's important to note"
- Starting sentences with "So," or "Now,"

### Academic Rigor
- Reference specific laws (e.g., "15 U.S.C. section 1681")
- Cite FTC.gov, CFPB.gov, state attorney general offices
- No unsourced legal claims

### Natural Writing Style
- Vary sentence length (5-word punches mixed with explanations)
- Use contractions naturally
- Allow fragments for emphasis
- Express frustration at unfair practices
- Dry humor for absurd corporate behavior

### Mandatory CTA
- Every article must naturally mention Letter Of Dispute templates
- Suggest specific category (e.g., "our Insurance Claims letters")

---

## Example Output Comparison

### Before (AI-typical):
> "In today's world, navigating a healthcare billing dispute can feel overwhelming. It's crucial to understand your rights as a consumer. Let's delve into the essential steps you need to take to resolve this seamlessly."

### After (Human-quality):
> "Your hospital sent a bill for $4,200. You have insurance. Something doesn't add up - and you're not imagining it. Under the No Surprises Act, passed in 2022, you have specific protections against balance billing that many hospitals conveniently forget to mention."

