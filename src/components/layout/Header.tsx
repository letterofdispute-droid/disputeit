import { Link, useNavigate } from 'react-router-dom';
import { Menu, User, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import MegaMenu from './MegaMenu';
import { templateCategories } from '@/data/templateCategories';
import { useAuth } from '@/hooks/useAuth';
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
  const { user, isAdmin, signOut } = useAuth();
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
              className="h-9 transition-opacity group-hover:opacity-80" 
            />
          </Link>

          {/* Desktop Navigation - Megamenu */}
          <nav className="hidden lg:flex items-center">
            <MegaMenu />
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <>
                {isAdmin && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/admin">
                      <Settings className="h-4 w-4 mr-2" />
                      Admin
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard">
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">
                    <User className="h-4 w-4 mr-2" />
                    Login
                  </Link>
                </Button>
                <Button variant="accent" size="sm" asChild>
                  <Link to="/#letters">Create Letter</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
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
                  <AccordionItem value="resources">
                    <AccordionTrigger className="text-base font-medium">
                      Resources
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col gap-2 pl-2">
                        <Link 
                          to="/articles" 
                          className="text-sm text-muted-foreground hover:text-foreground py-2"
                          onClick={() => setOpen(false)}
                        >
                          Blog
                        </Link>
                        <Link 
                          to="/#how-it-works" 
                          className="text-sm text-muted-foreground hover:text-foreground py-2"
                          onClick={() => setOpen(false)}
                        >
                          How It Works
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
                      {isAdmin && (
                        <Button variant="default" size="sm" className="w-full" asChild>
                          <Link to="/admin" onClick={() => setOpen(false)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Admin Panel
                          </Link>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link to="/dashboard" onClick={() => setOpen(false)}>
                          <User className="h-4 w-4 mr-2" />
                          Dashboard
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full" 
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
                        <Link to="/#letters" onClick={() => setOpen(false)}>
                          Create Letter
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
