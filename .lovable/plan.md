

# Redesign Article Hero Section

## Problems Identified

1. **Featured image glued to hero** - The `-mt-10` offset isn't enough; the image feels cramped against the blue header with no visual breathing room
2. **Personal author name exposed** - Shows "mario.smode" instead of a branded contributor name
3. **Header layout needs polish** - The transition from blue hero to image to content feels abrupt

---

## Solution

### Part 1: Replace Author Name with "LoD Contributor"

Change all author-related displays to use "LoD Contributor" instead of the database author field:

```typescript
// Instead of showing post.author
// Always display "LoD Contributor" as the author name
const displayAuthor = "LoD Contributor";

// Update authorInitials to use "LoD"
const authorInitials = "LoD";
```

Update all 3 locations where author appears:
- Hero section author info (line 363)
- Author bio section (line 438)
- JSON-LD schema (line 261)

### Part 2: Redesign Hero + Featured Image Layout

Create a more elegant, modern hero with proper spacing:

**New Design Concept:**
```
┌────────────────────────────────────────────────────────────────────┐
│  Breadcrumb: Home > Articles > Category > Title                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│                      [Blue gradient hero area]                     │
│                                                                    │
│        ┌─────────────────────────────────────────────────┐        │
│        │  [Category Badge]                                │        │
│        │                                                  │        │
│        │  The Consumer Rights Act: Your Power             │        │
│        │  Against Dodgy Builders                          │        │
│        │                                                  │        │
│        │  📅 January 15, 2025  •  ⏱ 7 min read           │        │
│        └─────────────────────────────────────────────────┘        │
│                                                                    │
│   ┌────────────────────────────────────────────────────────────┐  │
│   │                                                            │  │
│   │                   [FEATURED IMAGE]                         │  │
│   │              with rounded corners and shadow               │  │
│   │                                                            │  │
│   └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│                 LoD Contributor  •  Consumer Rights Expert         │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Key Changes:**
- Move author/meta info BELOW the featured image (currently above)
- Add more padding at the bottom of the hero (pb-24 instead of pb-0)
- Pull the featured image up more dramatically (-mt-16) into the hero
- Add a subtle white background card behind the content area
- Place author as a centered byline below the image

### Part 3: Simplified, Elegant Layout

```typescript
{/* Article Hero - Redesigned */}
<section className="bg-gradient-to-b from-primary via-primary to-primary/95 pt-8 pb-32 md:pb-40">
  <div className="container-narrow text-center">
    <Badge variant="secondary" className="mb-6">{post.category}</Badge>
    
    <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6 leading-tight">
      {post.title}
    </h1>
    
    {/* Meta info - simplified, centered */}
    <div className="flex justify-center items-center gap-4 text-primary-foreground/70 text-sm">
      <span className="flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        {formattedDate}
      </span>
      <span>•</span>
      <span className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        {calculatedReadTime}
      </span>
    </div>
  </div>
</section>

{/* Featured Image - Pulled up into hero with proper spacing */}
{post.featured_image_url && (
  <section className="bg-background">
    <div className="container-narrow -mt-20 md:-mt-28">
      <figure className="rounded-2xl overflow-hidden shadow-2xl border-4 border-background">
        <img src={post.featured_image_url} alt={post.title} className="w-full h-64 md:h-96 object-cover" />
      </figure>
      
      {/* Author byline below image */}
      <div className="flex justify-center items-center gap-3 mt-6">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-accent text-accent-foreground font-semibold text-sm">
            LoD
          </AvatarFallback>
        </Avatar>
        <div className="text-sm">
          <span className="font-medium text-foreground">LoD Contributor</span>
          <span className="text-muted-foreground"> • Consumer Rights Expert</span>
        </div>
      </div>
    </div>
  </section>
)}
```

### Part 4: Update Author Bio Section

Replace the author bio at the bottom of articles:

```typescript
<div className="mt-12 p-8 bg-muted/50 rounded-2xl border border-border">
  <div className="flex items-start gap-5">
    <Avatar className="h-16 w-16 border-2 border-primary/20">
      <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
        LoD
      </AvatarFallback>
    </Avatar>
    <div className="flex-1">
      <p className="text-sm text-muted-foreground mb-1">Written by</p>
      <h3 className="font-serif text-xl font-bold text-foreground mb-2">LoD Contributor</h3>
      <p className="text-muted-foreground leading-relaxed">
        Our team of consumer rights specialists at Letter Of Dispute (LoD) help UK consumers 
        navigate disputes with clear, actionable guidance backed by knowledge of the 
        Consumer Rights Act 2015 and related regulations.
      </p>
    </div>
  </div>
</div>
```

### Part 5: Update JSON-LD Schema

Change the author in structured data:

```typescript
"author": {
  "@type": "Person",
  "name": "LoD Contributor"
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/ArticlePage.tsx` | Redesign hero layout, move author below image, use "LoD Contributor" everywhere, increase hero padding, update author bio section |

---

## Visual Comparison

### Before (Current)
- Blue hero with author avatar + name inside
- Featured image with small `-mt-10` overlap
- "mario.smode" author name visible
- Cramped, image feels "glued"

### After (Redesigned)
- Clean, centered blue hero with title + meta only
- Featured image with dramatic `-mt-20` overlap
- Author byline centered below image
- "LoD Contributor" as branded author
- More visual breathing room
- Professional, polished appearance

