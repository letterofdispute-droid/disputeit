

# Fix Breadcrumb, Hero Gradient & Enhanced Table of Contents

## Problems Identified

1. **Breadcrumb shows slug format** - The breadcrumb for category is showing "consumer-rights" instead of "Consumer Rights" (the proper display name)
2. **Hero gradient is greenish** - Current HSL values create a subtle green tint; needs pure dark blue
3. **Table of Contents needs enhancement** - Current ToC is in the sidebar; user wants a Linearity-style left ToC with active state tracking

---

## Solution

### Part 1: Fix Breadcrumb Category Display

Looking at line 304-305 of ArticlePage.tsx:
```tsx
<Link to={`/articles/${post.category_slug}`} className="...">
  {post.category}  // This should show "Consumer Rights" from the category field
</Link>
```

The issue is that `post.category` from the database might be storing the slug instead of the display name. Need to add a helper function to convert category slugs to proper names:

```typescript
// Convert category slug to display name
const formatCategoryName = (categorySlug: string): string => {
  return categorySlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Use in breadcrumb
{post.category || formatCategoryName(post.category_slug)}
```

Also apply this to the hero section where category appears in the badge (lines 362, 372).

---

### Part 2: Change Hero Gradient to Dark Blue

Replace the current gradient with a pure dark blue theme:

**Current (greenish tint):**
```tsx
bg-gradient-to-br from-[hsl(220,40%,12%)] via-[hsl(224,45%,8%)] to-[hsl(230,50%,4%)]
```

**New (dark blue matching primary):**
```tsx
bg-gradient-to-br from-[hsl(221,50%,15%)] via-[hsl(221,55%,10%)] to-[hsl(221,60%,5%)]
```

Using HSL 221 consistently (the primary blue hue) to create a cohesive dark blue gradient that matches the site's branding.

---

### Part 3: Enhanced Table of Contents (Linearity-Style)

Transform the current sidebar ToC into a premium left-side component that matches the Linearity reference:

**Design Elements:**
- Fixed position on the left side of content
- "In this article" header with list icon
- Vertical line connecting headings
- Active dot indicator showing current section
- Muted text for headings, highlight on active/hover
- Scroll-aware active state tracking

**Layout Structure:**
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  ┌──────────────────┐   Article Content                                │
│  │ In this article  │                                                  │
│  │                  │   [Content paragraphs...]                        │
│  │ ● Heading One ◄──│──────────────────────────────────────────────── │
│  │ │                │                                                  │
│  │ ○ Heading Two    │                                                  │
│  │ │                │                                                  │
│  │ ○ Heading Three  │                                                  │
│  │ │                │                                                  │
│  │ ○ Heading Four   │                                                  │
│  └──────────────────┘                                                  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Implementation Approach:**

1. Add scroll-based active heading tracking with `IntersectionObserver`
2. Create a left-aligned ToC component with visual connecting line
3. Show filled dot for active section, empty dots for others
4. Keep the existing sidebar for share buttons and CTA

**New Code Structure:**

```tsx
// State for active heading
const [activeHeading, setActiveHeading] = useState<string>('');

// Intersection Observer for heading tracking
useEffect(() => {
  if (tableOfContents.length === 0) return;
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveHeading(entry.target.id);
        }
      });
    },
    { rootMargin: '-100px 0px -70% 0px' }
  );

  tableOfContents.forEach((item) => {
    const element = document.getElementById(item.id);
    if (element) observer.observe(element);
  });

  return () => observer.disconnect();
}, [tableOfContents]);
```

**ToC Component Styling:**
```tsx
{/* Left-side Table of Contents - Linearity Style */}
{tableOfContents.length > 0 && (
  <aside className="hidden xl:block fixed left-8 top-1/2 -translate-y-1/2 w-64 z-40">
    <div className="p-5 bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm">
      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-sm">
        <List className="h-4 w-4 text-primary" />
        In this article
      </h3>
      <nav className="relative">
        {/* Vertical connecting line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-border" />
        
        <ul className="space-y-3">
          {tableOfContents.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              {/* Dot indicator */}
              <span className={`relative z-10 mt-1.5 w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                activeHeading === item.id 
                  ? 'bg-primary border-primary' 
                  : 'bg-background border-border'
              }`} />
              
              <a 
                href={`#${item.id}`}
                className={`text-sm leading-snug transition-colors ${
                  activeHeading === item.id 
                    ? 'text-foreground font-medium' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  </aside>
)}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/ArticlePage.tsx` | Fix category name display in breadcrumb and hero, change gradient to dark blue, add enhanced left-side ToC with scroll tracking |

---

## Summary of Changes

| Issue | Before | After |
|-------|--------|-------|
| Breadcrumb category | "consumer-rights" | "Consumer Rights" |
| Hero gradient | Greenish tint (mixed hues) | Dark blue (consistent HSL 221) |
| Table of Contents | Right sidebar only | Left-side Linearity-style ToC with active tracking + right sidebar share |

---

## Expected Result

- Breadcrumb will show properly formatted category names like "Consumer Rights" instead of slug format
- Hero background will be a consistent dark blue tone matching the site's primary color
- Premium Table of Contents on the left side with visual connecting line, dot indicators, and active section highlighting (visible on xl screens and above)

