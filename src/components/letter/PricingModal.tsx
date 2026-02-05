import { useState, useEffect } from 'react';
import { X, Check, CreditCard, FileText, FileEdit, Loader2, Infinity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { trackPricingModalOpen, trackCheckoutInitiated } from '@/hooks/useGTM';

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
    name: 'PDF + Editable',
    price: 14.99,
    icon: FileEdit,
    features: [
      'Everything in PDF',
      'Editable Word document',
      'Make changes anytime',
    ],
    popular: true,
  },
];

const subscriptionOption = {
  id: 'subscription',
  name: 'Unlimited Monthly',
  price: 24.99,
  icon: Infinity,
  features: [
    'Unlimited letters',
    'All formats included',
    'Cancel anytime',
  ],
  savings: 'Best for multiple disputes',
};

const PricingModal = ({ templateSlug, templateName, letterContent, onClose }: PricingModalProps) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    trackPricingModalOpen(templateSlug);
  }, [templateSlug]);

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

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please log in to subscribe to unlimited letters.',
        variant: 'destructive',
      });
      return;
    }

    trackCheckoutInitiated(templateSlug, 'subscription', subscriptionOption.price);
    setIsLoading('subscription');
    
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        onClose();
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start subscription checkout';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(null);
    }
  };

  const SubscriptionIcon = subscriptionOption.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-auto bg-card rounded-xl shadow-floating">
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
          {/* Per-Letter Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                    disabled={isLoading !== null}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    {loading ? 'Processing...' : option.popular ? 'Get PDF + Editable' : 'Get PDF'}
                  </Button>
                </Card>
              );
            })}
          </div>

          {/* Subscription Option */}
          <Card className="relative p-5 border-2 border-primary/30 bg-primary/5">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <SubscriptionIcon className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-foreground">{subscriptionOption.name}</h4>
                    <Badge variant="secondary" className="text-xs">{subscriptionOption.savings}</Badge>
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="font-serif text-2xl font-bold text-foreground">${subscriptionOption.price.toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                  <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    {subscriptionOption.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Check className="h-3 w-3 text-success" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <Button
                variant="hero"
                className="md:w-auto"
                onClick={handleSubscribe}
                disabled={isLoading !== null}
              >
                {isLoading === 'subscription' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                {isLoading === 'subscription' ? 'Processing...' : 'Go Unlimited'}
              </Button>
            </div>
            {!user && (
              <p className="text-xs text-muted-foreground mt-3 text-center md:text-left">
                Login required for subscription
              </p>
            )}
          </Card>

          {/* Security Note */}
          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>🔒 Secure payment powered by Stripe</p>
            <p className="mt-1">Your payment information is never stored on our servers</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
