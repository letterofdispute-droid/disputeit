
# Completing the Integration: All 9 Missing Pieces

All five pages and the backend are built. What remains is wiring everything together so users can actually find and use these tools. Here is exactly what needs to happen, in order.

---

## 1. Register Routes in `App.tsx`

Four new lazy-loaded routes must be added. Without this, navigating to `/state-rights`, `/deadlines`, `/consumer-news`, or `/analyze-letter` returns a 404.

```
/state-rights       → StateRightsPage
/deadlines          → DeadlinesPage
/consumer-news      → ConsumerNewsPage
/analyze-letter     → LetterAnalyzerPage
```

---

## 2. Add Routes to `routes.ts`

The static site generator pre-renders known routes. These four must be listed so they get pre-rendered HTML (critical for SEO — Google needs to crawl them).

---

## 3. Update MegaMenu Resources Section

The Resources dropdown currently has 5 items (How It Works, FAQ, Knowledge Center, About Us, Contact). Four new items are added:

```
State Rights Lookup   — "Find laws for your state and dispute type"      → /state-rights
Deadlines Calculator  — "See how long you have to act"                   → /deadlines
Consumer News         — "Latest FTC, CFPB & recall alerts"               → /consumer-news
Analyze My Letter     — "Free AI score on your draft letter"              → /analyze-letter
```

The dropdown will use a 2-column grid layout to accommodate 9 items cleanly.

---

## 4. Update Header Mobile Menu

The "Resources" accordion in the mobile Sheet currently lists 5 links. The same 4 new links are added with a divider and a "Free Tools" label above them to visually group them.

---

## 5. Add "Free Tools" Column to Footer

The footer currently has 4 columns: Brand, Letter Types, Resources, Legal. A 5th column "Free Tools" is added:

- State Rights Lookup
- Deadlines Calculator
- Analyze My Letter
- Consumer News

The footer grid changes from `md:grid-cols-4` to `md:grid-cols-5`.

---

## 6. Add "My Disputes" Tab to Dashboard

The Dashboard currently has two tabs: "All Purchases" and "Drafts". A third tab "My Disputes" is added that renders the `DisputeTracker` component. The tab shows a dispute count badge once the user has disputes.

---

## 7. Add Cross-Link to `CategoryGuidePage`

At the end of the guide's action steps section, a highlighted banner CTA is added:

> **Check your state's specific laws →** [State Rights Lookup for {category}]

Links to `/state-rights?category={categoryId}` so the user lands with the right category pre-selected.

---

## 8. Add Cross-Link to `LetterPage`

Below the letter form fields, just before the "Generate Letter" button, a subtle inline CTA is added:

> ⏱ **Not sure how long you have to act?** [Check your deadline →]

Links to `/deadlines?category={categoryId}`.

---

## 9. Register Edge Functions in `config.toml`

Two new edge functions need `verify_jwt = false` entries in `supabase/config.toml`:

```toml
[functions.fetch-consumer-news]
verify_jwt = false

[functions.analyze-letter-strength]
verify_jwt = false
```

Without this, calls to these functions will return 401 errors from non-authenticated users.

---

## Files Changing

| File | Change |
|---|---|
| `src/App.tsx` | Add 4 lazy imports + 4 `<Route>` entries |
| `src/routes.ts` | Add 4 route strings |
| `src/components/layout/MegaMenu.tsx` | Expand resources array with 4 new items, 2-col grid |
| `src/components/layout/Header.tsx` | Add 4 new links to mobile Resources accordion |
| `src/components/layout/Footer.tsx` | Add "Free Tools" 5th column |
| `src/pages/Dashboard.tsx` | Add "My Disputes" third tab with `DisputeTracker` |
| `src/pages/CategoryGuidePage.tsx` | Add State Rights cross-link CTA |
| `src/pages/LetterPage.tsx` | Add Deadlines cross-link CTA |
| `supabase/config.toml` | Register 2 new edge functions |
