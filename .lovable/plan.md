

# Mega Menu Restructure: 5 Top-Level Items

## New Structure

```text
┌────────────────────────────────────────────────────────────────────────┐
│  Logo   Letter Templates ▾   Free Tools ▾   Learn ▾   Get Started   Pricing │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. Letter Templates (keep as-is)
13-category grid, 980px. No changes.

### 2. Free Tools (new dropdown, extracted from Resources)
~700px, two-column layout:

```text
┌──────────────────────────────────────────────────────────────┐
│  ASSESSMENT & ANALYSIS           │  COURT & LEGAL            │
│  ○ Do I Have a Case?             │  ○ Small Claims Guide     │
│  ○ Analyze My Letter             │  ○ Court Cost Calculator  │
│  ○ Deadlines Calculator          │  ○ Demand Letter Compare  │
│  ○ Consumer News                 │  ○ Escalation Flowchart   │
├──────────────────────────────────────────────────────────────┤
│  STATE LAWS  CA California  TX Texas  NY New York  FL ...   │
│                                         Browse all 50 →     │
└──────────────────────────────────────────────────────────────┘
```

### 3. Learn (new dropdown, articles-focused)
~780px, two-column layout with a featured article card:

```text
┌────────────────────────────────────────────────────────────────┐
│  GUIDES & KNOWLEDGE              │  LATEST ARTICLE            │
│  ○ Consumer Rights Guides        │  ┌──────────────────────┐  │
│  ○ All Articles (500+ expert)    │  │  [image]             │  │
│  ○ Knowledge Center              │  │  Article title here  │  │
│                                  │  │  Feb 24, 2026        │  │
│                                  │  └──────────────────────┘  │
├────────────────────────────────────────────────────────────────┤
│  📖 Browse all articles →                                     │
└────────────────────────────────────────────────────────────────┘
```

- Fetches the single most recent published `blog_posts` row via `useQuery` for the preview card
- Fallback: if no article, hides the card column and goes single-column

### 4. Get Started (direct link, no dropdown)
Points to `/how-it-works`. Contains the items previously under "General" in Resources:
- **Not** a dropdown — it's a single link like Pricing
- The items (FAQ, About, Contact) move to the footer and are already in the mobile menu

### 5. Pricing (keep as direct link)
No changes.

## Where Do FAQ, About, Contact Go?

These are low-traffic informational pages. They remain in:
- The **footer** (already linked there)
- The **mobile accordion menu** (already there)
- Removing them from the mega menu declutters it — they don't drive conversions

## Technical Changes

| File | Change |
|------|--------|
| `src/components/layout/MegaMenu.tsx` | 1. Remove the "Resources" `NavigationMenuItem`. 2. Add "Free Tools" dropdown with two-column grouped layout (assessment vs court/legal) + state laws footer. 3. Add "Learn" dropdown with guides/articles column + latest article preview card (useQuery from `blog_posts`). 4. Add "Get Started" as a direct `Link` to `/how-it-works` (same pattern as Pricing). 5. Remove `resources` array; split `freeTools` into two sub-arrays. |
| `src/components/layout/Header.tsx` | Update mobile accordion: rename "Resources" to split into "Free Tools" and "Learn" sections. Add "Get Started" as a direct link (like Pricing). Remove duplicated FAQ/About/Contact from accordion if desired, or keep for mobile discoverability. |

### Free Tools Grouping

```typescript
const assessmentTools = [
  { title: 'Do I Have a Case?', href: '/do-i-have-a-case', icon: Scale, description: 'Free case assessment' },
  { title: 'Analyze My Letter', href: '/analyze-letter', icon: Search, description: 'AI draft scoring' },
  { title: 'Deadlines Calculator', href: '/deadlines', icon: Clock, description: 'Time limits to act' },
  { title: 'Consumer News', href: '/consumer-news', icon: Newspaper, description: 'FTC & CFPB alerts' },
];

const courtTools = [
  { title: 'Small Claims Guide', href: '/small-claims', icon: Search, description: 'Filing limits & forms' },
  { title: 'Court Cost Calculator', href: '/small-claims/cost-calculator', icon: Calculator, description: 'Estimate filing fees' },
  { title: 'Demand Letter Compare', href: '/small-claims/demand-letter-cost', icon: DollarSign, description: 'DIY vs. lawyer costs' },
  { title: 'Escalation Flowchart', href: '/small-claims/escalation-guide', icon: GitBranch, description: 'Best resolution path' },
  { title: 'State Rights Lookup', href: '/state-rights', icon: MapPin, description: 'Laws for your state' },
];
```

### Latest Article Query

```typescript
const { data: latestPost } = useQuery({
  queryKey: ['latest-post-nav'],
  queryFn: async () => {
    const { data } = await supabase
      .from('blog_posts')
      .select('title, slug, featured_image_url, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(1);
    return data?.[0] || null;
  },
  staleTime: 5 * 60 * 1000, // 5 min cache
});
```

