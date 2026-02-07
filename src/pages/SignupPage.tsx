import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, Loader2 } from 'lucide-react';
import ldLogoIcon from '@/assets/ld-logo-icon.svg';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useRecaptcha } from '@/hooks/useRecaptcha';
import { lovable } from '@/integrations/lovable';
import { supabase } from '@/integrations/supabase/client';
import { trackSignupStarted, trackSignupComplete, trackGoogleAuthClick } from '@/hooks/useGTM';

const benefits = [
  'Save and manage your letters',
  'Track dispute status',
  'Access premium templates',
  'Priority support',
];

const SignupPage = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { verifyRecaptcha } = useRecaptcha();

  useEffect(() => {
    trackSignupStarted();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      toast({
        title: 'Please accept the terms',
        description: 'You must agree to the Terms of Service and Privacy Policy.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    // Verify reCAPTCHA first
    const recaptchaResult = await verifyRecaptcha('signup');
    if (!recaptchaResult.success) {
      toast({
        title: 'Verification failed',
        description: recaptchaResult.error || 'Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(email, password, firstName, lastName);

    if (error) {
      toast({
        title: 'Error creating account',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      trackSignupComplete('email');
      toast({
        title: 'Account created!',
        description: 'Welcome to DisputeLetters.',
      });
      navigate('/dashboard');
    }

    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    trackGoogleAuthClick('signup');
    
    // Detect if we're on a custom domain
    const isCustomDomain = 
      !window.location.hostname.includes('lovable.app') &&
      !window.location.hostname.includes('lovableproject.com');
    
    if (isCustomDomain) {
      // Bypass auth-bridge by using Supabase directly
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          skipBrowserRedirect: true,
        },
      });
      
      if (error) {
        toast({
          title: 'Error signing in with Google',
          description: error.message,
          variant: 'destructive',
        });
        setIsGoogleLoading(false);
        return;
      }
      
      // Redirect to OAuth URL
      if (data?.url) {
        window.location.href = data.url;
      }
    } else {
      // For Lovable domains, use the managed auth
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });

      if (error) {
        toast({
          title: 'Error signing in with Google',
          description: error.message,
          variant: 'destructive',
        });
        setIsGoogleLoading(false);
      }
    }
    // If successful, the user will be redirected
  };

  return (
    <Layout>
      <SEOHead 
        title="Sign Up | DisputeLetters"
        description="Create your DisputeLetters account and start resolving disputes"
        canonicalPath="/signup"
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
                <img src={ldLogoIcon} alt="DisputeLetters" className="h-12 w-12" />
              </div>
              <CardTitle className="font-serif text-2xl">Create your account</CardTitle>
              <CardDescription>
                Get started with DisputeLetters for free
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Google Sign In Button */}
              <Button 
                type="button" 
                variant="outline" 
                className="w-full mb-6"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                Continue with Google
              </Button>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input 
                      id="firstName" 
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input 
                      id="lastName" 
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="terms" 
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  />
                  <label 
                    htmlFor="terms" 
                    className="text-sm text-muted-foreground leading-tight cursor-pointer"
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
                <Button type="submit" className="w-full" variant="accent" disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
