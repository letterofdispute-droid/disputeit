

# Plan: Generate Lemon Law Article Campaigns for All 50 States

## Current State
- **Indiana**: Already has 5 published articles (pillar + 4 cluster). This is the template pattern.
- **California**: 1 general lemon law article
- **Florida**: 1 general lemon law article
- **35+ general** lemon law articles exist (not state-specific)

## Approach

Create a new edge function `seed-state-lemon-campaigns` that programmatically generates content_plan + content_queue entries for 49 states (all except Indiana). Each state gets **1 pillar + 5 cluster articles** with state-specific titles, keywords, and article types.

### Key Design Decisions

**Avoiding repetition**: Each state's cluster will draw from a pool of ~12 article angle templates, randomly selecting 5 per state. This ensures neighboring states don't have identical article structures. Examples of angle templates:

- How to file a claim (how-to)
- Common mistakes when filing (mistakes)
- Used cars / private sales coverage (faq)
- Statute key provisions (rights)
- Manufacturer vs dealer obligations (comparison)
- Timeline and deadlines (checklist)
- Arbitration process (how-to)
- Lemon law attorney selection (how-to)
- Documentation and evidence gathering (checklist)
- Buyback vs replacement options (comparison)
- Federal vs state protections (comparison)
- Recent case studies and outcomes (case-study)

**State-specific content**: Titles and keywords reference each state's actual lemon law statute name (e.g., "Song-Beverly Act" for CA, "Motor Vehicle Warranty Enforcement Act" for FL). The AI generation pipeline will handle the actual state-specific legal content.

### Implementation

1. **Create edge function** `seed-state-lemon-campaigns/index.ts`
   - Defines all 50 states with their lemon law statute names
   - Skips Indiana (already published)
   - For each state: creates a `content_plan` and 6 `content_queue` items (1 pillar at priority 100 + 5 clusters)
   - Uses deterministic shuffling so each state gets a different mix of 5 cluster angles from the 12-angle pool
   - Sets `related_templates` context so generated articles link to `lemon-law-rejection`
   - Category: `vehicle`

2. **Run the function once** to seed 49 states x 6 articles = 294 queue items

3. The existing `bulk-generate-articles` pipeline handles actual content generation with state-specific prompts

### Files Changed
- **New**: `supabase/functions/seed-state-lemon-campaigns/index.ts` - one-time seeding function
- **Update**: `supabase/config.toml` entry (auto-managed)

### Scale
- 49 states x 6 articles = **294 articles** queued
- Generation happens via existing bulk pipeline (1 article per invocation, self-chaining)
- Estimated generation time: several hours via the existing batch system

