
# Consumer Rights Hub: 5 Free Tools — Full Platform Integration

## What We're Building

Five interconnected free tools that make Letter of Dispute the definitive go-to resource for US consumer rights information. All data is sourced from the existing `stateSpecificLaws.ts` and `consumerRightsContent.ts` files — which already contain real, verified statutes, citations, AG contacts, and deadlines compiled from state legal codes. No fabricated data.

---

## Overview of 5 Tools

| Tool | URL | Value to Users | SEO Value |
|---|---|---|---|
| State Rights Lookup | `/state-rights` | Interactive state + category law finder | 50 state x 13 category = 650+ index targets |
| Statute of Limitations Calculator | `/deadlines` | "How long do I have?" answered instantly | High-intent deadline queries |
| Dispute Outcome Tracker | Dashboard tab | Users log dispute progress | Engagement + social proof data |
| Consumer News Hub | `/consumer-news` | Fresh FTC/CFPB updates weekly | Recurring traffic, freshness signals |
| Letter Strength Analyzer | `/analyze-letter` | Free AI scoring of user-submitted drafts | Top-of-funnel lead generation |

---

## Technical Architecture

### Data Sources (All Real, Already in Codebase)

- `src/data/stateSpecificLaws.ts` — 51 state entries (all 50 states + DC), each with real statute names, citations, summaries, and AG office contacts with verified URLs
- `src/data/consumerRightsContent.ts` — 13 category guides with real federal law citations (FTC Act, FCBA, FDCPA, Fair Housing Act, etc.), deadlines, regulatory contacts, and FAQ
- `src/data/legalKnowledge.ts` — Deeper per-category statute database with timeframe rules used in letter generation

The news hub will use a backend function to fetch from FTC and CFPB RSS feeds (public government APIs — no key required).

---

## Detailed Implementation

---

### TOOL 1: State Consumer Rights Lookup — `/state-rights`

**New page:** `src/pages/StateRightsPage.tsx`

**Layout:** Two-panel interactive lookup tool
- Left: State dropdown (all 51 from `US_STATES` array) + dispute category selector (all 13 categories)
- Right: Results panel that surfaces the relevant statutes from `stateSpecificLaws.ts`

**What renders in results:**
1. State consumer protection statute (name, citation, summary) — every state has this
2. Category-specific statute (e.g., lemon law for vehicle, landlord-tenant for housing) — where it exists
3. AG office name + clickable link (real URLs, already in data)
4. "Write a Letter for This Issue" CTA linking to the matching template category

**SEO:** Full `SEOHead` with schema, canonical at `/state-rights`. Each state+category combination is rendered client-side (no separate static pages needed — the lookup is interactive and JS-driven).

**Navigation:** Added to MegaMenu Resources section and mobile accordion.

---

### TOOL 2: Statute of Limitations Calculator — `/deadlines`

**New page:** `src/pages/DeadlinesPage.tsx`

**Layout:** Calculator UI
- Step 1: Select your state
- Step 2: Select dispute type (maps to `consumerRightsContent.ts` deadline entries)
- Step 3: Optional date picker — "When did the incident happen?"
- Output: Deadline summary showing all relevant timeframes from the guide + how many days remain if a date was entered

**Data source:** `consumerRightsContent.ts` `importantDeadlines[]` arrays — these contain real federal deadlines (60-day FCBA dispute window, 30-day FTC mail order rule, 180-day HUD complaint window, etc.). `stateSpecificLaws.ts` provides state-specific deadline context.

**Smart deadline logic:**
- Maps category + state to the relevant federal + state deadlines
- Color-coded urgency: green (plenty of time), amber (under 30 days), red (under 7 days / expired)
- "Start your dispute letter now" CTA with urgency framing if deadline is soon

**SEO:** Schema `FAQPage` with common deadline questions. Canonical at `/deadlines`.

---

### TOOL 3: Dispute Outcome Tracker — Dashboard Enhancement

**New component:** `src/components/dashboard/DisputeTracker.tsx`

**Database:** New `dispute_outcomes` table
```sql
CREATE TABLE public.dispute_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  category text,
  status text DEFAULT 'in_progress', -- 'in_progress', 'resolved', 'escalated', 'abandoned'
  amount_disputed numeric,
  amount_recovered numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  notes text
);
```
RLS: Users can only see/edit their own rows.

**UI in Dashboard:** New "My Disputes" tab alongside existing credits/purchases tabs. Shows:
- Active disputes with timeline status
- "Add Dispute" flow: name it, pick category, enter amount, track status
- Outcome summary card: total recovered vs disputed across all resolved cases

**Aggregate data (anonymous):** A background query surfaces platform-wide success stats for the homepage social proof section ("Users tracked $X recovered this month").

---

### TOOL 4: Consumer News Hub — `/consumer-news`

**New page:** `src/pages/ConsumerNewsPage.tsx`

**New edge function:** `supabase/functions/fetch-consumer-news/index.ts`

The function fetches from three public government RSS feeds (no API key required):
- FTC News RSS: `https://www.ftc.gov/feeds/press-release.xml`
- CFPB Newsroom RSS: `https://www.consumerfinance.gov/about-us/newsroom/feed/`
- NHTSA Recall RSS: `https://api.nhtsa.gov/recalls/recallsByType?type=Vehicle` (for vehicle category users)

**Database caching:** New `consumer_news_cache` table stores fetched items with a 6-hour TTL so we're not hammering RSS feeds.

```sql
CREATE TABLE public.consumer_news_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL, -- 'ftc', 'cfpb', 'nhtsa'
  title text NOT NULL,
  excerpt text,
  url text NOT NULL,
  published_at timestamptz,
  category_tags text[], -- mapped to our 13 categories
  fetched_at timestamptz DEFAULT now()
);
```

**UI Features:**
- Filter by source (FTC, CFPB, NHTSA) and category
- Each card shows: headline, source badge, date, excerpt, "Read on [source]" external link
- "Relevant letter templates" sidebar CTA matching the article's category tags
- "What this means for you" AI-generated plain-English summary (using Gemini Flash, no API key needed via Lovable AI)

**Navigation:** Added as "Consumer News" in the Resources MegaMenu dropdown.

---

### TOOL 5: Letter Strength Analyzer — `/analyze-letter`

**New page:** `src/pages/LetterAnalyzerPage.tsx`

**New edge function:** `supabase/functions/analyze-letter-strength/index.ts`

**UI Flow:**
1. Large textarea: "Paste your draft letter here"
2. Optional: Select dispute category (helps the AI score against the right criteria)
3. "Analyze My Letter" button

**AI Scoring (Gemini Flash — no API key, uses Lovable AI):**
The edge function sends the letter text + category to Gemini with a structured scoring prompt that evaluates:

| Dimension | Score /20 | What AI Checks |
|---|---|---|
| Legal Citations | /20 | Does it cite specific statutes? |
| Specific Deadlines | /20 | Does it set a clear response deadline? |
| Documentation Evidence | /20 | Does it reference supporting docs? |
| Tone & Professionalism | /20 | Is it firm but not aggressive? |
| Clear Demand | /20 | Is the desired outcome explicit? |

**Output:**
- Overall score with strength meter (reuses the existing `LetterStrengthMeter` component)
- Per-dimension scores with specific suggestions
- "See an example of a professionally crafted letter for this issue" — links to the matching template

**Rate limiting:** 3 free analyses per day per IP (tracked via a simple `letter_analyses` table). No login required to use.

```sql
CREATE TABLE public.letter_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  score integer,
  category text
);
```

---

## Navigation Integration

### MegaMenu — Resources Dropdown (expanded from 5 to 8 items)

Current resources list gets 3 new entries:
```
State Rights Lookup    — "Find laws for your state and dispute type"
Deadlines Calculator   — "See how long you have to act"
Consumer News          — "Latest FTC, CFPB & recall alerts"
Analyze My Letter      — "Get a free AI score on your draft"
```

### Mobile Menu (Header.tsx)
The "Resources" accordion section in the mobile sheet gets the same 4 new links added.

### Footer
New "Free Tools" column in the footer grid (currently has 4 columns, we add a 5th or merge into Resources):
- State Rights Lookup
- Deadlines Calculator
- Analyze My Letter
- Consumer News

### Internal Cross-Linking
- Every `CategoryGuidePage` gets a "Check Your State's Laws" inline CTA linking to `/state-rights?category=X`
- Every `LetterPage` gets a "How long do you have?" link near the form fields linking to `/deadlines?category=X`
- The news hub article cards link to matching template categories
- The letter analyzer results link to matching templates

---

## Files to Create / Edit

| File | Action | Description |
|---|---|---|
| `src/pages/StateRightsPage.tsx` | Create | Interactive state + category law lookup |
| `src/pages/DeadlinesPage.tsx` | Create | SOL calculator with countdown |
| `src/pages/ConsumerNewsPage.tsx` | Create | News hub with source filters |
| `src/pages/LetterAnalyzerPage.tsx` | Create | Free letter strength analyzer |
| `src/components/dashboard/DisputeTracker.tsx` | Create | Dispute outcome tracker component |
| `src/pages/Dashboard.tsx` | Edit | Add "My Disputes" tab |
| `src/components/layout/MegaMenu.tsx` | Edit | Add 4 new resource links |
| `src/components/layout/Header.tsx` | Edit | Add links to mobile menu |
| `src/components/layout/Footer.tsx` | Edit | Add "Free Tools" column |
| `src/pages/CategoryGuidePage.tsx` | Edit | Add cross-link CTA to State Rights |
| `src/pages/LetterPage.tsx` | Edit | Add cross-link to Deadlines calculator |
| `src/App.tsx` | Edit | Register 4 new routes |
| `src/routes.ts` | Edit | Add 4 routes for static generation |
| `supabase/functions/fetch-consumer-news/index.ts` | Create | RSS fetch + cache edge function |
| `supabase/functions/analyze-letter-strength/index.ts` | Create | AI letter scoring edge function |
| `supabase/config.toml` | Edit | Register 2 new edge functions |
| DB Migration | Create | `dispute_outcomes`, `consumer_news_cache`, `letter_analyses` tables |

---

## SEO Strategy

| Page | Schema Type | Keywords Targeted |
|---|---|---|
| `/state-rights` | FAQPage + WebApplication | "California consumer rights", "Texas lemon law", "[state] tenant rights" |
| `/deadlines` | FAQPage + WebApplication | "how long to dispute credit card charge", "statute of limitations consumer" |
| `/consumer-news` | NewsArticle | FTC alerts, CFPB rules, product recalls |
| `/analyze-letter` | WebApplication | "free dispute letter checker", "is my complaint letter good" |

All pages use the existing `SEOHead` component with proper breadcrumbs and canonical URLs at `letterofdispute.com`.

---

## Important Notes on Data Accuracy

- All statutes displayed come directly from `stateSpecificLaws.ts` which has real citations (e.g., `Cal. Civ. Code § 1750`, `Fla. Stat. § 501.201`) compiled from actual state legal codes
- AG office links are real government URLs already verified in the data
- Federal law deadlines come from `consumerRightsContent.ts` which cites actual law (60-day FCBA window is codified at 15 U.S.C. § 1666; 180-day HUD deadline is federal regulation)
- The news hub pulls directly from official government RSS feeds (FTC.gov, consumerfinance.gov) — no curation or summarization of the factual content
- A "Last reviewed: [date]" disclaimer is shown on each state law entry matching the existing pattern in guide pages
