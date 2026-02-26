

## Problem

The `SmallClaimsStatePage.tsx` hero uses `style={{ background: 'var(--gradient-hero)' }}` which renders as white/invisible. All other tool and content pages use the standard pattern: a background image (`/images/tools-hero-bg.jpg`) with a `bg-primary/45` overlay.

## Fix

Update the hero `<section>` in `SmallClaimsStatePage.tsx` (line 85) to match the standard hero pattern used by other small claims pages:

**Before (line 85):**
```html
<section style={{ background: 'var(--gradient-hero)' }} className="text-primary-foreground py-16 md:py-20">
  <div className="container-wide">
```

**After:**
```html
<section className="relative overflow-hidden text-primary-foreground py-16 md:py-20">
  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/tools-hero-bg.jpg')" }} />
  <div className="absolute inset-0 bg-primary/45" />
  <div className="container-wide relative z-10">
```

Single file change: `src/pages/SmallClaimsStatePage.tsx`, lines 85-86.

