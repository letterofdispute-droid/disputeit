

# Create 5 Tool-Focused SEO Campaigns

## Overview
Programmatically insert 5 content campaigns into `content_plans` and `content_queue` tables, each with a pillar article and 5-7 cluster articles targeting high-intent keywords around your existing free tools.

## Campaign Details

### Campaign 1: Small Claims Court Suite
**Vertical:** `ecommerce` | **Pillar:** "The Complete Guide to Filing in Small Claims Court (2026)"

| # | Cluster Title | Type | Target Keyword |
|---|---|---|---|
| 1 | How Much Does It Cost to File in Small Claims Court? | how-to | small claims court filing fees |
| 2 | 5 Mistakes That Get Small Claims Cases Dismissed | mistakes | small claims court mistakes |
| 3 | How to Write a Demand Letter Before Small Claims Court | how-to | demand letter before small claims |
| 4 | Small Claims Court vs. Dispute Letter: Which Should You Use? | comparison | small claims court vs dispute letter |
| 5 | Small Claims Court Checklist: Everything You Need to File | checklist | small claims court checklist |

### Campaign 2: State Consumer Rights
**Vertical:** `housing` | **Pillar:** "Know Your Consumer Rights: A State-by-State Guide (2026)"

| # | Cluster Title | Type | Target Keyword |
|---|---|---|---|
| 1 | How to File a Consumer Complaint With Your State Attorney General | how-to | file consumer complaint attorney general |
| 2 | Lemon Law Rights by State: What You Need to Know | rights | lemon law rights by state |
| 3 | Your Rights When a Company Ignores Your Complaint | rights | company ignores complaint rights |
| 4 | State Consumer Protection Laws vs. Federal Laws: Key Differences | comparison | state vs federal consumer protection |
| 5 | How to Look Up Consumer Protection Statutes in Your State | how-to | look up consumer protection laws |

### Campaign 3: Statute of Limitations / Deadlines
**Vertical:** `financial` | **Pillar:** "Statute of Limitations for Consumer Disputes: Don't Miss Your Deadline"

| # | Cluster Title | Type | Target Keyword |
|---|---|---|---|
| 1 | How Long Do You Have to Dispute a Charge? Deadlines by Type | how-to | how long to dispute a charge |
| 2 | 5 Mistakes That Cause You to Miss Your Dispute Deadline | mistakes | missed dispute deadline |
| 3 | Statute of Limitations for Debt Collection by State | rights | statute of limitations debt collection |
| 4 | Credit Card Chargeback Time Limits: A Complete Guide | how-to | chargeback time limit |
| 5 | What Happens If You File a Dispute After the Deadline? | faq | dispute after deadline |

### Campaign 4: AI Letter Strength Analyzer
**Vertical:** `ecommerce` | **Pillar:** "How to Write a Dispute Letter That Actually Works (2026)"

| # | Cluster Title | Type | Target Keyword |
|---|---|---|---|
| 1 | 7 Mistakes That Weaken Your Dispute Letter | mistakes | dispute letter mistakes |
| 2 | How to Analyze Your Dispute Letter Before Sending It | how-to | analyze dispute letter |
| 3 | Sample Dispute Letter That Scored 95/100 | sample | dispute letter example |
| 4 | Dispute Letter vs. Complaint Letter: Which Do You Need? | comparison | dispute letter vs complaint letter |
| 5 | How Strong Is Your Dispute Letter? Free AI Analysis | how-to | dispute letter strength checker |

### Campaign 5: Consumer News Hub
**Vertical:** `ecommerce` | **Pillar:** "How to Stay Informed About Consumer Protection Updates in 2026"

| # | Cluster Title | Type | Target Keyword |
|---|---|---|---|
| 1 | How FTC Enforcement Actions Protect Your Consumer Rights | how-to | FTC enforcement actions consumer |
| 2 | CFPB Updates That Could Affect Your Next Dispute | rights | CFPB updates disputes |
| 3 | How to Use Product Recall Alerts to Strengthen Your Claim | how-to | product recall dispute letter |
| 4 | Recent Consumer Settlements: Lessons for Your Own Dispute | case-study | consumer settlement examples |
| 5 | A Checklist for Tracking Consumer News That Matters to You | checklist | consumer news tracking |

## Implementation
- Insert 5 rows into `content_plans` with appropriate `template_slug`, `category_id`, and `value_tier: 'high'`
- Insert 30 rows into `content_queue` (5 pillars at priority 100 + 25 clusters at priority 50)
- Each pillar gets `article_type: 'pillar'`, clusters get their assigned type
- Invalidate relevant query caches after insertion

## Total Output
- **5 pillar articles** (generated first due to priority 100)
- **25 cluster articles** linking back to their respective pillars
- **30 articles total** targeting tool-related search queries

