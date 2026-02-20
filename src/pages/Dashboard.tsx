import { useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, Download, Clock, CheckCircle, 
  AlertCircle, ArrowRight, User, Shield,
  Plus, Loader2, ShoppingBag, Sparkles,
  Settings, HelpCircle, FileSearch, Target
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import PurchasedLetterCard from '@/components/dashboard/PurchasedLetterCard';
import CreditsCard from '@/components/dashboard/CreditsCard';
import DisputeTracker from '@/components/dashboard/DisputeTracker';
import { trackDashboardView } from '@/hooks/useGTM';

interface UserLetter {
  id: string;
  title: string;
  template_name: string;
  template_slug: string;
  status: string;
  created_at: string;
}

interface Purchase {
  id: string;
  template_name: string;
  template_slug: string;
  purchase_type: string;
  amount_cents: number;
  created_at: string;
  status: string;
}



// Recommended templates based on category
const categoryRecommendations: Record<string, { id: string; name: string; icon: string }[]> = {
  'refunds': [
    { id: 'insurance', name: 'Insurance Claims', icon: '🛡️' },
    { id: 'ecommerce', name: 'E-Commerce', icon: '🛒' },
  ],
  'insurance': [
    { id: 'healthcare', name: 'Healthcare', icon: '🏥' },
    { id: 'vehicle', name: 'Vehicle', icon: '🚗' },
  ],
  'housing': [
    { id: 'utilities', name: 'Utilities', icon: '💡' },
    { id: 'hoa', name: 'HOA', icon: '🏘️' },
  ],
  'default': [
    { id: 'refunds', name: 'Refunds', icon: '💳' },
    { id: 'insurance', name: 'Insurance', icon: '🛡️' },
    { id: 'housing', name: 'Housing', icon: '🏠' },
  ],
};

const Dashboard = () => {
  const { user, isAdmin, isLoading: authLoading, profile } = useAuth();
  const navigate = useNavigate();
  const dashboardViewedRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && !dashboardViewedRef.current) {
      dashboardViewedRef.current = true;
      trackDashboardView();
    }
  }, [user]);

  // React Query for letters — cached for 5 minutes
  const { data: letters = [], isLoading } = useQuery({
    queryKey: ['user-letters', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_letters')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as UserLetter[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // React Query for purchases — cached for 5 minutes
  const { data: purchases = [], isLoading: isPurchasesLoading } = useQuery({
    queryKey: ['user-purchases', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('letter_purchases')
        .select('id, template_name, template_slug, purchase_type, amount_cents, created_at, status')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Purchase[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Get display name from AuthContext profile (no extra fetch needed)
  const displayName = profile?.first_name || user?.email?.split('@')[0] || 'there';

  // Calculate stats
  const completedCount = letters.filter(l => l.status === 'completed').length;
  const inProgressCount = letters.filter(l => l.status === 'draft' || l.status === 'sent').length;

  // Get recommended categories based on purchases
  const recommendations = useMemo(() => {
    if (purchases.length === 0) return categoryRecommendations['default'];
    
    const purchasedCategories = purchases.map(p => {
      const slug = p.template_slug || '';
      if (slug.includes('refund')) return 'refunds';
      if (slug.includes('insurance')) return 'insurance';
      if (slug.includes('housing') || slug.includes('tenant')) return 'housing';
      return 'default';
    });
    
    const primaryCategory = purchasedCategories[0] || 'default';
    return categoryRecommendations[primaryCategory] || categoryRecommendations['default'];
  }, [purchases]);

  // Most recent purchase for highlight
  const mostRecentPurchase = purchases[0];

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead 
        title="My Dashboard | Letter of Dispute"
        description="View and manage your dispute letters"
        canonicalPath="/dashboard"
        noIndex={true}
      />

      <div className="bg-background min-h-screen">
        {/* Personalized Header */}
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-gradient-to-r from-primary/5 via-card to-accent/5 border-b border-border py-8"
        >
          <div className="container-wide">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
                  {getGreeting()}, {displayName}! 👋
                </h1>
                <p className="text-muted-foreground">
                  {purchases.length > 0 
                    ? `You have ${purchases.length} letter${purchases.length !== 1 ? 's' : ''} ready to download`
                    : 'Create your first dispute letter to get started'}
                </p>
              </div>
              <Button variant="accent" size="lg" asChild className="gap-2">
                <Link to="/templates">
                  <Plus className="h-4 w-4" />
                  Create New Letter
                </Link>
              </Button>
            </div>
          </div>
        </motion.section>

        {/* Quick Stats */}
        <section className="py-6 border-b border-border bg-card/50">
          <div className="container-wide">
            <div className="flex flex-wrap gap-6 md:gap-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="flex items-center gap-3"
              >
                <div className="p-2 bg-success/10 rounded-lg">
                  <ShoppingBag className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{purchases.length}</p>
                  <p className="text-sm text-muted-foreground">Purchased</p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{inProgressCount}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="flex items-center gap-3"
              >
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{completedCount}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-8">
          <div className="container-wide">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Column - Letters */}
              <div className="lg:col-span-2 space-y-6">
                {/* Featured Recent Purchase */}
                {mostRecentPurchase && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                  >
                    <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">Most Recent Purchase</CardTitle>
                          </div>
                          <Badge className="bg-success text-white">Ready</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <PurchasedLetterCard purchase={mostRecentPurchase} featured />
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Tabs for Purchases and Drafts */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <Tabs defaultValue="purchases" className="w-full">
                     <TabsList className="mb-4">
                      <TabsTrigger value="purchases" className="gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        All Purchases ({purchases.length})
                      </TabsTrigger>
                      <TabsTrigger value="drafts" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Drafts ({letters.length})
                      </TabsTrigger>
                      <TabsTrigger value="disputes" className="gap-2">
                        <Target className="h-4 w-4" />
                        My Disputes
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="purchases">
                      <Card>
                        <CardContent className="pt-6">
                          {isPurchasesLoading ? (
                            <div className="flex items-center justify-center py-12">
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                          ) : purchases.length > 0 ? (
                            <div className="space-y-4">
                              {purchases.slice(mostRecentPurchase ? 1 : 0).map((purchase) => (
                                <PurchasedLetterCard key={purchase.id} purchase={purchase} />
                              ))}
                              {purchases.length === 1 && mostRecentPurchase && (
                                <p className="text-center text-muted-foreground py-4">
                                  Your only purchase is shown above
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                              </div>
                              <h3 className="font-medium text-foreground mb-2">No purchases yet</h3>
                              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                Create a dispute letter and purchase it to access professional-grade documents.
                              </p>
                              <Button variant="accent" asChild>
                                <Link to="/templates">
                                  Browse Templates <ArrowRight className="h-4 w-4 ml-2" />
                                </Link>
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="drafts">
                      <Card>
                        <CardContent className="pt-6">
                          {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                          ) : letters.length > 0 ? (
                            <div className="space-y-3">
                              {letters.map((letter) => (
                                <div 
                                  key={letter.id}
                                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                      <FileText className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-foreground">{letter.title}</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {letter.template_name} - {new Date(letter.created_at).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Badge 
                                      variant={letter.status === 'completed' ? 'default' : 'secondary'}
                                      className={letter.status === 'completed' ? 'bg-success' : 'bg-accent/20 text-accent'}
                                    >
                                      {letter.status === 'completed' ? 'Completed' : letter.status}
                                    </Badge>
                                    <Button variant="ghost" size="icon">
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                              </div>
                              <h3 className="font-medium text-foreground mb-2">No drafts yet</h3>
                              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                Start creating a letter and save it as a draft to continue later.
                              </p>
                              <Button variant="accent" asChild>
                                <Link to="/templates">
                                  Start a Letter <ArrowRight className="h-4 w-4 ml-2" />
                                </Link>
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="disputes">
                      <DisputeTracker />
                    </TabsContent>
                  </Tabs>
                </motion.div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Credits Card */}
                <CreditsCard />

                {/* Recommendations */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Recommended For You
                      </CardTitle>
                      <CardDescription>
                        {purchases.length > 0 
                          ? 'Based on your purchase history' 
                          : 'Popular letter categories'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {recommendations.map((rec) => (
                        <Link
                          key={rec.id}
                          to={`/templates/${rec.id}`}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                        >
                          <span className="text-2xl">{rec.icon}</span>
                          <span className="flex-1 font-medium text-foreground">{rec.name}</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </Link>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                        >
                          <Shield className="h-5 w-5 text-primary" />
                          <span className="font-medium text-foreground">Admin Panel</span>
                        </Link>
                      )}
                      <Link
                        to="/templates"
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <FileSearch className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-foreground">Browse Templates</span>
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <Settings className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-foreground">Account Settings</span>
                      </Link>
                      <Link
                        to="/contact"
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <HelpCircle className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-foreground">Help & Support</span>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Dashboard;
