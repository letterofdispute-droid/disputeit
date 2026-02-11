import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Check, CreditCard, FileText, Edit, Loader2, Gift } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { trackPricingModalOpen, trackCheckoutInitiated } from '@/hooks/useGTM';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useAuth } from '@/hooks/useAuth';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { differenceInDays } from 'date-fns';

interface EvidencePhotoPath {
  storagePath: string;
  description?: string;
}

interface PricingModalProps {
  templateSlug: string;
  templateName: string;
  letterContent: string;
  evidencePhotoPaths?: EvidencePhotoPath[];
  onClose: () => void;
}

const PricingModal = ({ templateSlug, templateName, letterContent, evidencePhotoPaths, onClose }: PricingModalProps) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeCredits, oldestActiveCredit, isLoading: creditsLoading } = useUserCredits();
  const { pdfOnlyPrice, pdfEditablePrice, editUnlockPrice, formatPrice } = useSiteSettings();

  const pricingOptions = [
    {
      id: 'pdf-only',
      name: 'PDF Only',
      price: pdfOnlyPrice,
      icon: FileText,
      features: [
        'Professional letter with legal-safe phrasing',
        'PDF download, ready to send',
        'Up to 10 evidence photos embedded in PDF',
        'Cites relevant US federal law',
      ],
      popular: false,
    },
    {
      id: 'pdf-editable',
      name: 'PDF + Edit Access',
      price: pdfEditablePrice,
      icon: Edit,
      features: [
        'Everything in PDF Only',
        '30 days of in-app editing',
        'Export updated PDF anytime',
        'AI-powered form assistance',
      ],
      popular: true,
    },
  ];

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
          evidencePhotoPaths: evidencePhotoPaths || [],
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
          evidencePhotoPaths: evidencePhotoPaths || [],
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

        {/* Content */}
        <div className="p-6">
          {/* Terms Agreement */}
          <div className="mb-5 p-4 bg-accent/5 rounded-lg border-2 border-accent/30">
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
                . I understand that templates are provided "as is" for informational purposes only.
              </span>
            </label>
          </div>

          {/* Credit Option */}
          {user && !creditsLoading && activeCredits.length > 0 && oldestActiveCredit && (
            <Card className="relative mb-4 border-2 border-success bg-gradient-to-r from-success/5 to-transparent overflow-visible">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-success text-white text-xs font-semibold rounded-full whitespace-nowrap">
                Free Credit Available!
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-success/10 rounded-full">
                      <Gift className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">Use Your Credit</h4>
                      <p className="text-xs text-muted-foreground">
                        {activeCredits.length} credit{activeCredits.length !== 1 ? 's' : ''} • Expires in {differenceInDays(new Date(oldestActiveCredit.expires_at), new Date())} days
                      </p>
                    </div>
                  </div>
                </div>

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

          {/* Divider */}
          {user && !creditsLoading && activeCredits.length > 0 && (
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground uppercase">Or pay</span>
              <div className="flex-1 h-px bg-border" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pricingOptions.map((option) => {
              const Icon = option.icon;
              const loading = isLoading === option.id;
              return (
                <Card
                  key={option.id}
                  className={`relative p-4 transition-all overflow-visible ${
                    option.popular 
                      ? 'border-2 border-accent shadow-elevated' 
                      : 'border border-border hover:border-muted-foreground/50'
                  }`}
                >
                  {option.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full whitespace-nowrap">
                      Recommended
                    </div>
                  )}

                  <div className="text-center mb-3">
                    <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-semibold text-foreground text-sm mb-1">{option.name}</h4>
                    <div className="font-serif text-2xl font-bold text-foreground">
                      {formatPrice(option.price)}
                    </div>
                  </div>

                  <ul className="space-y-1 mb-4">
                    {option.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-xs">
                        <Check className="h-3 w-3 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={option.popular ? 'accent' : 'outline'}
                    className="w-full"
                    size="sm"
                    onClick={() => handlePurchase(option.id)}
                    disabled={isLoading !== null || !agreedToTerms}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    {loading ? 'Processing...' : option.popular ? 'Get PDF + Edit' : 'Get PDF'}
                  </Button>
                </Card>
              );
            })}
          </div>

          {/* Re-edit info */}
          <div className="mt-4 p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Need to edit after 30 days?</span>
              {' '}Unlock editing access again for just {formatPrice(editUnlockPrice)}
            </p>
          </div>

          {/* Trust Badges */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="text-primary">🔒</span>
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-primary">⚡</span>
                <span>Instant Download</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-primary">⚖️</span>
                <span>Cites US Federal Law</span>
              </div>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Powered by Stripe • Your payment info is never stored on our servers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
