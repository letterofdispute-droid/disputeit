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

const resources = [
  { title: 'How It Works', description: 'Learn our simple 3-step process', href: '/how-it-works', icon: HelpCircle },
  { title: 'FAQ', description: 'Common questions answered', href: '/faq', icon: MessageCircle },
  { title: 'Knowledge Center', description: 'Tips, guides & expert articles', href: '/articles', icon: BookOpen },
  { title: 'About Us', description: 'Our mission & team', href: '/about', icon: Users },
  { title: 'Contact', description: 'Get in touch with us', href: '/contact', icon: Mail },
];

const freeTools = [
  { title: 'Do I Have a Case?', description: 'Free 2-minute case assessment quiz', href: '/do-i-have-a-case', icon: Scale },
  { title: 'Small Claims Guide', description: 'Filing limits, forms & procedures', href: '/small-claims', icon: Search },
  { title: 'Court Cost Calculator', description: 'Estimate your filing fees', href: '/small-claims/cost-calculator', icon: Calculator },
  { title: 'Demand Letter Compare', description: 'DIY vs. lawyer cost breakdown', href: '/small-claims/demand-letter-cost', icon: DollarSign },
  { title: 'Escalation Flowchart', description: 'Find your best resolution path', href: '/small-claims/escalation-guide', icon: GitBranch },
  { title: 'State Rights Lookup', description: 'Consumer laws for your state', href: '/state-rights', icon: MapPin },
  { title: 'Deadlines Calculator', description: 'Know how long you have to act', href: '/deadlines', icon: Clock },
  { title: 'Consumer News', description: 'Latest FTC & CFPB alerts', href: '/consumer-news', icon: Newspaper },
  { title: 'Analyze My Letter', description: 'Free AI-powered draft scoring', href: '/analyze-letter', icon: Search },
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
        className="group relative flex gap-x-6 rounded-lg p-4 transition-colors hover:bg-accent/50"
      >
        <div className="mt-1 flex size-11 flex-none items-center justify-center rounded-lg bg-muted group-hover:bg-background">
          <Icon className="size-6 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <div>
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <p className="mt-1 text-sm leading-snug text-muted-foreground">{description}</p>
        </div>
      </Link>
    </NavigationMenuLink>
  </li>
);

const CategoryGrid = ({ basePath, footerLink, footerLabel, footerIcon: FooterIcon, showAiHelp, onAiHelp }: {
  basePath: string; footerLink: string; footerLabel: string; footerIcon: React.ElementType;
  showAiHelp?: boolean; onAiHelp?: () => void;
}) => {
  const totalCount = getTotalTemplateCount();
  return (
    <div className="w-[760px]">
      <div className="p-4">
        <ul className="grid grid-cols-2 gap-1">
          {templateCategories.map((category) => {
            const desc = category.description.split('.')[0];
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
      <div className="bg-muted/50 px-8 py-5 flex items-center justify-between">
        <Link to={footerLink} className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
          <FooterIcon className="size-5" />
          {footerLabel}
          <span className="text-xs font-normal text-muted-foreground">· {totalCount}+ templates</span>
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
              />
            </NavigationMenuContent>
          </NavigationMenuItem>

          {/* Resources */}
          <NavigationMenuItem>
            <NavigationMenuTrigger className="bg-transparent">Resources</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="w-[760px]">
                <div className="p-4 grid grid-cols-2 gap-x-4">
                  <div>
                    <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">General</p>
                    <ul className="space-y-0.5">
                      {resources.map((r) => (
                        <MenuCard key={r.title} {...r} />
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Free Tools</p>
                    <ul className="space-y-0.5">
                      {freeTools.map((t) => (
                        <MenuCard key={t.title} {...t} />
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="bg-muted/50 px-8 py-5 flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">Popular State Laws</span>
                  {notableStateLinks.map((s) => (
                    <Link
                      key={s.code}
                      to={`/state-rights/${s.slug}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-background text-xs font-medium text-muted-foreground hover:text-foreground hover:shadow-sm transition-all ring-1 ring-border/50"
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
