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
import { templateCategories } from '@/data/templateCategories';
import { FileText, BookOpen, HelpCircle, Users, Mail, Sparkles, MessageCircle, ArrowRight, MapPin, Clock, Newspaper, Search, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import DisputeAssistantModal from '@/components/dispute-assistant/DisputeAssistantModal';

const resources = [
  { title: 'How It Works', description: 'Learn our 3-step process', href: '/how-it-works', icon: HelpCircle },
  { title: 'FAQ', description: 'Common questions answered', href: '/faq', icon: MessageCircle },
  { title: 'Knowledge Center', description: 'Tips, guides, and articles', href: '/articles', icon: BookOpen },
  { title: 'About Us', description: 'Our mission to empower consumers', href: '/about', icon: Users },
  { title: 'Contact', description: 'Get in touch with our team', href: '/contact', icon: Mail },
];

const freeTools = [
  { title: 'Do I Have a Case?', description: 'Free 2-min case strength quiz', href: '/do-i-have-a-case', icon: Scale },
  { title: 'Small Claims Court Guide', description: 'Filing limits, fees & forms by state', href: '/small-claims', icon: Search },
  { title: 'State Rights Lookup', description: 'Find laws for your state', href: '/state-rights', icon: MapPin },
  { title: 'Deadlines Calculator', description: 'See how long you have to act', href: '/deadlines', icon: Clock },
  { title: 'Consumer News', description: 'Latest FTC, CFPB & recall alerts', href: '/consumer-news', icon: Newspaper },
  { title: 'Analyze My Letter', description: 'Free AI score on your draft', href: '/analyze-letter', icon: Search },
];

const notableStateLinks = [
  { code: 'CA', name: 'California', slug: 'california' },
  { code: 'TX', name: 'Texas', slug: 'texas' },
  { code: 'NY', name: 'New York', slug: 'new-york' },
  { code: 'FL', name: 'Florida', slug: 'florida' },
];

// Card-style item for Templates & Guides grids
interface CardItemProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  href: string;
  iconColor?: string;
  iconBg?: string;
}

const CardItem = ({ title, description, icon: Icon, href, iconColor, iconBg }: CardItemProps) => (
  <li>
    <NavigationMenuLink asChild>
      <Link
        to={href}
        className="flex items-start gap-3 select-none rounded-xl p-3 no-underline outline-none transition-all hover:bg-accent/8 hover:shadow-sm focus:bg-accent/8 group"
      >
        {Icon && (
          <div
            className="p-2 rounded-xl flex-shrink-0 mt-0.5"
            style={{ backgroundColor: iconBg || 'hsl(var(--primary) / 0.08)' }}
          >
            <Icon
              className="h-5 w-5"
              style={{ color: iconColor || 'hsl(var(--primary))' }}
            />
          </div>
        )}
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-sm font-semibold leading-tight text-foreground">{title}</span>
          {description && (
            <span className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{description}</span>
          )}
        </div>
      </Link>
    </NavigationMenuLink>
  </li>
);

// Compact card item for Resources panel
interface ResourceCardItemProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  href: string;
}

const ResourceCardItem = ({ title, description, icon: Icon, href }: ResourceCardItemProps) => (
  <li>
    <NavigationMenuLink asChild>
      <Link
        to={href}
        className="flex items-start gap-3 select-none rounded-xl px-3 py-2.5 no-underline outline-none transition-all hover:bg-accent/8 hover:shadow-sm focus:bg-accent/8"
      >
        {Icon && (
          <div className="p-1.5 rounded-lg bg-primary/8 flex-shrink-0 mt-0.5">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        )}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-semibold leading-tight text-foreground">{title}</span>
          {description && (
            <span className="text-xs text-muted-foreground line-clamp-1 leading-snug">{description}</span>
          )}
        </div>
      </Link>
    </NavigationMenuLink>
  </li>
);

const MegaMenu = () => {
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <>
      <NavigationMenu>
        <NavigationMenuList>
          {/* Letter Templates */}
          <NavigationMenuItem>
            <NavigationMenuTrigger className="bg-transparent">
              Letter Templates
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="w-[860px] p-5 max-h-[calc(100vh-5rem)] overflow-y-auto">
                <ul className="grid grid-cols-3 gap-1">
                  {templateCategories.map((category) => {
                    const Icon = category.icon;
                    const desc = category.description.split('.')[0];
                    return (
                      <CardItem
                        key={category.id}
                        title={category.name}
                        description={desc}
                        href={`/templates/${category.id}`}
                        icon={Icon}
                        iconColor={category.color}
                        iconBg={`${category.color}18`}
                      />
                    );
                  })}
                </ul>

                {/* Footer */}
                <div className="border-t border-border mt-4 pt-3 flex items-center justify-between px-1">
                  <Link
                    to="/#letters"
                    className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    Browse all templates →
                  </Link>
                  <button
                    onClick={() => setAssistantOpen(true)}
                    className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Sparkles className="h-4 w-4" />
                    Not sure? Get AI help
                  </button>
                </div>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>

          {/* Guides */}
          <NavigationMenuItem>
            <NavigationMenuTrigger className="bg-transparent">
              Guides
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="w-[860px] p-5 max-h-[calc(100vh-5rem)] overflow-y-auto">
                <ul className="grid grid-cols-3 gap-1">
                  {templateCategories.map((category) => {
                    const Icon = category.icon;
                    const desc = category.description.split('.')[0];
                    return (
                      <CardItem
                        key={category.id}
                        title={category.name}
                        description={desc}
                        href={`/guides/${category.id}`}
                        icon={Icon}
                        iconColor={category.color}
                        iconBg={`${category.color}18`}
                      />
                    );
                  })}
                </ul>

                {/* Footer */}
                <div className="border-t border-border mt-4 pt-3 px-1">
                  <Link
                    to="/guides"
                    className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    <ArrowRight className="h-4 w-4" />
                    View all consumer rights guides →
                  </Link>
                </div>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>

          {/* Resources */}
          <NavigationMenuItem>
            <NavigationMenuTrigger className="bg-transparent">
              Resources
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="w-[540px] p-5 max-h-[calc(100vh-5rem)] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 px-3">General</p>
                    <ul className="space-y-0.5">
                      {resources.map((resource) => (
                        <ResourceCardItem
                          key={resource.title}
                          title={resource.title}
                          description={resource.description}
                          href={resource.href}
                          icon={resource.icon}
                        />
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 px-3">Free Tools</p>
                    <ul className="space-y-0.5">
                      {freeTools.map((tool) => (
                        <ResourceCardItem
                          key={tool.title}
                          title={tool.title}
                          description={tool.description}
                          href={tool.href}
                          icon={tool.icon}
                        />
                      ))}
                    </ul>
                  </div>
                </div>

                {/* State laws footer strip */}
                <div className="border-t border-border mt-4 pt-3 px-1">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Popular State Laws</p>
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
                    <Link
                      to="/state-rights"
                      className="text-xs text-primary font-medium hover:underline transition-colors ml-1"
                    >
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
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Pricing
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <DisputeAssistantModal
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
      />
    </>
  );
};

export default MegaMenu;
