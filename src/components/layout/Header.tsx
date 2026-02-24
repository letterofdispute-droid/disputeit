import { Link, useNavigate } from 'react-router-dom';
import { Menu, User, LogOut, Settings, LayoutDashboard, Shield, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';
import MegaMenu from './MegaMenu';
import UserAccountMenu from './UserAccountMenu';
import GlobalSearch from '@/components/search/GlobalSearch';
import { templateCategories } from '@/data/templateCategories';
import { useAuth } from '@/hooks/useAuth';
import { trackNavClick, trackCTAClick } from '@/hooks/useGTM';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const Header = () => {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, isAdmin, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container-wide">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <img 
              src="/ld-logo.svg" 
              alt="DisputeLetters" 
              className="h-10 w-auto transition-opacity group-hover:opacity-80" 
            />
          </Link>

          {/* Desktop Navigation - Megamenu */}
          <nav className="hidden lg:flex items-center">
            <MegaMenu />
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} className="text-muted-foreground hover:text-foreground">
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
            {user ? (
              <UserAccountMenu />
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild onClick={() => trackNavClick('login')}>
                  <Link to="/login">
                    <User className="h-4 w-4 mr-2" />
                    Login
                  </Link>
                </Button>
                <Button variant="accent" size="sm" asChild onClick={() => trackCTAClick('create_letter', 'header')}>
                  <a href="/#letters">Create Letter</a>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu */}
          <div className="flex items-center gap-2 lg:hidden">
            {/* Mobile search button */}
            <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} className="text-muted-foreground hover:text-foreground">
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
            {/* Mobile user indicator - only when signed in */}
            {user && (
              <button 
                onClick={() => setOpen(true)}
                className="flex items-center gap-1"
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {profile?.first_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </button>
            )}
            
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6 overflow-y-auto max-h-[calc(100vh-80px)] pb-6">
              <Accordion type="single" collapsible>
                  <AccordionItem value="templates">
                    <AccordionTrigger className="text-base font-medium">
                      Letter Templates
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col gap-2 pl-2">
                        {templateCategories.map((category) => (
                          <Link
                            key={category.id}
                            to={`/templates/${category.id}`}
                            className="text-sm text-muted-foreground hover:text-foreground py-2"
                            onClick={() => setOpen(false)}
                          >
                            {category.name}
                          </Link>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="guides">
                    <AccordionTrigger className="text-base font-medium">
                      Consumer Rights Guides
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col gap-2 pl-2">
                        {templateCategories.map((category) => (
                          <Link
                            key={category.id}
                            to={`/guides/${category.id}`}
                            className="text-sm text-muted-foreground hover:text-foreground py-2"
                            onClick={() => setOpen(false)}
                          >
                            {category.name}
                          </Link>
                        ))}
                        <Link 
                          to="/guides" 
                          className="text-sm font-medium text-primary hover:text-primary/80 py-2"
                          onClick={() => setOpen(false)}
                        >
                          View All Guides →
                        </Link>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="resources">
                    <AccordionTrigger className="text-base font-medium">
                      Resources
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col gap-2 pl-2">
                        <Link 
                          to="/how-it-works" 
                          className="text-sm text-muted-foreground hover:text-foreground py-2"
                          onClick={() => setOpen(false)}
                        >
                          How It Works
                        </Link>
                        <Link 
                          to="/faq" 
                          className="text-sm text-muted-foreground hover:text-foreground py-2"
                          onClick={() => setOpen(false)}
                        >
                          FAQ
                        </Link>
                        <Link 
                          to="/articles" 
                          className="text-sm text-muted-foreground hover:text-foreground py-2"
                          onClick={() => setOpen(false)}
                        >
                          Knowledge Center
                        </Link>
                        <Link 
                          to="/about" 
                          className="text-sm text-muted-foreground hover:text-foreground py-2"
                          onClick={() => setOpen(false)}
                        >
                          About Us
                        </Link>
                        <Link 
                          to="/contact" 
                          className="text-sm text-muted-foreground hover:text-foreground py-2"
                          onClick={() => setOpen(false)}
                        >
                          Contact
                        </Link>
                        <div className="border-t border-border my-1 pt-1">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-1">Free Tools</p>
                        </div>
                        <Link 
                          to="/do-i-have-a-case" 
                          className="text-sm text-muted-foreground hover:text-foreground py-2"
                          onClick={() => setOpen(false)}
                        >
                          Do I Have a Case?
                        </Link>
                        <Link 
                          to="/small-claims" 
                          className="text-sm text-muted-foreground hover:text-foreground py-2"
                          onClick={() => setOpen(false)}
                        >
                          Small Claims Court Guide
                        </Link>
                        <Link 
                          to="/small-claims/cost-calculator" 
                          className="text-sm text-muted-foreground hover:text-foreground py-2 pl-3"
                          onClick={() => setOpen(false)}
                        >
                          ↳ Court Cost Calculator
                        </Link>
                        <Link 
                          to="/small-claims/demand-letter-cost" 
                          className="text-sm text-muted-foreground hover:text-foreground py-2 pl-3"
                          onClick={() => setOpen(false)}
                        >
                          ↳ Demand Letter Cost Compare
                        </Link>
                        <Link 
                          to="/small-claims/escalation-guide" 
                          className="text-sm text-muted-foreground hover:text-foreground py-2 pl-3"
                          onClick={() => setOpen(false)}
                        >
                          ↳ Escalation Guide
                        </Link>
                        <Link 
                          to="/state-rights" 
                          className="text-sm text-muted-foreground hover:text-foreground py-2"
                          onClick={() => setOpen(false)}
                        >
                          State Rights Lookup
                        </Link>
                        <Link 
                          to="/deadlines" 
                          className="text-sm text-muted-foreground hover:text-foreground py-2"
                          onClick={() => setOpen(false)}
                        >
                          Deadlines Calculator
                        </Link>
                        <Link 
                          to="/consumer-news" 
                          className="text-sm text-muted-foreground hover:text-foreground py-2"
                          onClick={() => setOpen(false)}
                        >
                          Consumer News
                        </Link>
                        <Link 
                          to="/analyze-letter" 
                          className="text-sm text-muted-foreground hover:text-foreground py-2"
                          onClick={() => setOpen(false)}
                        >
                          Analyze My Letter
                        </Link>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                
                <Link 
                  to="/pricing" 
                  className="text-base font-medium py-2"
                  onClick={() => setOpen(false)}
                >
                  Pricing
                </Link>

                <div className="border-t border-border pt-4 mt-2 flex flex-col gap-3">
                  {user ? (
                    <>
                      {/* User info header in mobile menu */}
                      <div className="flex items-center gap-3 pb-3 border-b border-border">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {profile?.first_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              {profile?.first_name || user.email?.split('@')[0]}
                            </p>
                            <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                      
                      <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                        <Link to="/dashboard" onClick={() => setOpen(false)}>
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          Dashboard
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                        <Link to="/settings" onClick={() => setOpen(false)}>
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Link>
                      </Button>
                      {isAdmin && (
                        <Button variant="default" size="sm" className="w-full justify-start" asChild>
                          <Link to="/admin" onClick={() => setOpen(false)}>
                            <Shield className="h-4 w-4 mr-2" />
                            Admin Panel
                          </Link>
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start text-destructive hover:text-destructive" 
                        onClick={() => {
                          handleSignOut();
                          setOpen(false);
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link to="/login" onClick={() => setOpen(false)}>
                          <User className="h-4 w-4 mr-2" />
                          Login
                        </Link>
                      </Button>
                      <Button variant="accent" size="sm" className="w-full" asChild>
                        <a href="/#letters" onClick={() => setOpen(false)}>
                          Create Letter
                        </a>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} triggerSource="header" />
    </header>
  );
};

export default Header;
