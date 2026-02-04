
# Diverse & Human-Sounding Content Titles - Implementation Plan

## Problem Analysis

You're right - the current system exposes the formulaic nature of the content strategy in two ways:

1. **Visible Templates in UI**: The ClusterPlanner displays static patterns like `"Template: How to {action} {topic} Step-by-Step"` before any AI generation occurs
2. **Repetitive AI Output**: The prompt to generate titles doesn't emphasize variation, so "How to File a Poor Workmanship Complaint Step-by-Step" looks nearly identical to "How to File a Contractor Deposit Dispute Step-by-Step"

## Solution Overview

Transform the content planning from **template-based** to **AI-first with diversity requirements** by:

1. Removing visible title templates from the UI entirely
2. Enhancing the AI prompt with explicit diversity and human language instructions
3. Adding title variation patterns that the AI can choose from (not displayed to users)
4. Including "anti-pattern" detection to ensure adjacent templates don't share similar title structures

---

## Changes to Make

### 1. Update Article Types Configuration

**File: `src/config/articleTypes.ts`**

Instead of showing a single `titleTemplate`, store multiple variation patterns internally (never displayed) and add descriptive guidance for each type:

```text
Current:
  titleTemplate: 'How to {action} {topic} Step-by-Step'

New:
  titleVariations: [
    'How to {action} {topic} Step-by-Step',
    '{topic}: A Complete Step-by-Step Guide',
    'The Ultimate Guide to {action} Your {topic}',
    '{topic} Made Simple: What You Need to Do',
    'Everything You Need to Know About {action} {topic}'
  ]
  displayHint: 'Step-by-step instructions for taking action'
```

This gives the AI multiple patterns to choose from while showing users only a generic description.

### 2. Update ClusterPlanner UI

**File: `src/components/admin/seo/ClusterPlanner.tsx`**

- **Remove** the italic "Template: ..." line that exposes the formula
- **Keep** the article type name and purpose (e.g., "How-To Guide - Step-by-step instructions")
- Add a subtle note: "AI will generate unique, SEO-optimized titles"

Visual change:
```text
Before:
┌──────────────────────────────────────────────────────────┐
│ ☑ How-To Guide                                           │
│   Step-by-step instructions                              │
│   Template: How to {action} {topic} Step-by-Step    ❌   │
└──────────────────────────────────────────────────────────┘

After:
┌──────────────────────────────────────────────────────────┐
│ ☑ How-To Guide                                           │
│   Step-by-step instructions for taking action            │
└──────────────────────────────────────────────────────────┘
```

### 3. Enhance AI Prompt for Diversity

**File: `supabase/functions/generate-content-plan/index.ts`**

Completely rewrite the prompt to emphasize:

**Diversity Requirements:**
- Each title must feel uniquely crafted, not templated
- Vary sentence structure (questions, statements, lists, emotional hooks)
- Use different power words and emotional triggers
- Avoid starting multiple titles the same way
- Mix title lengths (short punchy vs. descriptive)

**Human Language Guidelines:**
- Write like a journalist, not a content mill
- Use natural phrasing people actually search for
- Include colloquial expressions where appropriate
- Reference specific scenarios, not generic topics

**Anti-Pattern Rules:**
- Never start more than one title with "How to"
- Avoid repeating the exact template name in every title
- Each title should pass the "would a human write this?" test

Example enhanced prompt:
```text
Generate diverse, human-crafted article titles for a content cluster.

CRITICAL DIVERSITY RULES:
1. Each title must feel like it was written by a different writer
2. Vary your title structures:
   - Questions: "Why Does Your Contractor Dispute Keep Failing?"
   - Numbers: "5 Costly Workmanship Mistakes You're Probably Making"
   - Statements: "What Homeowners Wish They Knew Before Hiring Contractors"
   - How-tos: "Getting Your Money Back After Poor Workmanship"
   - Emotional: "Fed Up With Contractor Excuses? Here's What Actually Works"
3. Never start two titles the same way
4. Use natural language people actually type into Google
5. Include specific scenarios, not generic topics

BAD EXAMPLES (too templated):
- "How to File a Poor Workmanship Complaint Step-by-Step"
- "7 Mistakes That Get Your Poor Workmanship Claim Rejected"
- "Your Rights: Poor Workmanship - What Contractors Won't Tell You"

GOOD EXAMPLES (diverse & human):
- "What to Do When Your Contractor's Work Is Rubbish"
- "The 7 Excuses Dodgy Builders Use (And How to Fight Back)"
- "Homeowner Rights After Shoddy Construction Work in 2024"
```

### 4. Add Category-Specific Language

Enhance the prompt with category context to use appropriate terminology:

- **Contractors**: "builders", "tradies", "workmanship", "job site"
- **Financial**: "lender", "bank", "charges", "account"
- **Travel**: "airline", "carrier", "booking", "compensation"
- **Insurance**: "claim", "policy", "adjuster", "denial"

This prevents generic language that sounds artificial.

### 5. Title Uniqueness Validation

**File: `supabase/functions/generate-content-plan/index.ts`**

Add post-generation validation:

1. Check that no two titles in the same plan share the first 3 words
2. Verify no title exactly matches the template name
3. Ensure variety in title lengths (mix of 6-8 word and 10-12 word titles)
4. If validation fails, add instruction to AI to regenerate with more variation

---

## Implementation Summary

| File | Change |
|------|--------|
| `src/config/articleTypes.ts` | Replace `titleTemplate` with `displayHint`, add hidden `titleVariations` array for AI reference |
| `src/components/admin/seo/ClusterPlanner.tsx` | Remove "Template: ..." display line, show only purpose/hint |
| `supabase/functions/generate-content-plan/index.ts` | Rewrite AI prompt with explicit diversity rules, anti-pattern instructions, category-specific language, and validation |

---

## Example Output Comparison

**Template: "Poor Workmanship Complaint Letter"**

### Before (Templated)
1. How to File a Poor Workmanship Complaint Step-by-Step
2. 7 Mistakes That Get Your Poor Workmanship Claim Rejected
3. Your Rights: Poor Workmanship - What Contractors Won't Tell You
4. Poor Workmanship Letter Examples That Actually Worked
5. Poor Workmanship FAQ: 15 Questions Answered

### After (Diverse & Human)
1. What to Do When Your Builder's Work Falls Apart
2. The Costly Mistakes Homeowners Make After Shoddy Repairs
3. UK Building Standards: Your Rights When Work Isn't Up to Scratch
4. Real Letters That Got Homeowners Their Money Back
5. "Is This Good Enough?" How to Spot Poor Workmanship Before It's Too Late

---

## Technical Details

### Updated articleTypes.ts Structure

```typescript
export interface ArticleType {
  id: string;
  name: string;
  purpose: string;
  displayHint: string; // Shown in UI instead of template
  titleVariations: string[]; // Hidden, passed to AI as options
  keywordSuffixes: string[];
  priority: number;
}

// Example:
{
  id: 'how-to',
  name: 'How-To Guide',
  purpose: 'Step-by-step instructions',
  displayHint: 'Actionable guide helping readers take immediate action',
  titleVariations: [
    'How to {action} {topic}',
    '{topic}: A Complete Guide',
    'The Smart Way to Handle {topic}',
    'Getting Results: {topic} That Works',
    '{topic} Done Right'
  ],
  keywordSuffixes: ['how to', 'guide', 'step by step'],
  priority: 100,
}
```

### Enhanced AI Prompt Structure

The edge function will:
1. Pass the template name and category context
2. Include the `titleVariations` as "inspiration patterns" (not rigid templates)
3. Add explicit anti-duplication rules
4. Request diverse sentence structures
5. Validate output before returning

This approach keeps the internal structure for SEO consistency while ensuring the visible output feels handcrafted and unique.
