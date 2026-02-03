
# Navigation & Hero Improvements + Feature Ideas

## Overview

This plan addresses 3 key fixes plus provides new feature ideas for the dispute letters website:

1. ✅ **Move Consumer Rights Guides to main navigation** - promoted to standalone "Guides" menu
2. ✅ **Fix hero background image visibility** - increased opacity to 30%, reduced gradient overlay
3. ✅ **Expand MegaMenu to 3 columns** - now 800px wide with grid-cols-3

---

## Completed Changes

### 1. Guides in Main Navigation
- Added standalone "Guides" menu item between Letter Templates and Resources
- 2-column grid showing all 13 category guides
- Header: "Know Your Rights" with subtitle
- Footer link to /guides hub page
- Mobile menu accordion updated with Guides section

### 2. Hero Background Fix
- Increased gavel image opacity: 15% → 30%
- Reduced gradient overlay: via-primary/95 → via-primary/85
- Pattern opacity unchanged at 5%

### 3. MegaMenu 3-Column Layout
- Width expanded: 600px → 800px
- Layout: grid-cols-2 → grid-cols-3
- Categories now display in 5 rows instead of 7
- Slightly more compact padding

---

## Additional Feature Ideas

Based on the dispute letters theme, here are valuable additions:

### High Priority (Recommended)

| Feature | Description | Value |
|---------|-------------|-------|
| **Letter Tracker** | Dashboard feature to track dispute progress (sent, awaiting response, resolved) | Helps users manage multiple disputes |
| **Deadline Calculator** | Tool showing statutory response deadlines based on letter type | Adds urgency and legal precision |
| **Regulatory Contacts Database** | Searchable list of ombudsmen, regulators, and complaint bodies | Saves research time |
| **Letter Delivery Guide** | Page explaining certified mail, email confirmation, proper documentation | Ensures letters are legally valid |

### Medium Priority

| Feature | Description | Value |
|---------|-------------|-------|
| **Sample Letters Gallery** | Anonymized before/after examples showing results | Builds trust and demonstrates value |
| **Dispute Outcome Calculator** | Estimate likelihood of success based on category and situation | Sets realistic expectations |
| **Template Comparison Tool** | Side-by-side view of similar templates | Helps users choose the right letter |
| **Escalation Path Flowchart** | Visual guide: letter -> regulator -> small claims | Shows full dispute journey |

### Lower Priority (Future)

| Feature | Description | Value |
|---------|-------------|-------|
| **Community Success Stories** | User-submitted outcomes with moderation | Social proof |
| **Legal Term Glossary** | Searchable definitions (lien, breach, damages) | Education |
| **Document Checklist Generator** | Based on dispute type, generate evidence list | Preparation tool |
| **Response Templates** | Templates for responding to company replies | Complete the conversation |

---

## Files Modified

| File | Changes |
|------|---------|
| `src/components/home/Hero.tsx` | Increased image opacity to 30%, reduced gradient to 80-85% |
| `src/components/layout/MegaMenu.tsx` | Added Guides nav item, expanded to 3-column 800px layout |
| `src/components/layout/Header.tsx` | Added Guides accordion section to mobile menu |
