import { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { FileText, BookOpen, HelpCircle, Users, Mail, Sparkles, MessageCircle, ArrowRight, MapPin, Clock, Newspaper, Search, Scale, Calculator, DollarSign, GitBranch } from 'lucide-react';
import DisputeAssistantModal from '@/components/dispute-assistant/DisputeAssistantModal';

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
};

const resources = [
  { title: 'How It Works', description: 'Simple 3-step process', href: '/how-it-works', icon: HelpCircle },
  { title: 'FAQ', description: 'Common questions', href: '/faq', icon: MessageCircle },
  { title: 'Knowledge Center', description: 'Tips & expert articles', href: '/articles', icon: BookOpen },
  { title: 'About Us', description: 'Our mission & team', href: '/about', icon: Users },
  { title: 'Contact', description: 'Get in touch', href: '/contact', icon: Mail },
];

const freeTools = [
  { title: 'Do I Have a Case?', description: 'Free case assessment', href: '/do-i-have-a-case', icon: Scale },
  { title: 'Small Claims Guide', description: 'Filing limits & forms', href: '/small-claims', icon: Search },
  { title: 'Court Cost Calculator', description: 'Estimate filing fees', href: '/small-claims/cost-calculator', icon: Calculator },
  { title: 'Demand Letter Compare', description: 'DIY vs. lawyer costs', href: '/small-claims/demand-letter-cost', icon: DollarSign },
  { title: 'Escalation Flowchart', description: 'Best resolution path', href: '/small-claims/escalation-guide', icon: GitBranch },
  { title: 'State Rights Lookup', description: 'Laws for your state', href: '/state-rights', icon: MapPin },
  { title: 'Deadlines Calculator', description: 'Time limits to act', href: '/deadlines', icon: Clock },
  { title: 'Consumer News', description: 'FTC & CFPB alerts', href: '/consumer-news', icon: Newspaper },
  { title: 'Analyze My Letter', description: 'AI draft scoring', href: '/analyze-letter', icon: Search },
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
        <Link to={footerLink} className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
          <FooterIcon className="size-4" />
          {footerLabel}
          <span className="text-xs font-normal text-muted-foreground">· {totalCount}+ {footerUnit}</span>
        </Link>
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

  return (
    <>
      <NavigationMenu>
        <NavigationMenuList>
          {/* Letter Templates */}
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

          {/* Guides */}
          <NavigationMenuItem>
            <NavigationMenuTrigger className="bg-transparent">Guides</NavigationMenuTrigger>
            <NavigationMenuContent>
              <CategoryGrid
                basePath="/guides"
                footerLink="/guides"
                footerLabel="View all guides"
                footerIcon={ArrowRight}
                footerUnit="guides"
              />
            </NavigationMenuContent>
          </NavigationMenuItem>

          {/* Resources */}
          <NavigationMenuItem>
            <NavigationMenuTrigger className="bg-transparent">Resources</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="w-[980px]">
                <div className="p-4 grid grid-cols-2 gap-x-2">
                  <div>
                    <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">General</p>
                    <ul className="space-y-0.5">
                      {resources.map((r) => (
                        <CompactMenuCard key={r.title} {...r} />
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Free Tools</p>
                    <ul className="space-y-0.5">
                      {freeTools.map((t) => (
                        <CompactMenuCard key={t.title} {...t} />
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="bg-muted/50 px-6 py-4 flex items-center gap-3 flex-wrap">
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
            </NavigationMenuContent>
          </NavigationMenuItem>

          {/* Pricing */}
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
