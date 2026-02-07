import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Check, CreditCard, FileText, Edit, Loader2, Gift, Clock } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { trackPricingModalOpen, trackCheckoutInitiated } from '@/hooks/useGTM';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useAuth } from '@/hooks/useAuth';
import { differenceInDays } from 'date-fns';

interface PricingModalProps {
  templateSlug: string;
  templateName: string;
  letterContent: string;
  onClose: () => void;
}

const pricingOptions = [
  {
    id: 'pdf-only',
    name: 'PDF Only',
    price: 9.99,
    icon: FileText,
    features: [
      'Professional letter',
      'PDF download',
      'Ready to send',
    ],
    popular: false,
  },
  {
    id: 'pdf-editable',
    name: 'PDF + Edit Access',
    price: 14.99,
    icon: Edit,
    features: [
      'Everything in PDF',
      '30 days in-app editing',
      'Export to PDF anytime',
    ],
    popular: true,
  },
];

const PricingModal = ({ templateSlug, templateName, letterContent, onClose }: PricingModalProps) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeCredits, oldestActiveCredit, isLoading: creditsLoading } = useUserCredits();

  useEffect(() => {
    trackPricingModalOpen(templateSlug);
  }, [templateSlug]);

  const handleRedeemCredit = async () => {
    if (!oldestActiveCredit) return;

    setIsLoading('credit');
    try {
      const { data, error } = await supabase.functions.invoke('redeem-credit', {
        body: {
          templateSlug,
          templateName,
          letterContent,
        },
      });

      if (error) throw error;

      toast({
        title: 'Credit redeemed!',
        description: 'Your letter has been generated successfully.',
      });

      onClose();
      navigate(`/purchase-success?purchase_id=${data.purchaseId}`);
    } catch (error) {
      console.error('Credit redemption error:', error);
      toast({
        title: 'Failed to redeem credit',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handlePurchase = async (optionId: string) => {
    const selectedOption = pricingOptions.find(o => o.id === optionId);
    trackCheckoutInitiated(templateSlug, optionId, selectedOption?.price || 0);
    setIsLoading(optionId);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-letter-checkout', {
        body: {
          purchaseType: optionId,
          templateSlug,
          templateName,
          letterContent,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        onClose();
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Error',
        description: 'Failed to start checkout. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto bg-card rounded-xl shadow-floating">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border bg-card">
          <div>
            <h3 className="font-serif text-lg font-semibold">Get Your Letter</h3>
            <p className="text-sm text-muted-foreground">Choose your download format</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Pricing Cards */}
        <div className="p-6">
          {/* Credit Option - shown prominently if user has credits */}
          {user && !creditsLoading && activeCredits.length > 0 && oldestActiveCredit && (
            <Card className="mb-4 border-2 border-success bg-gradient-to-r from-success/5 to-transparent">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-success text-white text-xs font-semibold rounded-full">
                Free Credit Available!
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-success/10 rounded-full">
                      <Gift className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Use Your Credit</h4>
                      <p className="text-sm text-muted-foreground">
                        You have {activeCredits.length} credit{activeCredits.length !== 1 ? 's' : ''} available
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-success">
                    <Clock className="h-3 w-3 mr-1" />
                    {differenceInDays(new Date(oldestActiveCredit.expires_at), new Date())} days left
                  </Badge>
                </div>

                <ul className="space-y-2 mb-5">
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Professional letter (PDF + DOCX)</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">30 days in-app editing</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">No payment required</span>
                  </li>
                </ul>

                <Button
                  variant="default"
                  className="w-full bg-success hover:bg-success/90"
                  onClick={handleRedeemCredit}
                  disabled={isLoading !== null || !agreedToTerms}
                >
                  {isLoading === 'credit' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Gift className="h-4 w-4 mr-2" />
                  )}
                  {isLoading === 'credit' ? 'Processing...' : 'Use 1 Credit (Free)'}
                </Button>
              </div>
            </Card>
          )}

          {/* Divider when credits are shown */}
          {user && !creditsLoading && activeCredits.length > 0 && (
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground uppercase">Or pay</span>
              <div className="flex-1 h-px bg-border" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pricingOptions.map((option) => {
              const Icon = option.icon;
              const loading = isLoading === option.id;
              return (
                <Card
                  key={option.id}
                  className={`relative p-5 transition-all ${
                    option.popular 
                      ? 'border-2 border-accent shadow-elevated' 
                      : 'border border-border hover:border-muted-foreground/50'
                  }`}
                >
                  {/* Recommended Badge */}
                  {option.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full">
                      Recommended
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-semibold text-foreground mb-1">{option.name}</h4>
                    <div className="font-serif text-3xl font-bold text-foreground">
                      ${option.price.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">per letter</p>
                  </div>

                  <ul className="space-y-2 mb-5">
                    {option.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={option.popular ? 'accent' : 'outline'}
                    className="w-full"
                    onClick={() => handlePurchase(option.id)}
                    disabled={isLoading !== null || !agreedToTerms}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    {loading ? 'Processing...' : option.popular ? 'Get PDF + Edit Access' : 'Get PDF'}
                  </Button>
                </Card>
              );
            })}
          </div>

          {/* Terms Agreement Checkbox */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox 
                checked={agreedToTerms} 
                onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                className="mt-0.5"
              />
              <span className="text-sm text-muted-foreground leading-relaxed">
                I agree to the{' '}
                <Link to="/terms" target="_blank" className="text-primary hover:underline font-medium">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" target="_blank" className="text-primary hover:underline font-medium">
                  Privacy Policy
                </Link>
                . I understand that templates are provided "as is" for informational purposes only and should be used at my own discretion and risk.
              </span>
            </label>
          </div>

          {/* Re-edit info */}
          <div className="mt-4 p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Need to edit after 30 days?</span>
              {' '}Unlock editing access again for just $5.99
            </p>
          </div>

          {/* Security Note */}
          <div className="mt-4 text-center text-xs text-muted-foreground">
            <p>🔒 Secure payment powered by Stripe</p>
            <p className="mt-1">Your payment information is never stored on our servers</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
