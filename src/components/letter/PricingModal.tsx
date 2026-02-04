import { useState, useEffect } from 'react';
import { X, Check, CreditCard, FileText, FileEdit, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
    price: 5.99,
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
    price: 9.99,
    icon: FileEdit,
    features: [
      'Everything in PDF',
      'Editable Word document',
      'Make changes anytime',
    ],
    popular: true,
  },
];

const PricingModal = ({ templateSlug, templateName, letterContent, onClose }: PricingModalProps) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { toast } = useToast();

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
        // Open Stripe checkout in new tab
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
