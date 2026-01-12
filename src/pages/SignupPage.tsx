import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, CheckCircle } from 'lucide-react';

const benefits = [
  'Save and manage your letters',
  'Track dispute status',
  'Access premium templates',
  'Priority support',
];

const SignupPage = () => {
  return (
    <Layout>
      <SEOHead 
        title="Sign Up | DisputeLetters"
        description="Create your DisputeLetters account and start resolving disputes"
      />

      <div className="min-h-[80vh] flex items-center justify-center bg-background py-12 px-4">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Benefits */}
          <div className="hidden md:flex flex-col justify-center p-8 bg-primary rounded-2xl text-primary-foreground">
            <h2 className="font-serif text-2xl font-bold mb-6">
              Join thousands of consumers protecting their rights
            </h2>
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-accent" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Form */}
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <FileText className="h-6 w-6" />
                </div>
              </div>
              <CardTitle className="font-serif text-2xl">Create your account</CardTitle>
              <CardDescription>
                Get started with DisputeLetters for free
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" placeholder="Doe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="you@example.com" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                  />
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox id="terms" />
                  <label 
                    htmlFor="terms" 
                    className="text-sm text-muted-foreground leading-tight"
                  >
                    I agree to the{' '}
                    <Link to="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
                <Button type="submit" className="w-full" variant="accent">
                  Create account
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default SignupPage;
