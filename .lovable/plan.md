
# SEO Content Command Center - Implementation Plan

## Executive Summary

Building an enterprise-grade SEO content orchestration system that treats each of your 450+ templates as a "conversion hub" with AI-powered content clusters. The system will manage a three-tier content hierarchy (Templates > Guides > Blog Articles), enable bulk generation, and intelligently handle internal linking post-creation.

---

## Architecture Overview

```text
                           ┌────────────────────────────────────────────┐
                           │        SEO CONTENT COMMAND CENTER          │
                           │           /admin/seo-dashboard             │
                           └─────────────────────┬──────────────────────┘
                                                 │
          ┌──────────────────────────────────────┼──────────────────────────────────────┐
          │                                      │                                       │
          ▼                                      ▼                                       ▼
┌─────────────────────┐           ┌─────────────────────────┐           ┌─────────────────────────┐
│   CONTENT PLANNER   │           │    BULK GENERATOR       │           │   LINK INTELLIGENCE     │
│                     │           │                         │           │                         │
│ • Template Map      │           │ • Queue Management      │           │ • Content Scanner       │
│ • Cluster Designer  │           │ • Article Types         │           │ • Anchor Suggestions    │
│ • Gap Analysis      │           │ • Batch Processing      │           │ • Bulk Link Injection   │
│ • Calendar View     │           │ • Image Selection       │           │ • Link Health Monitor   │
└─────────────────────┘           └─────────────────────────┘           └─────────────────────────┘
```

---

## Three-Tier Content Hierarchy

### Tier 1: Templates (450+ existing)
- **Purpose:** Conversion points (purchase letters)
- **SEO Role:** Target transactional keywords
- **URL Structure:** `/templates/:category/:subcategory/:slug`
- **Links TO:** Related articles, guides
- **Links FROM:** All supporting content

### Tier 2: Guides (13 existing)
- **Purpose:** Authority/trust building
- **SEO Role:** Target informational "rights" keywords
- **URL Structure:** `/guides/:category`
- **Links TO:** Templates, articles
- **Links FROM:** Articles

### Tier 3: Blog Articles (unlimited)
- **Purpose:** Traffic magnets, long-tail capture
- **SEO Role:** Target awareness/how-to keywords
- **URL Structure:** `/articles/:category/:slug`
- **Links TO:** Templates (primary), guides, other articles
- **Links FROM:** External sites, social

---

## Content Cluster Strategy (8-10 Articles per Template)

### Article Type Matrix

| Type | Purpose | Example for "Flight Delay Compensation" |
|------|---------|----------------------------------------|
| How-To Guide | Step-by-step instructions | "How to Claim EU261 Compensation Step-by-Step" |
| Mistakes to Avoid | Prevent common errors | "7 Mistakes That Get Flight Delay Claims Rejected" |
| Rights Explainer | Educational authority | "Your Rights Under EU261: What Airlines Won't Tell You" |
| Sample/Example | Show real scenarios | "Flight Delay Compensation Letter Examples That Worked" |
| FAQ/Q&A | Capture question keywords | "Flight Delay Compensation FAQ: 15 Questions Answered" |
| Case Study | Social proof/scenarios | "How Sarah Got 600 Compensation After 5-Hour Delay" |
| Comparison | Decision support | "EU261 vs Montreal Convention: Which Applies to Your Delay?" |
| Checklist | Actionable resource | "Complete Checklist Before Filing Your Flight Delay Claim" |

### Template Value Classification

| Tier | Article Count | Description |
|------|---------------|-------------|
| High Value | 10 articles | High-traffic categories (Travel, Insurance, Financial) |
| Medium Value | 6-8 articles | Standard coverage (Housing, Vehicle, Healthcare) |
| Long-Tail | 4-5 articles | Basic focused coverage (HOA, Contractors subsections) |

---

## Database Schema Changes

### New Tables

```sql
-- Content planning and tracking
CREATE TABLE content_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_slug TEXT NOT NULL,
  template_name TEXT NOT NULL,
  category_id TEXT NOT NULL,
  subcategory_slug TEXT,
  value_tier TEXT NOT NULL DEFAULT 'medium', -- high, medium, longtail
  target_article_count INTEGER NOT NULL DEFAULT 8,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Individual article queue
CREATE TABLE content_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES content_plans(id) ON DELETE CASCADE,
  article_type TEXT NOT NULL, -- how-to, mistakes, rights, sample, faq, case-study, comparison, checklist
  suggested_title TEXT NOT NULL,
  suggested_keywords TEXT[],
  priority INTEGER DEFAULT 50, -- 1-100, higher = more urgent
  status TEXT DEFAULT 'queued', -- queued, generating, generated, published, failed
  blog_post_id UUID REFERENCES blog_posts(id),
  generated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Link suggestions (post-generation scanner)
CREATE TABLE link_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL, -- template, article, guide
  target_slug TEXT NOT NULL,
  target_title TEXT NOT NULL,
  anchor_text TEXT NOT NULL,
  context_snippet TEXT, -- surrounding text for context
  insert_position INTEGER, -- character position in content
  relevance_score INTEGER, -- 0-100
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, applied
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add template linking to existing blog_posts
ALTER TABLE blog_posts 
  ADD COLUMN related_templates TEXT[] DEFAULT '{}',
  ADD COLUMN content_plan_id UUID REFERENCES content_plans(id),
  ADD COLUMN article_type TEXT;
```

---

## Edge Functions

### 1. `generate-content-plan` (NEW)
Auto-generates content plan for a template based on category/value tier.

**Input:**
```typescript
{
  templateSlug: string;
  valueTier: 'high' | 'medium' | 'longtail';
}
```

**Output:**
```typescript
{
  planId: string;
  queuedArticles: Array<{
    type: string;
    suggestedTitle: string;
    suggestedKeywords: string[];
  }>;
}
```

### 2. `bulk-generate-articles` (NEW)
Processes queued articles in batches with rate limiting.

**Input:**
```typescript
{
  planId?: string;        // Generate for specific plan
  categoryId?: string;    // Generate for entire category
  batchSize?: number;     // Default 5
  articleTypes?: string[]; // Filter by type
}
```

**Behavior:**
- Fetches queued items matching criteria
- Calls existing `generate-blog-content` for each
- Calls `suggest-images` for each
- Updates queue status
- Stores results in blog_posts with `related_templates` populated

### 3. `scan-for-links` (NEW)
AI-powered content scanner that finds linking opportunities.

**Input:**
```typescript
{
  postId?: string;        // Scan single post
  categoryId?: string;    // Scan all posts in category
  minRelevance?: number;  // Filter threshold (default 70)
}
```

**Logic:**
1. Extract all existing templates, articles, guides as potential targets
2. For each post, use AI to:
   - Identify phrases that could naturally link to templates
   - Find mentions of related topics covered by other articles
   - Suggest anchor text variations
3. Store suggestions in `link_suggestions` table

### 4. `apply-links-bulk` (NEW)
Applies approved link suggestions to article content.

**Input:**
```typescript
{
  suggestionIds?: string[];  // Specific suggestions
  categoryId?: string;       // All approved in category
  autoApprove?: boolean;     // Apply all with relevance > 85
}
```

**Behavior:**
- Fetches approved suggestions
- Injects `<a href="...">anchor</a>` at specified positions
- Updates `blog_posts.content`
- Marks suggestions as applied

---

## Admin UI Components

### 1. SEO Dashboard (`/admin/seo-dashboard`)

Main command center with four tabs:

**Tab 1: Template Coverage Map**
```text
┌─────────────────────────────────────────────────────────────────────┐
│  TEMPLATE COVERAGE                                      [Filter ▼]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TRAVEL (20 templates)                               [Plan All]     │
│  ├── Flight Delay Compensation    ████████░░ 8/10    [View Plan]   │
│  ├── Lost Baggage Claim          ██████░░░░ 6/10    [View Plan]   │
│  ├── Denied Boarding             ░░░░░░░░░░ 0/10    [Create Plan] │
│  └── ...                                                            │
│                                                                     │
│  INSURANCE (50 templates)                            [Plan All]     │
│  ├── Claim Denial Appeal         ██████████ 10/10   [Complete]    │
│  ├── Home Insurance Dispute      ████░░░░░░ 4/10    [View Plan]   │
│  └── ...                                                            │
│                                                                     │
│  FINANCIAL (50 templates)                            [Plan All]     │
│  └── ...                                                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Tab 2: Content Queue**
```text
┌─────────────────────────────────────────────────────────────────────┐
│  CONTENT QUEUE                 [Generate Batch (10)] [Clear Failed]│
├─────────────────────────────────────────────────────────────────────┤
│  □ │ Title                           │ Type      │ Template │ Status│
├───┼──────────────────────────────────┼───────────┼──────────┼───────┤
│  ☑ │ 7 Mistakes That Get Claims...   │ Mistakes  │ EU261    │ Queued│
│  ☑ │ How to Write a Compensation...  │ How-To    │ EU261    │ Queued│
│  □ │ Flight Delay Rights Explained   │ Rights    │ EU261    │ Gen...│
│  □ │ Real Flight Delay Examples      │ Sample    │ EU261    │ Done  │
└─────────────────────────────────────────────────────────────────────┘
│  [Generate Selected (2)]  [Preview]  [Edit]  [Delete]              │
└─────────────────────────────────────────────────────────────────────┘
```

**Tab 3: Link Intelligence**
```text
┌─────────────────────────────────────────────────────────────────────┐
│  LINK SUGGESTIONS                      [Scan Category ▼] [Scan All]│
├─────────────────────────────────────────────────────────────────────┤
│  PENDING (47)                                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ "7 Mistakes That Get Claims Rejected"                         │ │
│  │ → Link "EU261 compensation" to /templates/travel/flight-delay │ │
│  │   Anchor: "EU261 compensation letter"                         │ │
│  │   Relevance: 92%                                              │ │
│  │   Context: "...before filing your EU261 compensation claim..."│ │
│  │   [✓ Approve] [✗ Reject] [Edit Anchor]                       │ │
│  └───────────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ ...more suggestions...                                        │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  [Approve All >85%]  [Apply Approved (12)]                         │
└─────────────────────────────────────────────────────────────────────┘
```

**Tab 4: Analytics & Calendar**
```text
┌─────────────────────────────────────────────────────────────────────┐
│  CONTENT CALENDAR                                    [Month ▼] Feb │
├─────────────────────────────────────────────────────────────────────┤
│  Mon    │ Tue    │ Wed    │ Thu    │ Fri    │ Sat    │ Sun         │
│─────────┼────────┼────────┼────────┼────────┼────────┼─────────────│
│    3    │    4   │    5   │    6   │    7   │    8   │    9        │
│ 2 posts │        │ 3 posts│        │ 5 posts│        │             │
│ ● ●     │        │ ● ● ●  │        │ ● ● ●  │        │             │
│─────────┴────────┴────────┴────────┴─● ●────┴────────┴─────────────│
│                                                                     │
│  COVERAGE STATS                                                    │
│  • Templates with 0 articles: 312                                  │
│  • Templates with 1-5 articles: 98                                 │
│  • Templates with 6+ articles: 40                                  │
│  • Total articles generated: 1,240                                 │
│  • Internal links applied: 4,892                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### 2. Cluster Planner Component

Modal/slide-out for designing content cluster for a specific template:

```text
┌─────────────────────────────────────────────────────────────────────┐
│  CONTENT CLUSTER: Flight Delay Compensation Letter        [× Close]│
├─────────────────────────────────────────────────────────────────────┤
│  Value Tier: [High ▼]  Target Articles: 10                         │
│                                                                     │
│  ARTICLE PLAN                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ☑ How-To Guide                                                │  │
│  │   Title: How to Claim EU261 Compensation Step-by-Step        │  │
│  │   Keywords: eu261 claim, flight delay compensation, how to   │  │
│  │   [Edit] [Remove]                                             │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ ☑ Mistakes to Avoid                                           │  │
│  │   Title: 7 Mistakes That Get Flight Delay Claims Rejected    │  │
│  │   Keywords: claim mistakes, rejected claim, flight delay     │  │
│  │   [Edit] [Remove]                                             │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ ☑ Rights Explainer                                            │  │
│  │   Title: Your Rights Under EU261: What Airlines Won't Tell   │  │
│  │   Keywords: eu261 rights, passenger rights, airline delay    │  │
│  │   [Edit] [Remove]                                             │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │ + Add Article Type...                                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  [Save Plan] [Save & Generate All] [Cancel]                        │
└─────────────────────────────────────────────────────────────────────┘
```

### 3. Enhanced Article Generator

Update existing `AIBlogGenerator` to support:
- Template linking (select related template)
- Article type selection
- Auto-populated keywords from template
- Queue integration

---

## Linking Intelligence System

### Post-Creation Link Scanner Flow

```text
Article Generated
       │
       ▼
┌─────────────────┐
│  scan-for-links │
│  Edge Function  │
└────────┬────────┘
         │
         ▼
   AI Analysis
   • Find template mentions
   • Find topic overlaps
   • Extract potential anchors
         │
         ▼
┌─────────────────────────┐
│  link_suggestions table │
│  (status: pending)      │
└────────┬────────────────┘
         │
         ▼
   Admin Reviews
   • Approve/Reject each
   • Edit anchor text
   • Bulk approve >85%
         │
         ▼
┌─────────────────────────┐
│  apply-links-bulk       │
│  Edge Function          │
└────────┬────────────────┘
         │
         ▼
   Links Injected
   • blog_posts.content updated
   • status: applied
```

### Link Types Detected

1. **Template Links** (highest priority)
   - Match template titles, keywords, use cases
   - Example: "flight delay compensation" -> link to template

2. **Article Links** (medium priority)
   - Match related article titles within same category
   - Example: "common mistakes" -> link to mistakes article

3. **Guide Links** (lower priority)
   - Match category rights/guide topics
   - Example: "your rights" -> link to category guide

---

## Implementation Phases

### Phase 1: Database & Core Functions (Week 1)
- Create database tables with migrations
- Build `generate-content-plan` edge function
- Build `bulk-generate-articles` edge function
- Update existing `generate-blog-content` to accept template context

### Phase 2: Admin UI Foundation (Week 1-2)
- Create SEO Dashboard page structure
- Build Template Coverage Map component
- Build Cluster Planner modal
- Add navigation to admin sidebar

### Phase 3: Queue Management (Week 2)
- Build Content Queue tab UI
- Implement batch generation controls
- Add progress tracking and status updates
- Handle errors gracefully with retry

### Phase 4: Link Intelligence (Week 2-3)
- Build `scan-for-links` edge function
- Build `apply-links-bulk` edge function
- Create Link Suggestions UI
- Implement bulk approval workflow

### Phase 5: Analytics & Polish (Week 3)
- Build Calendar view
- Add coverage statistics
- Create gap analysis reports
- Performance optimization

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/generate-content-plan/index.ts` | AI plan generation |
| `supabase/functions/bulk-generate-articles/index.ts` | Batch processing |
| `supabase/functions/scan-for-links/index.ts` | Link opportunity finder |
| `supabase/functions/apply-links-bulk/index.ts` | Link injection |
| `src/pages/admin/SEODashboard.tsx` | Main command center |
| `src/components/admin/seo/TemplateCoverageMap.tsx` | Coverage visualization |
| `src/components/admin/seo/ContentQueue.tsx` | Queue management |
| `src/components/admin/seo/ClusterPlanner.tsx` | Plan designer modal |
| `src/components/admin/seo/LinkSuggestions.tsx` | Link review UI |
| `src/components/admin/seo/ContentCalendar.tsx` | Calendar view |
| `src/components/admin/seo/CoverageStats.tsx` | Analytics cards |
| `src/hooks/useContentPlans.ts` | Plan CRUD operations |
| `src/hooks/useContentQueue.ts` | Queue management |
| `src/hooks/useLinkSuggestions.ts` | Link operations |
| `src/config/articleTypes.ts` | Article type definitions |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/AdminLayout.tsx` | Add "SEO Dashboard" nav item |
| `src/App.tsx` | Add `/admin/seo-dashboard` route |
| `src/pages/LetterPage.tsx` | Add "Related Articles" section |
| `src/pages/ArticlePage.tsx` | Show linked templates as CTAs |
| `supabase/functions/generate-blog-content/index.ts` | Accept template context |

---

## Scale Projections

| Metric | Foundation | Growth | Scale |
|--------|------------|--------|-------|
| Templates covered | 50 | 200 | 450+ |
| Articles per template | 4-5 | 6-8 | 8-10 |
| Total articles | 200-250 | 1,200-1,600 | 3,600-4,500 |
| Internal links | 1,000 | 6,000 | 18,000+ |
| Estimated generation time | 2-3 days | 1-2 weeks | 3-4 weeks |

---

## Key Differentiators

1. **Template-First Strategy:** Every article exists to support a conversion point
2. **AI Keyword Extraction:** Keywords derived from template context, not guessed
3. **Post-Generation Linking:** Links added intelligently after content exists
4. **Batch Processing:** Rate-limited queue prevents API overload
5. **Human-in-Loop:** Approve links before injection for quality control
6. **Coverage Visualization:** Instantly see gaps in content strategy
