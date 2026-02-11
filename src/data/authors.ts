export interface Author {
  id: string;
  name: string;
  slug: string;
  gender: "female" | "male";
  avatar: string;
  bio: string;
  shortBio: string;
  specialties: string[];
}

export const authors: Author[] = [
  // Female Authors
  {
    id: "rachel-simmons",
    name: "Rachel Simmons",
    slug: "rachel-simmons",
    gender: "female",
    avatar: "/images/authors/female1.jpg",
    bio: "Rachel's journey into consumer advocacy started after a nightmare experience at a car dealership that left her thousands of dollars out of pocket and stuck with a lemon. After months of fighting back and eventually winning her case, she realized how many people face similar situations without knowing where to start. Now she channels that hard-won experience into writing about vehicle disputes, lemon laws, and dealership complaints - always from the perspective of someone who's been there.",
    shortBio:
      "Former lemon law victim turned consumer advocate who writes about vehicle disputes and dealership complaints.",
    specialties: ["vehicle", "damaged-goods"],
  },
  {
    id: "dana-whitfield",
    name: "Dana Whitfield",
    slug: "dana-whitfield",
    gender: "female",
    avatar: "/images/authors/female2.jpg",
    bio: "Dana spent eight years as a retail manager and saw firsthand how companies give customers the runaround on returns and refunds. She watched countless shoppers walk away empty-handed despite having legitimate complaints, simply because they didn't know the right words to use or the right people to contact. After leaving retail, she started writing about consumer rights to help people get their money back - using insider knowledge of how complaint escalation really works behind the scenes.",
    shortBio:
      "Former retail manager who uses insider knowledge to help consumers navigate returns and refund disputes.",
    specialties: ["refunds", "ecommerce", "damaged-goods"],
  },
  {
    id: "keisha-morgan",
    name: "Keisha Morgan",
    slug: "keisha-morgan",
    gender: "female",
    avatar: "/images/authors/female3.jpg",
    bio: "Keisha's introduction to insurance disputes came the hard way - a surprise $14,000 medical bill after what she thought was a covered ER visit. She spent months fighting her insurance company, learning the appeals process inside and out, and eventually got the charges reversed. That experience opened her eyes to how many people simply pay bills they shouldn't have to, and she now shares everything she learned about health insurance disputes, medical billing errors, and the appeals process.",
    shortBio:
      "Fought a $14,000 surprise medical bill and won - now writes about insurance disputes and medical billing.",
    specialties: ["insurance", "healthcare", "financial"],
  },
  {
    id: "tanya-reeves",
    name: "Tanya Reeves",
    slug: "tanya-reeves",
    gender: "female",
    avatar: "/images/authors/female4.jpg",
    bio: "As a military spouse, Tanya has moved more times than she can count - and filed more property damage claims than she ever thought possible. Broken furniture, lost belongings, damaged appliances: she's dealt with it all. After years of navigating the claims process with moving companies, landlords, and insurance adjusters, she started writing to help others in similar situations handle their disputes without the stress and confusion she experienced.",
    shortBio: "Military spouse and frequent mover who writes about property damage claims and relocation disputes.",
    specialties: ["damaged-goods", "housing", "insurance"],
  },
  {
    id: "jill-kowalski",
    name: "Jill Kowalski",
    slug: "jill-kowalski",
    gender: "female",
    avatar: "/images/authors/female5.jpg",
    bio: 'Jill became a housing rights advocate after her landlord refused to return a $2,400 security deposit, citing "damages" that were clearly normal wear and tear. With no legal background, she taught herself tenant rights law, drafted her own demand letter, and got every penny back. That experience ignited a passion for helping renters understand their rights, and she now writes extensively about security deposits, lease disputes, and landlord-tenant conflicts.',
    shortBio: "Self-taught tenant rights advocate who won back a wrongfully withheld $2,400 security deposit.",
    specialties: ["housing", "hoa"],
  },
  {
    id: "monica-alvarez",
    name: "Monica Alvarez",
    slug: "monica-alvarez",
    gender: "female",
    avatar: "/images/authors/female6.jpg",
    bio: "Monica spent five years working in a call center for a major retailer, where she learned exactly how complaint escalation works from the inside - which words trigger action, which departments actually have authority, and what makes a company take a customer seriously. After leaving the industry, she started sharing those insights to level the playing field. Her writing focuses on effective communication strategies and the art of getting results from customer service departments.",
    shortBio:
      "Former call center worker who teaches consumers the insider tricks to getting results from customer service.",
    specialties: ["refunds", "ecommerce", "utilities"],
  },
  {
    id: "brianna-cole",
    name: "Brianna Cole",
    slug: "brianna-cole",
    gender: "female",
    avatar: "/images/authors/female7.jpg",
    bio: "Brianna's life was turned upside down when her identity was stolen, leaving her with fraudulent accounts, a destroyed credit score, and over a year of fighting to clean up the mess. She learned the credit dispute process the hard way - dealing with all three credit bureaus, filing police reports, and navigating the Fair Credit Reporting Act. Now she writes about financial disputes, credit repair, and identity theft recovery to help others avoid the mistakes she made early on.",
    shortBio: "Identity theft survivor who spent a year rebuilding her credit and now writes about financial disputes.",
    specialties: ["financial", "ecommerce"],
  },
  {
    id: "stephanie-novak",
    name: "Stephanie Novak",
    slug: "stephanie-novak",
    gender: "female",
    avatar: "/images/authors/female8.jpg",
    bio: "Stephanie is a frequent flyer who got stranded by airlines one too many times - canceled flights with no rebooking, lost luggage that took weeks to find, and compensation claims that went nowhere. After successfully claiming over $3,000 in flight compensation using EU261 and DOT regulations, she realized most travelers don't even know these rights exist. She now writes about travel disputes, airline compensation, and passenger rights.",
    shortBio: "Frequent flyer who has claimed over $3,000 in airline compensation and writes about travel rights.",
    specialties: ["travel"],
  },

  // Male Authors
  {
    id: "marcus-jennings",
    name: "Marcus Jennings",
    slug: "marcus-jennings",
    gender: "male",
    avatar: "/images/authors/male1.jpg",
    bio: "Marcus spent fifteen years as a construction project manager before stepping back to focus on writing. During his career, he saw too many homeowners get taken advantage of by bad contractors - shoddy work, blown budgets, and projects abandoned halfway through. He understands the contractor world from the inside and uses that knowledge to help homeowners protect themselves, document problems, and hold contractors accountable when things go wrong.",
    shortBio: "Former construction project manager who helps homeowners deal with contractor disputes.",
    specialties: ["contractors"],
  },
  {
    id: "tyler-brooks",
    name: "Tyler Brooks",
    slug: "tyler-brooks",
    gender: "male",
    avatar: "/images/authors/male2.jpg",
    bio: "Tyler's passion for workers' rights was born from a wrongful termination that left him scrambling to pay rent while fighting for the severance he was owed. After months of back-and-forth with HR departments and employment lawyers, he won his case - but the experience left him determined to help others navigate the confusing world of employment disputes. He writes about workplace rights, wrongful termination, wage disputes, and everything employees should know but rarely do.",
    shortBio: "Wrongful termination survivor turned employment rights advocate.",
    specialties: ["employment"],
  },
  {
    id: "derek-lawson",
    name: "Derek Lawson",
    slug: "derek-lawson",
    gender: "male",
    avatar: "/images/authors/male3.jpg",
    bio: "Derek ran a small business for over a decade and learned about predatory lending the hard way when a business loan turned out to have terms buried in the fine print that nearly bankrupted him. After fighting back and getting the terms renegotiated, he became passionate about helping others understand their financial rights. He writes about banking disputes, loan complaints, credit issues, and how to push back when financial institutions don't play fair.",
    shortBio: "Small business owner who fought predatory lending and now writes about banking and financial disputes.",
    specialties: ["financial"],
  },
  {
    id: "brian-castellano",
    name: "Brian Castellano",
    slug: "brian-castellano",
    gender: "male",
    avatar: "/images/authors/male4.jpg",
    bio: "Brian's kitchen renovation was supposed to take six weeks - it ended up taking seven months, going $30,000 over budget, and involving three different contractors. The experience was a masterclass in everything that can go wrong with a home improvement project, and he documented every step of the dispute resolution process. He now writes about contractor disputes, home renovation gone wrong, and how to protect yourself before, during, and after a major home project.",
    shortBio: "Survived a nightmare home renovation and now helps others navigate contractor disputes.",
    specialties: ["contractors", "housing"],
  },
  {
    id: "jason-okafor",
    name: "Jason Okafor",
    slug: "jason-okafor",
    gender: "male",
    avatar: "/images/authors/male5.jpg",
    bio: "Jason is a tech professional who got fed up with unfair subscription billing practices - auto-renewals he never agreed to, price hikes with no notice, and cancellation processes designed to be impossible. After fighting back against several companies and getting thousands of dollars in refunds, he started writing about e-commerce disputes, SaaS billing issues, and digital consumer rights. He brings a technical perspective to understanding the tricks companies use.",
    shortBio: "Tech professional who fights back against unfair subscription billing and deceptive SaaS terms.",
    specialties: ["ecommerce", "refunds"],
  },
  {
    id: "kevin-marsh",
    name: "Kevin Marsh",
    slug: "kevin-marsh",
    gender: "male",
    avatar: "/images/authors/male6.jpg",
    bio: "Kevin became an insurance rights advocate after his homeowner's insurance claim was denied following major storm damage to his roof. The denial seemed arbitrary, and after researching his policy and state insurance regulations, he filed an appeal and won full coverage. That experience taught him how insurance companies operate and what policyholders can do when claims are unfairly denied. He now writes about home insurance disputes, claim denials, and policyholder rights.",
    shortBio: "Won an unfairly denied insurance claim and now advocates for policyholder rights.",
    specialties: ["insurance", "housing"],
  },
  {
    id: "ryan-gallagher",
    name: "Ryan Gallagher",
    slug: "ryan-gallagher",
    gender: "male",
    avatar: "/images/authors/male7.jpg",
    bio: "Ryan moved into what he thought was his dream home, only to find himself dealing with an overreaching HOA board that fined residents for everything from the wrong shade of paint to having a basketball hoop in the driveway. After organizing with neighbors and successfully challenging several unfair fines and rule changes, he started writing about HOA disputes, governance issues, and homeowner rights. His goal is to help people understand they don't have to simply accept unreasonable HOA behavior.",
    shortBio: "Successfully fought unfair HOA fines and now writes about homeowner association disputes.",
    specialties: ["hoa", "housing"],
  },
  {
    id: "andre-washington",
    name: "Andre Washington",
    slug: "andre-washington",
    gender: "male",
    avatar: "/images/authors/male8.jpg",
    bio: "Andre is a veteran who spent years navigating the maze of VA benefits paperwork and utility billing disputes. Between dealing with incorrect utility charges, service outages, and government bureaucracy, he developed a no-nonsense approach to getting results through clear, direct communication. He writes about utility complaints, billing disputes, and government service issues - always with practical, step-by-step advice that cuts through the confusion.",
    shortBio: "Veteran who navigates utility billing disputes and government service complaints with clarity.",
    specialties: ["utilities", "financial"],
  },
];

export function getAuthorByName(name: string): Author | undefined {
  return authors.find((a) => a.name === name);
}

export function getAuthorBySlug(slug: string): Author | undefined {
  return authors.find((a) => a.slug === slug);
}

export function getRandomAuthor(): Author {
  return authors[Math.floor(Math.random() * authors.length)];
}

export function getAuthorForCategory(categoryId: string): Author {
  const matching = authors.filter((a) => a.specialties.includes(categoryId));
  if (matching.length > 0) {
    return matching[Math.floor(Math.random() * matching.length)];
  }
  return getRandomAuthor();
}
