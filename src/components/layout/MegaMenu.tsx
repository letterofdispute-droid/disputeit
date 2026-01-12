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
import { FileText, BookOpen, HelpCircle, Users, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

const popularCategories = templateCategories.filter(c => c.popular);
const allCategories = templateCategories;

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
    href: '/#how-it-works',
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

const ListItem = ({ className, title, children, icon: Icon, href, ...props }: ListItemProps) => {
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
  return (
    <NavigationMenu>
      <NavigationMenuList>
        {/* Letter Templates */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent">
            Letter Templates
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="w-[600px] p-4 md:w-[700px] lg:w-[800px]">
              {/* Popular Categories */}
              <div className="mb-4">
                <h4 className="mb-3 text-sm font-medium text-muted-foreground px-3">
                  Popular Categories
                </h4>
                <ul className="grid grid-cols-3 gap-2">
                  {popularCategories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <ListItem
                        key={category.id}
                        title={category.name}
                        href={`/category/${category.id}`}
                        icon={Icon}
                      >
                        {category.templateCount} templates
                      </ListItem>
                    );
                  })}
                </ul>
              </div>

              {/* Divider */}
              <div className="border-t border-border my-4" />

              {/* All Categories */}
              <div>
                <h4 className="mb-3 text-sm font-medium text-muted-foreground px-3">
                  All Categories
                </h4>
                <ul className="grid grid-cols-3 gap-2">
                  {allCategories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <ListItem
                        key={category.id}
                        title={category.name}
                        href={`/category/${category.id}`}
                        icon={Icon}
                      >
                        {category.templateCount} templates
                      </ListItem>
                    );
                  })}
                </ul>
              </div>

              {/* View All Link */}
              <div className="border-t border-border mt-4 pt-4">
                <Link 
                  to="/#letters" 
                  className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors px-3"
                >
                  <FileText className="h-4 w-4" />
                  View all letter templates →
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
                <ListItem
                  key={resource.title}
                  title={resource.title}
                  href={resource.href}
                  icon={resource.icon}
                >
                  {resource.description}
                </ListItem>
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
  );
};

export default MegaMenu;
