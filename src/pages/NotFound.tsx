import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Home, FileText, ArrowRight, AlertCircle } from "lucide-react";

const popularCategories = [
  { id: 'refunds', name: 'Refunds', icon: '💳' },
  { id: 'housing', name: 'Housing', icon: '🏠' },
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'insurance', name: 'Insurance', icon: '🛡️' },
  { id: 'vehicle', name: 'Vehicle', icon: '🚗' },
  { id: 'utilities', name: 'Utilities', icon: '💡' },
];

const NotFound = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/templates?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>Page Not Found | Dispute Letters</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="The page you're looking for doesn't exist or has been moved. Find what you need using our search or browse our template categories." />
      </Helmet>

      <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
        <div className="max-w-2xl w-full text-center">
          {/* 404 Icon */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted mb-4">
              <AlertCircle className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
          </div>

          {/* Message */}
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
            Page Not Found
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. 
            Try searching or browse our template categories below.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="mb-10 max-w-md mx-auto" role="search">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search for a template..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  aria-label="Search templates"
                />
              </div>
              <Button type="submit">
                Search
              </Button>
            </div>
          </form>

          {/* Popular Categories */}
          <div className="mb-10">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
              Popular Categories
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              {popularCategories.map((category) => (
                <Link
                  key={category.id}
                  to={`/templates/${category.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="default" size="lg">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Return to Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/templates">
                <FileText className="w-4 h-4 mr-2" />
                Browse All Templates
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Help Text */}
          <p className="mt-10 text-sm text-muted-foreground">
            Need help? <Link to="/contact" className="text-primary underline hover:no-underline">Contact our support team</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
