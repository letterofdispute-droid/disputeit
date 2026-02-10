

# Author Personas System for Letter of Dispute

## Overview
Replace the single "LoD Contributor" author with 16 fictional author personas (8 female, 8 male) with realistic consumer-rights backstories. Add legal disclosures that these are pen names (pseudonyms) and that no author is a legal expert.

## The 16 Authors

### Female Authors
1. **Rachel Simmons** - After a nightmare car dealership experience, she started writing about lemon laws and vehicle disputes to help others avoid the same trap.
2. **Dana Whitfield** - A former retail manager who saw too many customers get the runaround on returns and refunds, now writes to help people get their money back.
3. **Keisha Morgan** - Got hit with surprise medical bills after an ER visit and spent months fighting her insurance company. Now shares what she learned.
4. **Tanya Reeves** - A military spouse who dealt with countless moving-related property damage claims across relocations. Channels that frustration into helping others.
5. **Jill Kowalski** - After her landlord refused to return a $2,400 security deposit, she taught herself tenant rights and started writing about housing disputes.
6. **Monica Alvarez** - A former call center worker who knows exactly how complaint escalation works from the inside. Now she teaches consumers how to use that knowledge.
7. **Brianna Cole** - Had her identity stolen and spent over a year disputing fraudulent accounts on her credit report. Writes about financial disputes and credit repair.
8. **Stephanie Novak** - A frequent flyer who got stranded by airlines one too many times. Now writes about travel compensation and passenger rights.

### Male Authors
1. **Marcus Jennings** - A former construction project manager who saw homeowners get taken advantage of by bad contractors. Writes about home improvement disputes.
2. **Tyler Brooks** - After fighting a wrongful termination, he became passionate about helping workers understand their employment rights.
3. **Derek Lawson** - A small business owner who dealt with predatory lending practices and now writes about banking and financial disputes.
4. **Brian Castellano** - Had a disastrous home renovation that led to months of contractor disputes. Shares lessons learned the hard way.
5. **Jason Okafor** - A tech professional who fought back against unfair subscription billing practices and deceptive SaaS terms. Writes about e-commerce disputes.
6. **Kevin Marsh** - After his home insurance claim was denied following storm damage, he became an advocate for policyholder rights.
7. **Ryan Gallagher** - Dealt with a nightmare HOA board that fined residents unfairly. Now writes about homeowner association disputes and governance.
8. **Andre Washington** - A veteran who struggled with VA benefits paperwork and utility billing disputes. Writes about utilities and government service complaints.

## What Changes

### 1. New file: `src/data/authors.ts`
- Define an `Author` interface with: `id`, `name`, `slug`, `gender`, `avatar` (path to uploaded image), `bio` (full ~100 words), `shortBio` (one sentence), `specialties` (array of category slugs they tend to write about)
- Export the array of 16 authors
- Export helper functions: `getAuthorBySlug()`, `getRandomAuthor()`, `getAuthorForCategory()` (picks an author whose specialties match the article category)

### 2. Update: `src/pages/ArticlePage.tsx`
- Instead of hardcoded "LoD Contributor", look up the author from the `blog_posts.author` field by matching against the authors data
- Display author avatar (small circle), name, and short bio in the article hero
- Update JSON-LD schema to use the actual author name
- Fallback to a generic "LoD Editorial Team" if author name doesn't match any persona

### 3. Update: `src/pages/ArticlesPage.tsx`
- Replace hardcoded "LoD Contributor" in article cards with the actual author name from the post data
- Show small author avatar next to the name

### 4. Update: `src/pages/admin/AdminBlogEditor.tsx`
- Replace the auto-generated `author` field (currently `user.email.split('@')[0]`) with a dropdown selector populated from the 16 authors
- Default selection: pick an author whose specialties match the selected category

### 5. Update: `supabase/functions/bulk-generate-articles/index.ts`
- When inserting a new blog post, randomly assign an author name from the 16 personas, weighted toward authors whose specialties match the article's category

### 6. Update existing blog posts in DB
- Run an UPDATE query to replace all "LoD Contributor", "mario.smode", and "DisputeLetters Team" author values with randomly assigned persona names (matching category where possible)

### 7. Update: `src/data/blogPosts.ts`
- Replace hardcoded "LoD Contributor" author values with persona names for the static fallback posts

### 8. Legal pages updates

**Terms of Service (`src/pages/TermsPage.tsx`)**
- Add a new section (after AI-Generated Content, section 4) titled "Editorial Personas and Pen Names" covering:
  - All author names on the site are fictional pen names (pseudonyms)
  - They do not represent real individuals
  - No author is a legal professional, attorney, or qualified expert
  - All content is for informational/educational purposes only and should not be treated as professional advice

**Disclaimer Page (`src/pages/DisclaimerPage.tsx`)**
- Add a section "Use of Pseudonyms and Fictional Personas" explaining:
  - Author bylines are creative pen names used for editorial variety
  - Biographies are fictional and inspired by common consumer experiences
  - None of the personas represent real people or actual professional credentials
  - Content is general guidance only, not professional or legal advice

**Privacy Policy (`src/pages/PrivacyPage.tsx`)**
- No major changes needed (authors aren't real users), but add a brief note in the "Information We Collect" section clarifying that author names displayed on articles are editorial pseudonyms and do not correspond to real individuals whose data we process.

**About Page (`src/pages/AboutPage.tsx`)**
- Add a small note in the "Important Notice" section: "Author names appearing on our articles are editorial pen names (pseudonyms) used for creative purposes. They do not represent real individuals, and no contributor is a legal professional."

### 9. Image assignment
- Female authors 1-8 mapped to `female1.jpeg` through `female8.jpeg` (user will upload these)
- Male authors 1-8 mapped to `male1.jpeg` through `male8.jpeg` (user will upload these)
- Images stored in `public/images/authors/` directory

## Technical Notes

- The `blog_posts.author` column (text) already exists and will store the author's display name
- No DB schema changes needed -- just data updates
- The author lookup is purely frontend (from the static `authors.ts` data file), keeping it simple
- The bulk generator will import the authors list to randomly assign names on new articles
- A one-time SQL UPDATE will reassign all ~755 existing posts to the new persona names
