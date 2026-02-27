import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Home, FileText, ArrowRight } from "lucide-react";

const popularCategories = [
  { id: 'refunds', name: 'Refunds & Returns', icon: '💳', description: 'Get your money back' },
  { id: 'housing', name: 'Housing & Tenancy', icon: '🏠', description: 'Landlord disputes' },
  { id: 'travel', name: 'Travel & Airlines', icon: '✈️', description: 'Flight & hotel issues' },
  { id: 'insurance', name: 'Insurance Claims', icon: '🛡️', description: 'Claim denials' },
  { id: 'vehicle', name: 'Vehicle & Auto', icon: '🚗', description: 'Car purchase & repairs' },
  { id: 'utilities', name: 'Utilities & Telecom', icon: '💡', description: 'Billing disputes' },
];

// Floating document animation component
const FloatingDocument = () => (
  <motion.div
    className="relative w-32 h-40"
    animate={{
      y: [0, -10, 0],
      rotate: [0, 2, 0, -2, 0],
    }}
    transition={{
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  >
    {/* Document shadow */}
    <motion.div
      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-3 bg-muted rounded-full blur-md"
      animate={{
        scale: [1, 0.9, 1],
        opacity: [0.3, 0.2, 0.3],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
    
    {/* Document body */}
    <motion.div className="relative bg-card rounded-lg border-2 border-border shadow-lg w-full h-full overflow-hidden">
      {/* Document lines */}
      <div className="absolute top-6 left-4 right-4 space-y-2">
        <div className="h-2 bg-muted rounded w-3/4" />
        <div className="h-2 bg-muted rounded w-full" />
        <div className="h-2 bg-muted rounded w-5/6" />
        <div className="h-2 bg-muted rounded w-2/3" />
      </div>
      
      {/* Question mark */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <span className="text-5xl font-bold text-primary/20">?</span>
      </motion.div>
      
      {/* Corner fold */}
      <div className="absolute top-0 right-0 w-6 h-6 bg-muted border-l border-b border-border" 
        style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }} 
      />
    </motion.div>
  </motion.div>
);

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

  // Extract potential category hint from URL
  const pathHint = location.pathname.toLowerCase();
  const suggestedCategory = popularCategories.find(
    cat => pathHint.includes(cat.id) || pathHint.includes(cat.name.toLowerCase())
  );

  return (
    <Layout>
      <SEOHead
        title="Page Not Found | Dispute Letters"
        description="The page you're looking for doesn't exist or has been moved. Find what you need using our search or browse our template categories."
        canonicalPath="/404"
        noIndex={true}
      />

      <div className="min-h-[80vh] flex items-center justify-center py-16 px-4 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-2xl w-full text-center">
          {/* Animated Illustration */}
          <motion.div
            className="mb-8 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <FloatingDocument />
          </motion.div>

          {/* 404 Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-7xl font-bold text-primary mb-4">404</h1>
          </motion.div>

          {/* Message with personality */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-3 mb-8"
          >
            <h2 className="text-2xl md:text-3xl font-serif font-semibold text-foreground">
              Hmm, this page took a vacation
            </h2>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Looks like this letter got lost in the mail. Let us help you find what you need.
            </p>
          </motion.div>

          {/* Search Box */}
          <motion.form
            onSubmit={handleSearch}
            className="mb-10 max-w-md mx-auto"
            role="search"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search for a template..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                  aria-label="Search templates"
                />
              </div>
              <Button type="submit" size="lg" variant="accent">
                Search
              </Button>
            </div>
          </motion.form>

          {/* Suggested Category (if URL hints at one) */}
          {suggestedCategory && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="mb-8"
            >
              <p className="text-sm text-muted-foreground mb-3">Were you looking for this?</p>
              <Link
                to={`/templates/${suggestedCategory.id}`}
                className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors"
              >
                <span className="text-2xl">{suggestedCategory.icon}</span>
                <span className="font-medium text-foreground">{suggestedCategory.name}</span>
                <ArrowRight className="w-4 h-4 text-primary" />
              </Link>
            </motion.div>
          )}

          {/* Popular Categories */}
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
              Popular Categories
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {popularCategories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                >
                  <Link
                    to={`/templates/${category.id}`}
                    className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-md transition-all group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">
                      {category.icon}
                    </span>
                    <div className="text-left">
                      <span className="block font-medium text-foreground text-sm">
                        {category.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {category.description}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
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
          </motion.div>

          {/* Help Text */}
          <motion.p
            className="mt-10 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            Still stuck? <Link to="/contact" className="text-primary underline hover:no-underline">Contact our support team</Link>
          </motion.p>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
