import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import ldLogoIcon from '@/assets/ld-logo-icon.svg';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRecaptcha } from '@/hooks/useRecaptcha';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { toast } = useToast();
  const { verifyRecaptcha } = useRecaptcha();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cooldown > 0) return;
    
    setIsLoading(true);

    // Verify reCAPTCHA first
    const recaptchaResult = await verifyRecaptcha('forgot_password');
    if (!recaptchaResult.success) {
      toast({
        title: 'Verification failed',
        description: recaptchaResult.error || 'Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setIsSuccess(true);
      setCooldown(60);
      
      // Start cooldown timer
      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    setIsLoading(false);
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setIsLoading(true);

    // Verify reCAPTCHA first
    const recaptchaResult = await verifyRecaptcha('forgot_password_resend');
    if (!recaptchaResult.success) {
      toast({
        title: 'Verification failed',
        description: recaptchaResult.error || 'Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Email sent',
        description: 'A new reset link has been sent to your email.',
      });
      setCooldown(60);
      
      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    setIsLoading(false);
  };

  return (
    <Layout>
      <SEOHead 
        title="Forgot Password | Letter of Dispute"
        description="Reset your Letter of Dispute account password"
        canonicalPath="/forgot-password"
        noIndex={true}
      />

      <div className="min-h-[80vh] flex items-center justify-center bg-background py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src={ldLogoIcon} alt="DisputeLetters" className="h-12 w-12" />
            </div>
            <CardTitle className="font-serif text-2xl">
              {isSuccess ? 'Check your email' : 'Forgot password?'}
            </CardTitle>
            <CardDescription>
              {isSuccess 
                ? 'We sent you a password reset link' 
                : 'No worries, we will send you reset instructions'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-success" />
                  </div>
                </div>
                
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    We sent a password reset link to
                  </p>
                  <p className="font-medium text-foreground">{email}</p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                  <div className="flex gap-3">
                    <Mail className="h-5 w-5 flex-shrink-0 text-primary" />
                    <div>
                      <p className="font-medium text-foreground mb-1">
                        Did not receive the email?
                      </p>
                      <p>Check your spam folder, or</p>
                    </div>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleResend}
                  disabled={isLoading || cooldown > 0}
                >
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
                </Button>

                <div className="text-center">
                  <Link 
                    to="/login" 
                    className="inline-flex items-center text-sm text-primary hover:underline"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to login
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  variant="accent" 
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Send reset link
                </Button>

                <div className="text-center">
                  <Link 
                    to="/login" 
                    className="inline-flex items-center text-sm text-primary hover:underline"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ForgotPasswordPage;
