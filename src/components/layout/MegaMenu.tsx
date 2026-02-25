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
  { title: 'How It Works', description: 'Learn our 3-step process', href: '/how-it-works', icon: HelpCircle },
  { title: 'FAQ', description: 'Common questions answered', href: '/faq', icon: MessageCircle },
  { title: 'Knowledge Center', description: 'Tips, guides & articles', href: '/articles', icon: BookOpen },
  { title: 'About Us', description: 'Our mission', href: '/about', icon: Users },
  { title: 'Contact', description: 'Get in touch', href: '/contact', icon: Mail },
];

const freeToolsCol1 = [
  { title: 'Do I Have a Case?', description: 'Free 2-min case quiz', href: '/do-i-have-a-case', icon: Scale },
  { title: 'Small Claims Guide', description: 'Filing limits & forms', href: '/small-claims', icon: Search },
  { title: 'Court Cost Calculator', description: 'Estimate filing fees', href: '/small-claims/cost-calculator', icon: Calculator },
  { title: 'Demand Letter Compare', description: 'DIY vs. lawyer costs', href: '/small-claims/demand-letter-cost', icon: DollarSign },
  { title: 'Escalation Flowchart', description: 'Resolution path', href: '/small-claims/escalation-guide', icon: GitBranch },
];

const freeToolsCol2 = [
  { title: 'State Rights Lookup', description: 'Laws for your state', href: '/state-rights', icon: MapPin },
  { title: 'Deadlines Calculator', description: 'How long to act', href: '/deadlines', icon: Clock },
  { title: 'Consumer News', description: 'FTC & CFPB alerts', href: '/consumer-news', icon: Newspaper },
  { title: 'Analyze My Letter', description: 'Free AI draft score', href: '/analyze-letter', icon: Search },
];

const notableStateLinks = [
  { code: 'CA', name: 'California', slug: 'california' },
  { code: 'TX', name: 'Texas', slug: 'texas' },
  { code: 'NY', name: 'New York', slug: 'new-york' },
  { code: 'FL', name: 'Florida', slug: 'florida' },
];

// Compact card with left-border accent
const CategoryCard = ({ title, description, icon: Icon, href, color, index }: {
  title: string; description?: string; icon?: React.ElementType; href: string; color: string; index: number;
}) => (
  <li>
    <NavigationMenuLink asChild>
      <Link
        to={href}
        className="flex items-start gap-2.5 select-none rounded-lg p-2.5 no-underline outline-none transition-all duration-200 hover:translate-x-0.5 hover:bg-accent/50 focus:bg-accent/50 border-l-[3px]"
        style={{ borderLeftColor: color, backgroundColor: index < 4 ? `${color}06` : undefined }}
      >
        {Icon && <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color }} />}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[13px] font-semibold leading-tight text-foreground">{title}</span>
          {description && (
            <span className="text-[11px] text-muted-foreground line-clamp-1 leading-snug">{description}</span>
          )}
        </div>
      </Link>
    </NavigationMenuLink>
  </li>
);

// Compact resource item
const ResourceItem = ({ title, description, icon: Icon, href }: {
  title: string; description?: string; icon?: React.ElementType; href: string;
}) => (
  <li>
    <NavigationMenuLink asChild>
      <Link
        to={href}
        className="flex items-start gap-2.5 select-none rounded-lg px-2.5 py-2 no-underline outline-none transition-all duration-200 hover:translate-x-0.5 hover:bg-accent/50 focus:bg-accent/50"
      >
        {Icon && (
          <div className="p-1.5 rounded-md bg-primary/8 flex-shrink-0 mt-px">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
        )}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[13px] font-semibold leading-tight text-foreground">{title}</span>
          {description && (
            <span className="text-[11px] text-muted-foreground line-clamp-1 leading-snug">{description}</span>
          )}
        </div>
      </Link>
    </NavigationMenuLink>
  </li>
);

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-2.5 pb-1 border-b border-border/60">
    {children}
  </p>
);

const CategoryGrid = ({ basePath, footerLink, footerLabel, footerIcon: FooterIcon, showAiHelp, onAiHelp }: {
  basePath: string; footerLink: string; footerLabel: string; footerIcon: React.ElementType;
  showAiHelp?: boolean; onAiHelp?: () => void;
}) => {
  const totalCount = getTotalTemplateCount();
  return (
    <div className="w-[920px] p-4 max-h-[calc(100vh-5rem)] overflow-y-auto">
      <ul className="grid grid-cols-4 gap-2">
        {templateCategories.map((category, i) => {
          const desc = category.description.split('.')[0];
          return (
            <CategoryCard
              key={category.id}
              title={category.name}
              description={desc}
              href={`${basePath}/${category.id}`}
              icon={category.icon}
              color={category.color}
              index={i}
            />
          );
        })}
        {/* Fill remaining cells in last row with promo */}
        {Array.from({ length: (4 - (templateCategories.length % 4)) % 4 }).map((_, i) => (
          <li key={`fill-${i}`} className="flex items-center justify-center rounded-lg bg-muted/30 p-2.5">
            <span className="text-xs text-muted-foreground font-medium">{totalCount}+ professional templates</span>
          </li>
        ))}
      </ul>
      <div className="border-t border-border mt-3 pt-2.5 flex items-center justify-between px-1">
        <Link to={footerLink} className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
          <FooterIcon className="h-4 w-4" />
          {footerLabel}
        </Link>
        {showAiHelp && onAiHelp && (
          <button onClick={onAiHelp} className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <Sparkles className="h-4 w-4" />
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
                footerLabel="Browse all templates →"
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
                footerLabel="View all consumer rights guides →"
                footerIcon={ArrowRight}
              />
            </NavigationMenuContent>
          </NavigationMenuItem>

          {/* Resources */}
          <NavigationMenuItem>
            <NavigationMenuTrigger className="bg-transparent">Resources</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="w-[680px] p-4 max-h-[calc(100vh-5rem)] overflow-y-auto">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <SectionHeader>General</SectionHeader>
                    <ul className="space-y-0.5">
                      {resources.map((r) => (
                        <ResourceItem key={r.title} {...r} />
                      ))}
                    </ul>
                  </div>
                  <div>
                    <SectionHeader>Free Tools</SectionHeader>
                    <ul className="space-y-0.5">
                      {freeToolsCol1.map((t) => (
                        <ResourceItem key={t.title} {...t} />
                      ))}
                    </ul>
                  </div>
                  <div>
                    <SectionHeader>Free Tools</SectionHeader>
                    <ul className="space-y-0.5">
                      {freeToolsCol2.map((t) => (
                        <ResourceItem key={t.title} {...t} />
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="border-t border-border mt-3 pt-2.5 px-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Popular State Laws</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {notableStateLinks.map((s) => (
                      <Link
                        key={s.code}
                        to={`/state-rights/${s.slug}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/20 transition-colors"
                      >
                        <span className="font-mono">{s.code}</span>
                        <span className="hidden sm:inline text-muted-foreground/70">·</span>
                        <span className="hidden sm:inline">{s.name}</span>
                      </Link>
                    ))}
                    <Link to="/state-rights" className="text-xs text-primary font-medium hover:underline transition-colors ml-1">
                      Browse all 50 →
                    </Link>
                  </div>
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
