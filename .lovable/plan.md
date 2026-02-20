
# 5-Task Cleanup Sprint

## Overview

This plan covers 5 targeted tasks: removing em dashes from user-facing text, a browser end-to-end smoke test, an SEO audit, legal page em-dash cleanup, and a HowItWorks content refresh.

---

## Task 1 - Remove Em Dashes from Homepage (`Hero.tsx`)

Two user-visible em dashes found in `src/components/home/Hero.tsx`:

- Line 92: `{' '}— Without a Lawyer` - Replace `—` with a comma + rewrite: `Resolve Your Dispute Step-by-Step, Without a Lawyer`
- Line 97: `— all in one place` - Replace with `- all in one place` (hyphen) or rewrite to remove it: `...and every agency complaint link, all in one place.`

Em dashes in code comments (lines 158, 194) are harmless - not rendered in the browser, will leave those alone.

---

## Task 2 - End-to-End Browser Test

Will navigate the full core user flow using the browser tool:

1. Homepage loads correctly (Hero, trust bar, categories visible)
2. Click "Start Your Dispute" - dispute intake modal opens (Step 1 category picker)
3. Select a category (e.g. Payment/Financial) - Step 2 conditional follow-ups appear
4. Answer follow-ups - Step 3 AI chat loads with pre-loaded context message
5. Navigate to a template letter page - verify chargeback alert shows for payment category with recent date
6. Verify the Resolution Plan panel renders after letter generation

This is a smoke test pass/fail check - no code changes unless bugs are found.

---

## Task 3 - SEO Audit

No code changes expected - verification only:

Checking the following:
- Homepage title/description within character limits (60/155) - currently `"Dispute Letter Templates - Professional Complaint Letters That Get Results | Letter of Dispute"` = 91 chars, which is over the recommended 60. However this is the existing agreed strategy (memory note confirms the deliberate "problem-led" title).
- Canonical tags are correct on all key pages
- SEOHead emits correct schema types (WebApplication for template pages, FAQPage for guides)
- No em dashes appear in meta titles or descriptions that could hurt readability in SERPs

**Finding:** The `GuidesPage.tsx` SEO title contains an em dash: `"Consumer Rights Guides — Know Your Rights"`. This will be fixed.

**Other pages:** `StateRightsPage.tsx` title `"State Consumer Rights Lookup — Find Your State's Laws"` also contains an em dash in the SEO title - visible in Google SERPs. Both will be replaced with a pipe character `|` following the established title convention.

---

## Task 4 - Update Legal Pages (Em Dash Cleanup)

### `src/pages/TermsPage.tsx`

User-visible em dashes to replace:
- Line 139: `Dispute Outcome Tracker — provided free of charge` → `Dispute Outcome Tracker, provided free of charge`
- Line 197: `7. Important Legal Disclaimer — "As Is" Use` → `7. Important Legal Disclaimer: "As Is" Use`

### `src/pages/CookiePolicyPage.tsx`

- Line 108: `at any time — it takes effect immediately` → `at any time. It takes effect immediately.`
- Lines 135-137: Three bullet points using `—` as separators → replace each `—` with a colon `:`
  - `Essential — Required for...` → `Essential: Required for...`
  - `Analytics — Help us understand...` → `Analytics: Help us understand...`
  - `Functional — Enhance the visual...` → `Functional: Enhance the visual...`

### `src/pages/PrivacyPage.tsx`

The one match in PrivacyPage is in a comment (`{/* Sticky ToC — desktop only */}`) - not user-visible, will leave it.

---

## Task 5 - Update "How It Works" Section

The current 4-step flow is outdated - it describes the old template-only experience. The platform now has an intake flow, AI assistant, resolution plan, and agency links. Update the copy to reflect the full "Dispute OS" experience:

### Updated Steps

**Step 01 - Describe Your Dispute** (was "Choose Your Letter Type")
- Icon: `MessageSquare` (chat/intake)
- Title: `Describe Your Dispute`
- Description: `Answer a few guided questions about your situation. No legal jargon. Our AI identifies the right approach instantly.`

**Step 02 - Get Your Resolution Plan** (was "Fill in the Details")
- Icon: `ClipboardList` (plan/checklist)
- Title: `Get Your Resolution Plan`
- Description: `Receive a step-by-step strategy: the right letter, relevant agency links (CFPB, FTC, State AG), and chargeback guidance if applicable.`

**Step 03 - Generate Your Letter** (unchanged concept, updated copy)
- Icon: `FileCheck` (was `Download`)
- Title: `Generate Your Letter`
- Description: `Your letter is built with legal-safe language, correct tone, and the exact citations needed for your dispute type and state.`

**Step 04 - Track Until Resolved** (was "Send & Get Results")
- Icon: `CheckCircle` (was `Send`)
- Title: `Track Until Resolved`
- Description: `Use the Dispute Tracker to log progress, check off resolution steps, and mark your dispute resolved when you win.`

Section subtitle also updated from `"Create a professional dispute letter in four simple steps."` to `"From first description to final resolution - your complete dispute toolkit in four steps."`

---

## Technical Details

### Files to Modify

| File | Changes |
|---|---|
| `src/components/home/Hero.tsx` | Remove 2 user-visible em dashes (lines 92, 97) |
| `src/pages/GuidesPage.tsx` | Fix em dash in SEO title |
| `src/pages/StateRightsPage.tsx` | Fix em dash in SEO title |
| `src/pages/TermsPage.tsx` | Fix 2 user-visible em dashes (lines 139, 197) |
| `src/pages/CookiePolicyPage.tsx` | Fix 5 user-visible em dashes (lines 108, 135-137) |
| `src/components/home/HowItWorks.tsx` | Full content refresh - new icons, titles, descriptions, subtitle |

### No Backend Changes

All changes are purely frontend copy and content. No database migrations, edge functions, or schema changes required.

### Em Dash Replacement Rules

Following the project's established convention (memory: content-quality-validation-system), em dashes are replaced with:
- Hyphens `-` in flowing prose
- Colons `:` in definition-style lists
- Commas `,` where the em dash acts as a parenthetical

