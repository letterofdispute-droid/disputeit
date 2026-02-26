

## Audit Result: No Other Pages Affected

Searched the entire `src/` directory for `var(--gradient-hero)` -- zero matches remain. The `SmallClaimsStatePage.tsx` fix from the previous edit was the only page using that broken CSS variable. All other heroes already use the standard `/images/tools-hero-bg.jpg` + `bg-primary/45` overlay pattern.

No changes needed.

