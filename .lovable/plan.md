

# Missing Employment Templates: Mobbing, Harassment Variants, and Related Workplace Issues

## Current State

The Employment category has ~30 templates. There is one generic "Workplace Harassment Complaint" and one "Workplace Bullying Complaint," but several high-demand, legally distinct scenarios are missing.

## Missing Templates to Add

### New file: `src/data/templates/employment/workplaceAbuse Templates.ts`

**~12 new templates covering gaps:**

| Template | Why it's distinct from existing |
|----------|-------------------------------|
| **Workplace Mobbing Complaint** | Group-based systematic harassment (distinct from individual harassment/bullying) |
| **Sexual Harassment Complaint** | Specific legal framework (Title VII/Title IX), quid pro quo vs hostile environment |
| **Retaliation Complaint** | Filing complaint after protected activity (distinct from general harassment) |
| **Hostile Work Environment Complaint** | Pattern-based, pervasive conduct — different legal test than single-incident harassment |
| **Racial Harassment Complaint** | Race-specific hostile conduct, Title VII specific |
| **Age Discrimination Complaint** | ADEA-specific, distinct legal thresholds (40+) |
| **Disability Harassment Complaint** | ADA-specific, failure to accommodate + harassment combined |
| **Religious Discrimination Complaint** | Accommodation refusal + harassment for religious practice |
| **Gender Identity / LGBTQ+ Discrimination Complaint** | Bostock v. Clayton County framework |
| **Pregnancy Discrimination Complaint** | PDA + ADA pregnancy accommodation |
| **Equal Pay Complaint** | EPA-specific, pay gap documentation |
| **FMLA Interference / Retaliation Complaint** | Medical leave denial or punishment for taking leave |

### File changes

| File | Change |
|------|--------|
| `src/data/templates/employment/workplaceAbuseTemplates.ts` | New file with ~12 templates |
| `src/data/templates/employmentTemplates.ts` | Import and spread `workplaceAbuseTemplates` |
| `src/data/subcategoryMappings.ts` | Add patterns for new slugs (mobbing, sexual-harassment, retaliation, etc.) to route to correct subcategories |

### Template structure

Each template follows the existing pattern with:
- US-focused legal references (Title VII, ADA, ADEA, EPA, PDA, FMLA) as primary jurisdiction
- UK (Equality Act 2010), EU, and INTL as secondary jurisdictions  
- AI-enhanced fields with evidence hints
- Impact levels on all fields
- 3 tones (neutral, firm, final)
- Specific fields relevant to each scenario (e.g., sexual harassment gets "quid pro quo or hostile environment" selector, mobbing gets "number of perpetrators" and "duration of campaign")

### Why these are legally distinct (not duplicates)

The existing generic "harassment complaint" template has a dropdown for harassment type but uses the same letter structure regardless. These new templates have:
- **Different legal citations** (Title VII sexual harassment vs ADEA age discrimination vs ADA disability)
- **Different evidentiary requirements** (equal pay needs pay comparator data, mobbing needs timeline of escalating group behavior)
- **Different relief/remedy options** (FMLA: reinstatement + back pay, Equal Pay: wage adjustment + back pay)
- **Different filing deadlines** mentioned in the letter (EEOC 180/300 days, EPA 2-year statute)

### SEO value

These are high-search-volume terms: "sexual harassment complaint letter template," "workplace mobbing letter," "equal pay complaint letter," "FMLA retaliation letter" — currently not served by any template.

## Technical Details

- No database changes
- No edge function changes  
- No new dependencies
- Templates auto-register via the `allTemplates` aggregation in `allTemplates.ts`
- SSG routes auto-generate from `routes.ts` which reads `allTemplates`
- Subcategory mapping patterns already partially cover these (discrimination pattern catches harassment/hostile/retaliation) but new patterns may be needed for clean routing
- Total template count will increase from ~550 to ~562

