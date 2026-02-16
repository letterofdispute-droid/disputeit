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
import { FileText, BookOpen, HelpCircle, Users, Mail, Sparkles, MessageCircle, Scale, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import DisputeAssistantModal from '@/components/dispute-assistant/DisputeAssistantModal';

const resources = [
  {
    title: 'How It Works',
    description: 'Learn our 3-step process',
    href: '/how-it-works',
    icon: HelpCircle,
  },
  {
    title: 'FAQ',
    description: 'Common questions answered',
    href: '/faq',
    icon: MessageCircle,
  },
  {
    title: 'Knowledge Center',
    description: 'Tips, guides, and articles',
    href: '/articles',
    icon: BookOpen,
  },
  {
    title: 'About Us',
    description: 'Our mission to empower consumers',
    href: '/about',
    icon: Users,
  },
  {
    title: 'Contact',
    description: 'Get in touch with our team',
    href: '/contact',
    icon: Mail,
  },
];

interface ListItemProps extends React.ComponentPropsWithoutRef<'a'> {
  title: string;
  description?: string;
  icon?: React.ElementType;
  href: string;
}

const ListItem = ({ className, title, description, icon: Icon, href, ...props }: ListItemProps) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          to={href}
          className={cn(
            'flex items-start gap-2 select-none rounded-lg p-2.5 leading-none no-underline outline-none transition-colors hover:bg-accent/10 hover:text-accent-foreground focus:bg-accent/10 focus:text-accent-foreground group',
            className
          )}
          {...props}
        >
          {Icon && (
            <div className="p-1.5 rounded-md bg-primary/5 flex-shrink-0">
              <Icon className="h-3.5 w-3.5 text-primary" />
            </div>
          )}
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm font-medium leading-tight">{title}</span>
            {description && (
              <span className="text-xs text-muted-foreground line-clamp-2 leading-snug">{description}</span>
            )}
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  );
};

interface ResourceListItemProps extends React.ComponentPropsWithoutRef<'a'> {
  title: string;
  icon?: React.ElementType;
  href: string;
  children?: React.ReactNode;
}

const ResourceListItem = ({ className, title, children, icon: Icon, href, ...props }: ResourceListItemProps) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          to={href}
          className={cn(
            'block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-colors hover:bg-accent/10 hover:text-accent-foreground focus:bg-accent/10 focus:text-accent-foreground',
            className
          )}
          {...props}
        >
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            <div className="text-sm font-medium leading-none">{title}</div>
          </div>
          {children && (
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground mt-1">
              {children}
            </p>
          )}
        </Link>
      </NavigationMenuLink>
    </li>
  );
};

const GuideListItem = ({ className, title, icon: Icon, href, ...props }: ListItemProps) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          to={href}
          className={cn(
            'flex items-center gap-2 select-none rounded-lg p-2 leading-none no-underline outline-none transition-colors hover:bg-accent/10 hover:text-accent-foreground focus:bg-accent/10 focus:text-accent-foreground group',
            className
          )}
          {...props}
        >
          {Icon && <Icon className="h-4 w-4 text-primary flex-shrink-0" />}
          <span className="text-sm">{title}</span>
        </Link>
      </NavigationMenuLink>
    </li>
  );
};

const MegaMenu = () => {
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <>
      <NavigationMenu>
        <NavigationMenuList>
          {/* Letter Templates - 3 Column Layout */}
          <NavigationMenuItem>
            <NavigationMenuTrigger className="bg-transparent nav-underline">
              Letter Templates
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="w-[800px] p-4">
                {/* AI Helper Prompt */}
                <div className="mb-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-sm text-muted-foreground mb-1.5">Not sure which letter you need?</p>
                  <button 
                    onClick={() => setAssistantOpen(true)}
                    className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    <Sparkles className="h-4 w-4" />
                    Get AI Help →
                  </button>
                </div>

                {/* Category grid with descriptions - 3 columns */}
                <ul className="grid grid-cols-3 gap-1">
                  {templateCategories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <ListItem
                        key={category.id}
                        title={category.name}
                        description={category.description}
                        href={`/templates/${category.id}`}
                        icon={Icon}
                      />
                    );
                  })}
                </ul>

                {/* Footer link */}
                <div className="border-t border-border mt-3 pt-2">
                  <Link 
                    to="/#letters" 
                    className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors px-2"
                  >
                    <FileText className="h-4 w-4" />
                    Browse all templates →
                  </Link>
                </div>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>

          {/* Consumer Rights Guides - Upgraded menu */}
          <NavigationMenuItem>
            <NavigationMenuTrigger className="bg-transparent nav-underline">
              Guides
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="w-[750px] p-4">
                {/* Top pick banner */}
                <div className="mb-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-xs text-muted-foreground mb-1">Popular guide</p>
                  <Link 
                    to="/guides/refunds"
                    className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    <Scale className="h-4 w-4" />
                    Know your refund rights before writing your dispute letter →
                  </Link>
                </div>

                {/* Category grid with descriptions - 3 columns */}
                <ul className="grid grid-cols-3 gap-1">
                  {templateCategories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <li key={category.id}>
                        <NavigationMenuLink asChild>
                          <Link
                            to={`/guides/${category.id}`}
                            className="flex items-start gap-2 select-none rounded-lg p-2.5 leading-none no-underline outline-none transition-colors hover:bg-accent/10 hover:text-accent-foreground focus:bg-accent/10 focus:text-accent-foreground group"
                          >
                            <div className="p-1.5 rounded-md flex-shrink-0" style={{ backgroundColor: `${category.color}15` }}>
                              <Icon className="h-3.5 w-3.5" style={{ color: category.color }} />
                            </div>
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium leading-tight">{category.name.replace(' & ', ' ')}</span>
                              </div>
                              <span className="text-xs text-muted-foreground line-clamp-1 leading-snug">
                                {category.description.split('.')[0]}
                              </span>
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    );
                  })}
                </ul>

                {/* Footer link */}
                <div className="border-t border-border mt-3 pt-2">
                  <Link 
                    to="/guides" 
                    className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors px-2"
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
            <NavigationMenuTrigger className="bg-transparent nav-underline">
              Resources
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-2 p-4">
                {resources.map((resource) => (
                  <ResourceListItem
                    key={resource.title}
                    title={resource.title}
                    href={resource.href}
                    icon={resource.icon}
                  >
                    {resource.description}
                  </ResourceListItem>
                ))}
              </ul>
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
