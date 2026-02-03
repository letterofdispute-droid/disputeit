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
import { FileText, BookOpen, HelpCircle, Users, Mail, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import DisputeAssistantModal from '@/components/dispute-assistant/DisputeAssistantModal';

const resources = [
  {
    title: 'Blog',
    description: 'Tips, guides, and consumer rights articles',
    href: '/articles',
    icon: BookOpen,
  },
  {
    title: 'How It Works',
    description: 'Learn how our templates help you win disputes',
    href: '/how-it-works',
    icon: HelpCircle,
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
  icon?: React.ElementType;
  href: string;
}

const ListItem = ({ className, title, icon: Icon, href, ...props }: ListItemProps) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          to={href}
          className={cn(
            'flex items-center gap-2.5 select-none rounded-lg px-3 py-2.5 leading-none no-underline outline-none transition-colors hover:bg-accent/10 hover:text-accent-foreground focus:bg-accent/10 focus:text-accent-foreground group',
            className
          )}
          {...props}
        >
          {Icon && <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />}
          <span className="text-sm font-medium">{title}</span>
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
              <div className="w-[480px] p-4">
                {/* AI Helper Prompt */}
                <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-sm text-muted-foreground mb-2">Not sure which letter you need?</p>
                  <button 
                    onClick={() => setAssistantOpen(true)}
                    className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    <Sparkles className="h-4 w-4" />
                    Get AI Help →
                  </button>
                </div>

                {/* Single category grid - 2 columns */}
                <ul className="grid grid-cols-2 gap-1">
                  {templateCategories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <ListItem
                        key={category.id}
                        title={category.name}
                        href={`/templates/${category.id}`}
                        icon={Icon}
                      />
                    );
                  })}
                </ul>

                {/* Footer link */}
                <div className="border-t border-border mt-4 pt-3">
                  <Link 
                    to="/#letters" 
                    className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors px-3"
                  >
                    <FileText className="h-4 w-4" />
                    Browse all templates →
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
