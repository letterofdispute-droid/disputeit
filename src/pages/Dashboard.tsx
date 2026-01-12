import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Download, Clock, CheckCircle, 
  AlertCircle, ArrowRight, Settings, User,
  Plus
} from 'lucide-react';

// Mock data - will be replaced with real data when auth is implemented
const mockLetters = [
  {
    id: '1',
    title: 'Refund Request - Amazon Order',
    template: 'Refund Request',
    createdAt: '2024-01-10',
    status: 'completed',
  },
  {
    id: '2',
    title: 'Security Deposit Demand - 123 Main St',
    template: 'Security Deposit Demand',
    createdAt: '2024-01-08',
    status: 'completed',
  },
  {
    id: '3',
    title: 'Flight Delay Compensation - UA1234',
    template: 'EU261 Compensation',
    createdAt: '2024-01-05',
    status: 'pending',
  },
];

const Dashboard = () => {
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
                  Welcome back! Manage your dispute letters and account settings.
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
                  <div className="text-3xl font-bold text-foreground">3</div>
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
                  <div className="text-3xl font-bold text-foreground">2</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pending Response
                  </CardTitle>
                  <Clock className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">1</div>
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
                <div className="space-y-4">
                  {mockLetters.map((letter) => (
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
                            {letter.template} • Created {new Date(letter.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={letter.status === 'completed' ? 'default' : 'secondary'}
                          className={letter.status === 'completed' ? 'bg-success' : 'bg-accent/20 text-accent'}
                        >
                          {letter.status === 'completed' ? 'Completed' : 'Pending'}
                        </Badge>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {mockLetters.length === 0 && (
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
