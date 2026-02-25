import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { templateCategories, getTotalTemplateCount } from '@/data/templateCategories';
import { supabase } from '@/integrations/supabase/client';
import {
  FileText, BookOpen, Sparkles, MapPin, Clock, Newspaper,
  Search, Scale, Calculator, DollarSign, GitBranch, ArrowRight,
  GraduationCap, FileQuestion, Calendar, Mail,
} from 'lucide-react';
import DisputeAssistantModal from '@/components/dispute-assistant/DisputeAssistantModal';
import { format } from 'date-fns';

const shortDescriptions: Record<string, string> = {
  'refunds': 'Product & service refunds',
  'housing': 'Repairs, deposits & tenancy',
  'travel': 'Flights, hotels & bookings',
  'damaged-goods': 'Broken or defective items',
  'utilities': 'Billing & service disputes',
  'financial': 'Banks, credit & debt',
  'insurance': 'Claims & coverage issues',
  'vehicle': 'Dealers, repairs & lemon law',
  'healthcare': 'Medical bills & denials',
  'employment': 'Wages & workplace issues',
  'ecommerce': 'Online sellers & accounts',
  'hoa': 'HOA fees & neighbor issues',
  'contractors': 'Workmanship & project issues',
  'mortgage': 'Mortgages & home equity',
};

const assessmentTools = [
  { title: 'Do I Have a Case?', description: 'Free case assessment', href: '/do-i-have-a-case', icon: Scale },
  { title: 'Analyze My Letter', description: 'AI draft scoring', href: '/analyze-letter', icon: Search },
  { title: 'Deadlines Calculator', description: 'Time limits to act', href: '/deadlines', icon: Clock },
  { title: 'Consumer News', description: 'FTC & CFPB alerts', href: '/consumer-news', icon: Newspaper },
];

const courtTools = [
  { title: 'Small Claims Guide', description: 'Filing limits & forms', href: '/small-claims', icon: FileQuestion },
  { title: 'Court Cost Calculator', description: 'Estimate filing fees', href: '/small-claims/cost-calculator', icon: Calculator },
  { title: 'Demand Letter Compare', description: 'DIY vs. lawyer costs', href: '/small-claims/demand-letter-cost', icon: DollarSign },
  { title: 'Escalation Flowchart', description: 'Best resolution path', href: '/small-claims/escalation-guide', icon: GitBranch },
];

const getStartedItems = [
  { title: 'How It Works', description: 'Step-by-step guide', href: '/how-it-works', icon: Sparkles },
  { title: 'FAQ', description: 'Common questions answered', href: '/faq', icon: FileQuestion },
  { title: 'About Us', description: 'Our mission & story', href: '/about', icon: BookOpen },
  { title: 'Contact', description: 'Get in touch', href: '/contact', icon: Mail },
];

const notableStateLinks = [
  { code: 'CA', name: 'California', slug: 'california' },
  { code: 'TX', name: 'Texas', slug: 'texas' },
  { code: 'NY', name: 'New York', slug: 'new-york' },
  { code: 'FL', name: 'Florida', slug: 'florida' },
];

const MenuCard = ({ title, description, icon: Icon, href }: {
  title: string; description: string; icon: React.ElementType; href: string;
}) => (
  <li>
    <NavigationMenuLink asChild>
      <Link
        to={href}
        className="group relative flex gap-x-3 rounded-lg p-3 transition-colors hover:bg-accent/50"
      >
        <div className="mt-0.5 flex size-9 flex-none items-center justify-center rounded-lg bg-muted group-hover:bg-background">
          <Icon className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <div>
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{description}</p>
        </div>
      </Link>
    </NavigationMenuLink>
  </li>
);

const CompactMenuCard = ({ title, description, icon: Icon, href }: {
  title: string; description: string; icon: React.ElementType; href: string;
}) => (
  <li>
    <NavigationMenuLink asChild>
      <Link
        to={href}
        className="group flex items-center gap-x-2.5 rounded-md px-3 py-2 transition-colors hover:bg-accent/50"
      >
        <Icon className="size-4 flex-none text-muted-foreground group-hover:text-primary transition-colors" />
        <div className="min-w-0">
          <span className="text-sm font-medium text-foreground">{title}</span>
          <span className="ml-1.5 text-xs text-muted-foreground hidden xl:inline">{description}</span>
        </div>
      </Link>
    </NavigationMenuLink>
  </li>
);

const CategoryGrid = ({ basePath, footerLink, footerLabel, footerIcon: FooterIcon, footerUnit = 'templates', showAiHelp, onAiHelp }: {
  basePath: string; footerLink: string; footerLabel: string; footerIcon: React.ElementType;
  footerUnit?: string; showAiHelp?: boolean; onAiHelp?: () => void;
}) => {
  const totalCount = getTotalTemplateCount();
  return (
    <div className="w-[980px]">
      <div className="p-4">
        <ul className="grid grid-cols-3 gap-1">
          {templateCategories.map((category) => {
            const desc = shortDescriptions[category.id] || category.description;
            return (
              <MenuCard
                key={category.id}
                title={category.name}
                description={desc}
                href={`${basePath}/${category.id}`}
                icon={category.icon}
              />
            );
          })}
        </ul>
      </div>
      <div className="bg-muted/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to={footerLink} className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
            <FooterIcon className="size-4" />
            {footerLabel}
            <span className="text-xs font-normal text-muted-foreground">· {totalCount}+ {footerUnit}</span>
          </Link>
          {showAiHelp && (
            <Link to="/guides" className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
              <BookOpen className="size-4" />
              Consumer Rights Guides →
            </Link>
          )}
        </div>
        {showAiHelp && onAiHelp && (
          <button onClick={onAiHelp} className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <Sparkles className="size-4" />
            Not sure? Get AI help
          </button>
        )}
      </div>
    </div>
  );
};

const MegaMenu = () => {
  const [assistantOpen, setAssistantOpen] = useState(false);

  const { data: latestPost } = useQuery({
    queryKey: ['latest-post-nav'],
    queryFn: async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('title, slug, featured_image_url, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(1);
      return data?.[0] || null;
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <>
      <NavigationMenu>
        <NavigationMenuList>
          {/* 1. Letter Templates */}
          <NavigationMenuItem>
            <NavigationMenuTrigger className="bg-transparent">Letter Templates</NavigationMenuTrigger>
            <NavigationMenuContent>
              <CategoryGrid
                basePath="/templates"
                footerLink="/#letters"
                footerLabel="Browse all templates"
                footerIcon={FileText}
                showAiHelp
                onAiHelp={() => setAssistantOpen(true)}
              />
            </NavigationMenuContent>
          </NavigationMenuItem>

          {/* 2. Free Tools */}
          <NavigationMenuItem>
            <NavigationMenuTrigger className="bg-transparent">Free Tools</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="w-[700px]">
                <div className="p-4 grid grid-cols-2 gap-x-2">
                  <div>
                    <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assessment & Analysis</p>
                    <ul className="space-y-0.5">
                      {assessmentTools.map((t) => (
                        <MenuCard key={t.title} {...t} />
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Court & Legal</p>
                    <ul className="space-y-0.5">
                      {courtTools.map((t) => (
                        <MenuCard key={t.title} {...t} />
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>

          {/* 3. Learn */}
          <NavigationMenuItem>
            <NavigationMenuTrigger className="bg-transparent">Learn</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="w-[780px]">
                <div className="p-4 grid grid-cols-2 gap-x-6">
                  {/* Guides & Knowledge column */}
                  <div>
                    <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Guides & Knowledge</p>
                    <ul className="space-y-0.5">
                      <MenuCard
                        title="Consumer Rights Guides"
                        description="Category-specific guides"
                        icon={GraduationCap}
                        href="/guides"
                      />
                      <MenuCard
                        title="All Articles"
                        description="500+ expert articles"
                        icon={BookOpen}
                        href="/articles"
                      />
                      <MenuCard
                        title="State Rights Lookup"
                        description="Laws for your state"
                        icon={MapPin}
                        href="/state-rights"
                      />
                    </ul>
                  </div>

                  {/* Latest Article column */}
                  <div>
                    <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Latest Article</p>
                    {latestPost ? (
                      <Link
                        to={`/articles/${latestPost.slug}`}
                        className="group block rounded-lg overflow-hidden border border-border hover:border-primary/30 transition-colors"
                      >
                        {latestPost.featured_image_url && (
                          <div className="aspect-[16/9] overflow-hidden bg-muted">
                            <img
                              src={latestPost.featured_image_url}
                              alt={latestPost.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className="p-3">
                          <h4 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                            {latestPost.title}
                          </h4>
                          {latestPost.published_at && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {format(new Date(latestPost.published_at), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      </Link>
                    ) : (
                      <div className="p-3 text-sm text-muted-foreground">
                        <Link to="/articles" className="text-primary hover:underline">Browse all articles →</Link>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-muted/50 px-6 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Link to="/articles" className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                      <BookOpen className="size-4" />
                      Browse all articles
                      <ArrowRight className="size-3.5" />
                    </Link>
                    <button onClick={() => setAssistantOpen(true)} className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                      <Sparkles className="size-4" />
                      Not sure? Get AI help
                    </button>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">Popular State Laws</span>
                    {notableStateLinks.map((s) => (
                      <Link
                        key={s.code}
                        to={`/state-rights/${s.slug}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-background text-xs font-medium text-muted-foreground hover:text-foreground hover:shadow-sm transition-all ring-1 ring-border/50"
                      >
                        <span className="font-mono font-semibold">{s.code}</span>
                        <span>{s.name}</span>
                      </Link>
                    ))}
                    <Link to="/state-rights" className="text-xs text-primary font-semibold hover:underline ml-auto">
                      Browse all 50 →
                    </Link>
                  </div>
                </div>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>

          {/* 4. Get Started */}
          <NavigationMenuItem>
            <NavigationMenuTrigger className="bg-transparent">Get Started</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="w-[400px]">
                <div className="p-4">
                  <ul className="space-y-0.5">
                    {getStartedItems.map((item) => (
                      <MenuCard key={item.title} {...item} />
                    ))}
                  </ul>
                </div>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>

          {/* 5. Pricing (direct link) */}
          <NavigationMenuItem>
            <Link to="/pricing">
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>Pricing</NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <DisputeAssistantModal isOpen={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </>
  );
};

export default MegaMenu;
