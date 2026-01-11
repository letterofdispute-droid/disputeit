import { X, Check, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LetterTemplate } from '@/data/letterTemplates';

interface PricingModalProps {
  template: LetterTemplate;
  onClose: () => void;
}

const PricingModal = ({ template, onClose }: PricingModalProps) => {
  const handlePurchase = (tierId: string) => {
    // In a real implementation, this would integrate with Stripe
    console.log('Purchase:', tierId);
    alert(`Payment integration coming soon! Selected tier: ${tierId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-auto bg-card rounded-xl shadow-floating">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border bg-card">
          <div>
            <h3 className="font-serif text-lg font-semibold">Choose Your Plan</h3>
            <p className="text-sm text-muted-foreground">Select the option that best fits your needs</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Pricing Cards */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {template.pricing.map((tier) => (
              <Card
                key={tier.id}
                className={`relative p-5 ${
                  tier.popular 
                    ? 'border-2 border-accent shadow-elevated' 
                    : 'border border-border'
                }`}
              >
                {/* Popular Badge */}
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full">
                    Recommended
                  </div>
                )}

                <div className="text-center mb-4">
                  <h4 className="font-semibold text-foreground mb-1">{tier.name}</h4>
                  <div className="font-serif text-3xl font-bold text-foreground">
                    €{tier.price.toFixed(2)}
                  </div>
                </div>

                <ul className="space-y-2 mb-5">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={tier.popular ? 'accent' : 'outline'}
                  className="w-full"
                  onClick={() => handlePurchase(tier.id)}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Select
                </Button>
              </Card>
            ))}
          </div>

          {/* Bundle Offer */}
          <div className="mt-6 p-4 bg-primary text-primary-foreground rounded-lg text-center">
            <p className="font-medium mb-1">Need multiple letters?</p>
            <p className="text-sm text-primary-foreground/80 mb-3">
              Get 3 letters for €39.99 — Save over 30%
            </p>
            <Button variant="hero" size="sm" onClick={() => handlePurchase('bundle')}>
              Get the Bundle
            </Button>
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
