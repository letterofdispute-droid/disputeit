
# SEO Static Content Injection with Loading Overlay

## Overview

This plan implements **Option B** - injecting pre-rendered HTML content into `index.html` during the build process, with a CSS loading overlay that masks the brief "flash" when React takes over. Bots will see full page content in the source, while human users will see a professional loading animation instead of raw content replacement.

## How It Works

```text
BUILD TIME:
┌─────────────────────────────────────────────────────────────────┐
│ 1. Vite builds React app → dist/index.html (empty root)        │
│ 2. Post-build script runs                                      │
│    └─→ Injects static HTML content into <div id="root">        │
│    └─→ Adds CSS loading overlay (visible by default)           │
│ 3. Final dist/index.html has full content + overlay            │
└─────────────────────────────────────────────────────────────────┘

RUNTIME:
┌─────────────────────────────────────────────────────────────────┐
│ BOTS (Googlebot, etc):                                          │
│ → See full HTML content in page source ✓                        │
│ → Don't execute JavaScript                                      │
│ → Index all content immediately ✓                               │
├─────────────────────────────────────────────────────────────────┤
│ HUMAN USERS:                                                    │
│ → Browser loads page with overlay visible                       │
│ → Overlay shows branded loading animation                       │
│ → React loads, removes overlay (300-600ms)                      │
│ → User sees interactive React app                               │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Steps

### Step 1: Create Content Injection Script

Create `scripts/inject-homepage-content.mjs` that:

1. Reads the built `dist/index.html` after Vite completes
2. Generates static HTML matching the homepage structure:
   - Header with navigation links
   - Hero section with H1 headline and description
   - Category grid with all 13 categories (linked)
   - FAQ summary section
   - Footer with all navigation links
3. Adds a CSS loading overlay directly in the HTML
4. Injects the content into `<div id="root">`
5. Writes the modified HTML back to `dist/index.html`

**Static content to include:**

| Section | What Gets Injected |
|---------|-------------------|
| Header | Logo, navigation links (Templates, How It Works, FAQ, Pricing, About, Contact) |
| Hero | H1: "Professional Dispute Letters, Without the Guesswork", description, CTA placeholders |
| Categories | All 13 categories with names, descriptions, and links to `/templates/{id}` |
| How It Works | Summary of the 3-step process |
| Footer | All footer links, disclaimer text, copyright |

### Step 2: Add Loading Overlay

The overlay will be embedded directly in `index.html` with:

**CSS (inline in `<head>`):**
```css
#loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: hsl(210 20% 98%); /* matches --background */
  transition: opacity 0.3s ease-out;
}
#loading-overlay.hidden {
  opacity: 0;
  pointer-events: none;
}
#loading-overlay .spinner {
  /* Animated spinner matching brand colors */
  width: 48px;
  height: 48px;
  border: 3px solid hsl(214 32% 91%);
  border-top-color: hsl(222 47% 20%); /* primary */
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**HTML (inside `<body>`, before `#root`):**
```html
<div id="loading-overlay">
  <img src="/ld-logo.svg" alt="Loading" style="height:40px;margin-bottom:16px;">
  <div class="spinner"></div>
</div>
```

### Step 3: Modify React to Remove Overlay

Update `src/main.tsx` to remove the overlay after React renders:

```typescript
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);
  root.render(<App />);
  
  // Remove loading overlay after React mounts
  requestAnimationFrame(() => {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      // Remove from DOM after fade animation
      setTimeout(() => overlay.remove(), 300);
    }
  });
}
```

### Step 4: Update Build Pipeline

Modify `vite.config.ts` to run the content injection script after the static file generator:

```typescript
const staticFileGenerator = () => ({
  name: 'static-file-generator',
  async closeBundle() {
    console.log('\n🗺️  Generating static HTML files for SEO...');
    try {
      // Generate route-specific static files
      const { stdout, stderr } = await execAsync('node scripts/build-static.mjs');
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      
      // Inject content into main index.html
      const { stdout: injectOut } = await execAsync('node scripts/inject-homepage-content.mjs');
      if (injectOut) console.log(injectOut);
    } catch (error) {
      console.error('❌ Error generating static files:', error);
      throw error;
    }
  }
});
```

### Step 5: Clean Up Dead Code

Remove or update files that are no longer needed:

| File | Action |
|------|--------|
| `netlify.toml` | Delete - not used on Lovable hosting |
| `scripts/build-static.mjs` | Keep but simplify - focus on sitemap generation |

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `scripts/inject-homepage-content.mjs` | **CREATE** | Inject static content + overlay into index.html |
| `src/main.tsx` | Modify | Add overlay removal logic |
| `vite.config.ts` | Modify | Run injection script after build |
| `netlify.toml` | Delete | Remove dead code |

---

## What Users Will See

### Before (Current State)
- **Bots**: Empty `<div id="root"></div>` - no content to index
- **Humans**: React app loads normally

### After (With This Implementation)
- **Bots**: Full HTML content including:
  - Heading: "Professional Dispute Letters, Without the Guesswork"
  - All 13 category links with descriptions
  - Footer navigation and legal links
  - Proper semantic structure (h1, h2, nav, main, footer)
  
- **Humans**: 
  - Brief branded loading overlay (~300-600ms)
  - Smooth fade transition to React app
  - No "flash" of unstyled/replaced content

---

## Expected Page Source After Implementation

```html
<body>
  <!-- Loading overlay - visible initially -->
  <div id="loading-overlay">
    <img src="/ld-logo.svg" alt="Loading" style="height:40px;margin-bottom:16px;">
    <div class="spinner"></div>
  </div>
  
  <!-- Pre-rendered content for SEO -->
  <div id="root">
    <header>
      <nav>
        <a href="/">DisputeLetters</a>
        <a href="/templates">Letter Templates</a>
        <a href="/how-it-works">How It Works</a>
        <a href="/faq">FAQ</a>
        <a href="/pricing">Pricing</a>
      </nav>
    </header>
    
    <main>
      <section class="hero">
        <h1>Professional Dispute Letters, Without the Guesswork</h1>
        <p>Pre-validated letter templates with controlled language...</p>
      </section>
      
      <section id="letters">
        <h2>Choose Your Letter Type</h2>
        <div class="categories">
          <a href="/templates/refunds">
            <h3>Refunds & Purchases</h3>
            <p>Get your money back for products...</p>
          </a>
          <a href="/templates/housing">
            <h3>Landlord & Housing</h3>
            <p>Request repairs, address deposit disputes...</p>
          </a>
          <!-- All 13 categories -->
        </div>
      </section>
    </main>
    
    <footer>
      <a href="/privacy">Privacy Policy</a>
      <a href="/terms">Terms of Service</a>
      <p>© 2025 DisputeLetters. All rights reserved.</p>
    </footer>
  </div>
  
  <script type="module" src="/src/main.tsx"></script>
</body>
```

---

## Technical Considerations

### Why This Works

1. **Bots don't execute JavaScript**: They see the pre-rendered HTML content immediately
2. **Overlay masks the transition**: Humans see a professional loading state instead of content replacement
3. **React replaces content smoothly**: After the overlay fades, React is already interactive
4. **No hydration issues**: We're using `createRoot` (not `hydrateRoot`), so React simply replaces the content - the overlay makes this invisible

### Trade-offs

| Aspect | Impact |
|--------|--------|
| Initial load | Users see ~300-600ms loading overlay |
| SEO | Full content visible to crawlers immediately |
| Maintenance | Static content must be updated when categories change |
| Bundle size | Minimal - just inline CSS for overlay |

---

## Summary

This approach gives you the best of both worlds:
- **Full SEO visibility**: Bots see complete page content in the source
- **Professional UX**: Humans see a branded loading animation instead of content flash
- **Simple implementation**: No complex hydration or server-side rendering required
- **Works on Lovable hosting**: No external services or edge functions needed
