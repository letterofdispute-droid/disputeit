import { useState } from 'react';
import { X, Lock, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSiteSettings } from '@/hooks/useSiteSettings';

interface UnlockEditingModalProps {
  purchaseId: string;
  templateName: string;
  onClose: () => void;
  onUnlocked: () => void;
}

const UnlockEditingModal = ({ purchaseId, templateName, onClose, onUnlocked }: UnlockEditingModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { editUnlockPrice, formatPrice } = useSiteSettings();

  const handleUnlock = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-edit-unlock-checkout', {
        body: { purchaseId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        onClose();
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Unlock checkout error:', error);
      toast({
        title: 'Error',
        description: 'Failed to start checkout. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm animate-fade-in">
      <Card className="relative w-full max-w-md p-6">
        <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-4 right-4">
          <X className="h-5 w-5" />
        </Button>

        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-serif text-xl font-bold text-foreground mb-2">
            Editing Access Expired
          </h3>
          <p className="text-muted-foreground">
            Your 30-day editing period for this letter has ended.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-foreground text-sm mb-1">{templateName}</h4>
          <p className="text-xs text-muted-foreground">Unlock 30 more days of editing access</p>
        </div>

        <div className="text-center mb-6">
          <div className="font-serif text-3xl font-bold text-foreground mb-1">
            {formatPrice(editUnlockPrice)}
          </div>
          <p className="text-sm text-muted-foreground">One-time payment</p>
        </div>

        <div className="space-y-3">
          <Button className="w-full" variant="accent" onClick={handleUnlock} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4 mr-2" />
            )}
            {isLoading ? 'Processing...' : 'Unlock Editing Access'}
          </Button>
          <Button className="w-full" variant="ghost" onClick={onClose}>Maybe later</Button>
        </div>

        <p className="mt-4 text-xs text-center text-muted-foreground">
          🔒 Secure payment powered by Stripe
        </p>
      </Card>
    </div>
  );
};

export default UnlockEditingModal;
