import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Download, Clock, CheckCircle, 
  AlertCircle, ArrowRight, User, Shield,
  Plus, Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UserLetter {
  id: string;
  title: string;
  template_name: string;
  status: string;
  created_at: string;
}

const Dashboard = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [letters, setLetters] = useState<UserLetter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchLetters();
    }
  }, [user]);

  const fetchLetters = async () => {
    const { data, error } = await supabase
      .from('user_letters')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setLetters(data);
    }
    setIsLoading(false);
  };

  const completedCount = letters.filter(l => l.status === 'completed').length;
  const pendingCount = letters.filter(l => l.status === 'draft' || l.status === 'sent').length;

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
        title="Dashboard | DisputeLetters"
        description="View and manage your dispute letters"
        canonicalPath="/dashboard"
      />

      <div className="bg-background min-h-screen">
        {/* Header */}
        <section className="bg-card border-b border-border py-8">
          <div className="container-wide">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
                  My Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Welcome back, {user?.email}! Manage your dispute letters and account.
                </p>
              </div>
              <Button variant="accent" asChild>
                <Link to="/#letters">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Letter
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-8">
          <div className="container-wide">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Letters
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{letters.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Completed
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{completedCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    In Progress
                  </CardTitle>
                  <Clock className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{pendingCount}</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Recent Letters */}
        <section className="py-8">
          <div className="container-wide">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-xl">Recent Letters</CardTitle>
                <CardDescription>Your recently created dispute letters</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : letters.length > 0 ? (
                  <div className="space-y-4">
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
                              {letter.template_name} • Created {new Date(letter.created_at).toLocaleDateString()}
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
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium text-foreground mb-2">No letters yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first dispute letter to get started.
                    </p>
                    <Button variant="accent" asChild>
                      <Link to="/#letters">
                        Create Your First Letter <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="py-8 pb-16">
          <div className="container-wide">
            <h2 className="font-serif text-xl font-bold text-foreground mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {isAdmin && (
                <Card className="cursor-pointer hover:shadow-lg transition-all border-primary/50 bg-primary/5">
                  <Link to="/admin">
                    <CardHeader>
                      <div className="p-3 bg-primary/20 rounded-lg w-fit mb-2">
                        <Shield className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">Admin Panel</CardTitle>
                      <CardDescription>Manage users, content & settings</CardDescription>
                    </CardHeader>
                  </Link>
                </Card>
              )}
              <Card className="cursor-pointer hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="p-3 bg-primary/10 rounded-lg w-fit mb-2">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Account Settings</CardTitle>
                  <CardDescription>Update your profile and preferences</CardDescription>
                </CardHeader>
              </Card>
              <Card className="cursor-pointer hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="p-3 bg-primary/10 rounded-lg w-fit mb-2">
                    <Download className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Download History</CardTitle>
                  <CardDescription>Access all your generated letters</CardDescription>
                </CardHeader>
              </Card>
              <Card className="cursor-pointer hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="p-3 bg-primary/10 rounded-lg w-fit mb-2">
                    <AlertCircle className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Help & Support</CardTitle>
                  <CardDescription>Get help with your disputes</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Dashboard;
