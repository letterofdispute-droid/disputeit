

# Linearity-Style Split Hero Redesign

## Reference Analysis

The Linearity blog layout features a dramatic split-screen hero:

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Breadcrumb                                                        Nav  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [DARK BACKGROUND - Left Side]     │  [FEATURED IMAGE - Right Side]     │
│                                    │                                     │
│                                    │  ┌─────────────────────────────┐   │
│                                    │  │ [Category Badge]            │   │
│                                    │  │                             │   │
│   Title Goes Here                  │  │  Title Goes Here            │   │
│   In Large Serif Font              │  │  On The Image               │   │
│                                    │  │                             │   │
│   Subtitle/excerpt text            │  └─────────────────────────────┘   │
│                                    │                                     │
│   By Author  |  Date  |  5 min     │                                     │
│                                    │                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

Key design elements:
- Full-width dark gradient background (deep teal/green to black)
- Split layout: 50/50 or 40/60
- Left: Title + subtitle + metadata (left-aligned)
- Right: Featured image with category badge overlay + title overlay
- Clean minimal spacing
- No overlap effects - clean separation

---

## Implementation Plan

### Hero Section Redesign

Transform the current stacked hero into a side-by-side split layout:

**Layout Structure:**
```tsx
<section className="bg-gradient-to-br from-[#1a2e2a] via-[#0f1f1d] to-[#0a1614] min-h-[500px] md:min-h-[600px]">
  <div className="container-wide h-full">
    <div className="grid md:grid-cols-2 gap-8 items-center py-12 md:py-16">
      
      {/* Left Side - Text Content */}
      <div className="text-left">
        <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="text-white/70 text-lg mb-8 max-w-lg">
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center gap-4 text-white/60 text-sm">
          <span>By LoD Contributor</span>
          <span>|</span>
          <span>📅 {formattedDate}</span>
          <span>|</span>
          <span>⏱ {readTime}</span>
        </div>
      </div>
      
      {/* Right Side - Featured Image Card */}
      <div className="relative">
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-6 pb-0">
            <Badge className="mb-4">{post.category}</Badge>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
              {post.title}
            </h2>
          </div>
          <img 
            src={post.featured_image_url} 
            alt={post.title}
            className="w-full h-64 object-cover"
          />
        </div>
      </div>
      
    </div>
  </div>
</section>
```

---

## Visual Design Details

### Color Scheme for Hero
- Background: Deep teal-to-black gradient (`from-[#1a2e2a] via-[#0f1f1d] to-[#0a1614]`)
- Text: Pure white for title, white/70 for subtitle, white/60 for metadata
- Right card: Light gray gradient background for the image card

### Featured Image Card Style
The right side contains a "floating" card with:
- Rounded corners (`rounded-2xl`)
- Subtle shadow (`shadow-2xl`)
- Light gray gradient background
- Category badge at top
- Title overlay in dark text
- Featured image at the bottom of the card

### Responsive Behavior
- **Desktop (md+)**: Side-by-side split layout
- **Mobile**: Stacked layout with text above, image below

---

## Content Section Updates

Keep the existing content section but refine:
- Move breadcrumb above the hero (already done)
- Adjust content area padding since hero now flows differently
- Maintain the sticky sidebar with TOC and share buttons

---

## File to Modify

| File | Changes |
|------|---------|
| `src/pages/ArticlePage.tsx` | Replace hero section with Linearity-inspired split layout |

---

## Technical Implementation

### New Hero Structure

```tsx
{/* Article Hero - Linearity-inspired split layout */}
<section className="bg-gradient-to-br from-[#1a2e2a] via-[#0f1f1d] to-[#0a1614]">
  <div className="container-wide py-12 md:py-20">
    <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
      
      {/* Left: Text Content */}
      <div className="order-2 md:order-1">
        <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
          {post.title}
        </h1>
        
        {post.excerpt && (
          <p className="text-white/70 text-lg md:text-xl mb-8 leading-relaxed">
            {post.excerpt}
          </p>
        )}
        
        <div className="flex flex-wrap items-center gap-3 md:gap-4 text-sm text-white/60">
          <span className="flex items-center gap-2">
            <User className="h-4 w-4" />
            LoD Contributor
          </span>
          <span className="hidden sm:inline text-white/40">|</span>
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {formattedDate}
          </span>
          <span className="hidden sm:inline text-white/40">|</span>
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {calculatedReadTime}
          </span>
        </div>
      </div>
      
      {/* Right: Featured Image Card */}
      <div className="order-1 md:order-2">
        {post.featured_image_url ? (
          <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            {/* Card Header */}
            <div className="p-6 pb-4">
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary bg-white">
                {post.category}
              </Badge>
              <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground leading-snug">
                {post.title}
              </h2>
            </div>
            {/* Featured Image */}
            <img 
              src={post.featured_image_url} 
              alt={post.title}
              className="w-full h-48 md:h-64 object-cover"
            />
          </div>
        ) : (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 shadow-2xl">
            <Badge variant="outline" className="mb-4">{post.category}</Badge>
            <h2 className="font-serif text-2xl font-bold text-foreground">
              {post.title}
            </h2>
          </div>
        )}
      </div>
      
    </div>
  </div>
</section>
```

---

## Expected Result

### Before (Current)
- Blue gradient centered layout
- Title centered above
- Featured image pulls up with overlap effect
- Author byline below image

### After (Linearity-Style)
- Dark teal/green gradient
- Split 50/50 layout
- Left: Large title + subtitle + meta (left-aligned)
- Right: Card with category badge, title overlay, and featured image
- Modern, editorial, magazine-quality appearance
- No overlap effects - clean professional separation

