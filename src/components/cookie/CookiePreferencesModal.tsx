import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { Shield, BarChart3, Type } from 'lucide-react';

const categories = [
  {
    id: 'essential' as const,
    label: 'Essential',
    description: 'Authentication, security, and core functionality. Always active.',
    icon: Shield,
    locked: true,
  },
  {
    id: 'analytics' as const,
    label: 'Analytics',
    description: 'Google Tag Manager, GA4, reCAPTCHA, and site analytics.',
    icon: BarChart3,
    locked: false,
  },
  {
    id: 'functional' as const,
    label: 'Functional',
    description: 'Google Fonts loaded from CDN for improved typography.',
    icon: Type,
    locked: false,
  },
];

const CookiePreferencesModal = () => {
  const { consent, showSettings, closeSettings, updateConsent } = useCookieConsent();

  const [analytics, setAnalytics] = useState(consent?.analytics ?? false);
  const [functional, setFunctional] = useState(consent?.functional ?? true);

  // Sync local state when consent changes or modal opens
  useEffect(() => {
    if (showSettings) {
      setAnalytics(consent?.analytics ?? false);
      setFunctional(consent?.functional ?? true);
    }
  }, [showSettings, consent]);

  const handleSave = () => {
    updateConsent({ analytics, functional });
    closeSettings();
  };

  return (
    <Dialog open={showSettings} onOpenChange={(open) => !open && closeSettings()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cookie Preferences</DialogTitle>
          <DialogDescription>
            Choose which cookies you'd like to allow. Essential cookies cannot be disabled.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const checked = cat.id === 'essential' ? true : cat.id === 'analytics' ? analytics : functional;
            const onToggle = cat.id === 'analytics' ? setAnalytics : cat.id === 'functional' ? setFunctional : undefined;

            return (
              <div key={cat.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                <Icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{cat.label}</p>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </div>
                <Switch
                  checked={checked}
                  onCheckedChange={onToggle as any}
                  disabled={cat.locked}
                  aria-label={`Toggle ${cat.label} cookies`}
                />
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button onClick={handleSave} className="w-full sm:w-auto">
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CookiePreferencesModal;
