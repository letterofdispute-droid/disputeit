export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  categorySlug: string;
  author: string;
  publishedAt: string;
  readTime: string;
  image?: string;
  featured?: boolean;
}

export interface BlogCategory {
  slug: string;
  name: string;
  description: string;
}

export const blogCategories: BlogCategory[] = [
  {
    slug: 'consumer-rights',
    name: 'Consumer Rights',
    description: 'Know your rights as a consumer and how to protect them.',
  },
  {
    slug: 'landlord-tenant',
    name: 'Landlord & Tenant',
    description: 'Navigate housing disputes and understand your rights as a renter.',
  },
  {
    slug: 'travel-disputes',
    name: 'Travel Disputes',
    description: 'Get compensation for flight delays, cancellations, and travel issues.',
  },
  {
    slug: 'financial-tips',
    name: 'Financial Tips',
    description: 'Manage disputes with banks, credit bureaus, and financial institutions.',
  },
  {
    slug: 'legal-guides',
    name: 'Legal Guides',
    description: 'Step-by-step legal guides for common dispute situations.',
  },
];

export const blogPosts: BlogPost[] = [
  {
    slug: 'how-to-write-effective-complaint-letter',
    title: 'How to Write an Effective Complaint Letter That Gets Results',
    excerpt: 'Learn the key elements that make complaint letters successful and how to structure your case for maximum impact.',
    content: `
# How to Write an Effective Complaint Letter That Gets Results

Writing a complaint letter that actually gets results requires more than just venting your frustration. It requires strategy, clarity, and the right approach.

## The Anatomy of a Successful Complaint Letter

### 1. Clear Subject Line
Start with a clear, specific subject line that immediately communicates the nature of your complaint. For example: "Formal Complaint: Order #12345 - Defective Product Received on [Date]"

### 2. State the Facts Chronologically
Present what happened in a clear, chronological order. Include:
- Dates and times
- Names of people you spoke with
- Reference numbers
- Amounts involved

### 3. Reference Your Rights
Mention relevant consumer protection laws or company policies that support your position. This shows you've done your research and know your rights.

### 4. Be Specific About Your Resolution
Clearly state what you want: a refund, replacement, repair, or compensation. Give a reasonable deadline for response.

### 5. Keep Records
Document everything. Keep copies of your letter, any responses, and related receipts or communications.

## Common Mistakes to Avoid

- **Being overly emotional**: Stick to facts, not feelings
- **Making threats**: Keep the tone professional
- **Being vague**: Specific details strengthen your case
- **Missing deadlines**: Many consumer protections have time limits

## Why Templates Work Better Than Generic AI

When you use a pre-validated template, you're getting:
- Legally-sound language that won't weaken your case
- All required elements (reference numbers, deadlines, escalation paths)
- Consistent, professional formatting

This is why our templates have a higher success rate than letters generated through trial-and-error prompting with general AI tools.
    `,
    category: 'Legal Guides',
    categorySlug: 'legal-guides',
    author: 'LoD Contributor',
    publishedAt: '2024-01-15',
    readTime: '6 min read',
    featured: true,
  },
  {
    slug: 'your-rights-when-products-arrive-damaged',
    title: 'Your Rights When Products Arrive Damaged: A Complete Guide',
    excerpt: 'Understanding your legal rights when you receive damaged goods and how to get a refund or replacement.',
    content: `
# Your Rights When Products Arrive Damaged

Receiving a damaged product is frustrating, but you have strong consumer protections on your side.

## Immediate Steps to Take

1. **Document the damage** - Take photos and videos before touching anything
2. **Keep all packaging** - The shipping box and materials are evidence
3. **Note the delivery details** - Date, time, carrier, tracking number

## Your Legal Rights

Under consumer protection laws in most jurisdictions, you are entitled to:
- A full refund
- A replacement product
- Repair (if applicable)

The seller cannot require you to pay for return shipping of damaged goods.

## How to File Your Complaint

Contact the seller in writing within 14 days of delivery. Include:
- Your order number
- Photos of the damage
- Description of the issue
- Your preferred resolution

## If the Seller Doesn't Respond

You have escalation options:
1. Credit card chargeback (if paid by card)
2. Small claims court
3. Consumer protection agency complaints

Using a pre-validated template ensures your complaint includes all the legal elements needed for these escalation paths.
    `,
    category: 'Consumer Rights',
    categorySlug: 'consumer-rights',
    author: 'LoD Contributor',
    publishedAt: '2024-01-10',
    readTime: '5 min read',
  },
  {
    slug: 'getting-your-security-deposit-back',
    title: 'Getting Your Security Deposit Back: What Every Renter Should Know',
    excerpt: 'A comprehensive guide to understanding your rights regarding security deposits and how to dispute unfair deductions.',
    content: `
# Getting Your Security Deposit Back

Security deposit disputes are among the most common landlord-tenant conflicts. Here's how to protect your money.

## Know the Rules in Your Area

Most jurisdictions require landlords to:
- Return deposits within 14-30 days of move-out
- Provide itemized deductions in writing
- Hold deposits in a separate account
- Pay interest on deposits (in some areas)

## Before You Move Out

- Take timestamped photos of every room
- Complete a move-out walkthrough with your landlord
- Get a signed acknowledgment of the property condition

## Challenging Unfair Deductions

If your landlord withholds money unfairly, you can:
1. Send a formal demand letter
2. File a small claims court case
3. Report to local housing authorities

Many states impose penalties of 2-3x the deposit for landlords who wrongfully withhold funds.

## Using a Template

A well-crafted demand letter shows the landlord you know your rights and are prepared to escalate. Our templates include:
- Proper legal citations for your jurisdiction
- Reasonable deadlines that hold up in court
- Professional language that strengthens your case
    `,
    category: 'Landlord & Tenant',
    categorySlug: 'landlord-tenant',
    author: 'LoD Contributor',
    publishedAt: '2024-01-08',
    readTime: '7 min read',
  },
  {
    slug: 'flight-compensation-eu261-guide',
    title: 'EU261 Flight Compensation: How to Claim Up to €600 for Delays',
    excerpt: 'Understanding your rights under EU261 and how to successfully claim compensation for flight delays and cancellations.',
    content: `
# EU261 Flight Compensation Guide

If your flight was delayed, cancelled, or overbooked when flying to/from the EU, you may be entitled to up to €600 in compensation.

## What is EU261?

EU Regulation 261/2004 protects passengers on:
- All flights departing from EU airports
- EU airline flights arriving in the EU

## Compensation Amounts

- **Short flights (under 1,500km)**: €250
- **Medium flights (1,500-3,500km)**: €400
- **Long flights (over 3,500km)**: €600

## When You Can Claim

- Delays of 3+ hours at final destination
- Flight cancellations (with less than 14 days notice)
- Denied boarding due to overbooking

## Exceptions

Airlines don't have to pay if the disruption was caused by "extraordinary circumstances" like:
- Severe weather
- Political instability
- Security risks

However, technical problems are NOT considered extraordinary circumstances.

## How to Claim

1. Gather your booking confirmation and boarding pass
2. Document the delay (take screenshots of departure boards)
3. Send a formal compensation request to the airline
4. Escalate to aviation authorities if rejected

Our EU261 complaint templates include proper legal references and have a proven track record of success.
    `,
    category: 'Travel Disputes',
    categorySlug: 'travel-disputes',
    author: 'LoD Contributor',
    publishedAt: '2024-01-05',
    readTime: '6 min read',
    featured: true,
  },
  {
    slug: 'disputing-errors-on-credit-report',
    title: 'How to Dispute Errors on Your Credit Report',
    excerpt: 'Step-by-step guide to identifying and removing inaccurate information from your credit report.',
    content: `
# How to Dispute Errors on Your Credit Report

Credit report errors can damage your financial life. Here's how to fix them.

## Common Credit Report Errors

- Accounts that don't belong to you
- Incorrect payment history
- Wrong personal information
- Duplicate accounts
- Outdated negative information

## Your Rights Under FCRA

The Fair Credit Reporting Act gives you the right to:
- Request a free credit report annually
- Dispute inaccurate information
- Have errors corrected within 30 days
- Sue for damages if errors aren't fixed

## The Dispute Process

1. **Get your credit reports** from all three bureaus
2. **Identify the errors** and gather supporting documents
3. **Send a written dispute** via certified mail
4. **Wait for investigation** (30-45 days)
5. **Review the results** and escalate if needed

## Tips for Success

- Always dispute in writing, not online
- Include copies (not originals) of supporting documents
- Be specific about what's wrong and why
- Keep records of all communications

A properly formatted dispute letter significantly increases your chances of success. Our templates are designed specifically for credit bureau disputes and include all required elements under FCRA.
    `,
    category: 'Financial Tips',
    categorySlug: 'financial-tips',
    author: 'LoD Contributor',
    publishedAt: '2024-01-02',
    readTime: '8 min read',
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find(post => post.slug === slug);
}

export function getBlogPostsByCategory(categorySlug: string): BlogPost[] {
  return blogPosts.filter(post => post.categorySlug === categorySlug);
}

export function getBlogCategoryBySlug(slug: string): BlogCategory | undefined {
  return blogCategories.find(cat => cat.slug === slug);
}

export function getFeaturedPosts(): BlogPost[] {
  return blogPosts.filter(post => post.featured);
}
