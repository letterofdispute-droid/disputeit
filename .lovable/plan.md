

# Updated Trust Badges Plan

## Changes from Previous Plan

1. **Remove** "30-Day Money-Back Guarantee" badge (as requested)
2. **Add** a reference to FTC/CFPB using legally safe wording

---

## Recommended FTC/CFPB Wording

After reviewing the codebase and disclaimer, here are safe options:

| Wording | Assessment |
|---------|------------|
| ❌ "Consumer protection support FROM FTC & CFPB" | Could imply endorsement |
| ✅ "Cites Federal Consumer Protection Laws" | Accurate - we cite USC sections |
| ✅ "FTC & CFPB Escalation Guidance" | Accurate - we guide to file complaints |
| ✅ "References FTC & CFPB Regulations" | Accurate - templates cite their rules |

**Recommended badge text**: **"FTC & CFPB Escalation Paths"** or **"Cites Federal Consumer Law"**

This accurately describes what we do (guide users to file complaints with these agencies and cite their regulations) without implying endorsement or affiliation.

---

## Updated Trust Badges List

1. **Secure Payments** (Lock icon) - "Secure Payments by Stripe"
2. **Templates** (FileText icon) - "500+ Letter Templates"  
3. **Federal Law** (Scale icon) - "Cites US Federal Law"
4. **Escalation** (Building icon) - "FTC & CFPB Escalation Paths"
5. **Download** (Zap icon) - "Instant Download"

---

## Implementation

### File: `src/components/shared/TrustBadgesStrip.tsx` (New)

```tsx
const trustBadges = [
  { icon: Lock, label: 'Secure Payment' },
  { icon: FileText, label: '500+ Templates' },
  { icon: Scale, label: 'Cites US Federal Law' },
  { icon: Building, label: 'FTC & CFPB Escalation Paths' },
  { icon: Zap, label: 'Instant Download' },
];
```

### File: `src/components/layout/Footer.tsx` (Update)

Add trust badges row above the disclaimer section

### File: `src/pages/Index.tsx` (Update)

Add compact trust bar below Hero

### File: `src/components/letter/PricingModal.tsx` (Update)

Enhance the security section with visual badges

---

## Visual Placement

**Footer Layout:**
```text
[Column 1] [Column 2] [Column 3] [Column 4]
           Letter Types  Resources   Legal
           
──────────────────────────────────────────

🔒 Secure Payment  📄 500+ Templates  ⚖️ Cites US Federal Law  🏛️ FTC & CFPB Escalation Paths  ⚡ Instant Download

──────────────────────────────────────────

[Disclaimer text...]
[Copyright]
```

---

## Technical Notes

- Component is reusable with `variant` prop for different contexts
- Responsive: wraps nicely on mobile
- Icons use primary color, text uses muted-foreground
- No logos - just icons and text as requested

