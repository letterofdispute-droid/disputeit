import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Settings {
  site_name: string;
  site_url: string;
  site_description: string;
  from_email: string;
  support_email: string;
  welcome_email_enabled: boolean;
  letter_delivery_email_enabled: boolean;
  single_letter_price: string;
  letter_pack_price: string;
  unlimited_monthly_price: string;
  free_trial_enabled: boolean;
}

const defaultSettings: Settings = {
  site_name: 'DisputeLetters',
  site_url: 'https://disputeletters.com',
  site_description: 'Professional dispute letters, without the guesswork.',
  from_email: 'noreply@disputeletters.com',
  support_email: 'support@disputeletters.com',
  welcome_email_enabled: true,
  letter_delivery_email_enabled: true,
  single_letter_price: '4.99',
  letter_pack_price: '12.99',
  unlimited_monthly_price: '29.99',
  free_trial_enabled: true,
};

const AdminSettings = () => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');

      if (error) throw error;

      if (data && data.length > 0) {
        const settingsMap: Record<string, string> = {};
        data.forEach((item) => {
          settingsMap[item.key] = item.value || '';
        });

        setSettings({
          site_name: settingsMap.site_name || defaultSettings.site_name,
          site_url: settingsMap.site_url || defaultSettings.site_url,
          site_description: settingsMap.site_description || defaultSettings.site_description,
          from_email: settingsMap.from_email || defaultSettings.from_email,
          support_email: settingsMap.support_email || defaultSettings.support_email,
          welcome_email_enabled: settingsMap.welcome_email_enabled === 'true',
          letter_delivery_email_enabled: settingsMap.letter_delivery_email_enabled === 'true',
          single_letter_price: settingsMap.single_letter_price || defaultSettings.single_letter_price,
          letter_pack_price: settingsMap.letter_pack_price || defaultSettings.letter_pack_price,
          unlimited_monthly_price: settingsMap.unlimited_monthly_price || defaultSettings.unlimited_monthly_price,
          free_trial_enabled: settingsMap.free_trial_enabled === 'true',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error loading settings',
        description: 'Could not load settings from the database.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const updates = [
        { key: 'site_name', value: settings.site_name },
        { key: 'site_url', value: settings.site_url },
        { key: 'site_description', value: settings.site_description },
        { key: 'from_email', value: settings.from_email },
        { key: 'support_email', value: settings.support_email },
        { key: 'welcome_email_enabled', value: String(settings.welcome_email_enabled) },
        { key: 'letter_delivery_email_enabled', value: String(settings.letter_delivery_email_enabled) },
        { key: 'single_letter_price', value: settings.single_letter_price },
        { key: 'letter_pack_price', value: settings.letter_pack_price },
        { key: 'unlimited_monthly_price', value: settings.unlimited_monthly_price },
        { key: 'free_trial_enabled', value: String(settings.free_trial_enabled) },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('site_settings')
          .update({ value: update.value })
          .eq('key', update.key);

        if (error) throw error;
      }

      toast({
        title: 'Settings saved',
        description: 'Your settings have been saved successfully.',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error saving settings',
        description: 'Could not save settings to the database.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your platform settings</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">General Settings</CardTitle>
            <CardDescription>Basic platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input 
                id="siteName" 
                value={settings.site_name}
                onChange={(e) => updateSetting('site_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteUrl">Site URL</Label>
              <Input 
                id="siteUrl" 
                value={settings.site_url}
                onChange={(e) => updateSetting('site_url', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteDescription">Site Description</Label>
              <Textarea 
                id="siteDescription" 
                value={settings.site_description}
                onChange={(e) => updateSetting('site_description', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Email Settings</CardTitle>
            <CardDescription>Configure email notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email</Label>
              <Input 
                id="fromEmail" 
                type="email" 
                value={settings.from_email}
                onChange={(e) => updateSetting('from_email', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input 
                id="supportEmail" 
                type="email" 
                value={settings.support_email}
                onChange={(e) => updateSetting('support_email', e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Welcome Email</Label>
                <p className="text-sm text-muted-foreground">
                  Send welcome email to new users
                </p>
              </div>
              <Switch 
                checked={settings.welcome_email_enabled}
                onCheckedChange={(checked) => updateSetting('welcome_email_enabled', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Letter Delivery Email</Label>
                <p className="text-sm text-muted-foreground">
                  Email letters to users after generation
                </p>
              </div>
              <Switch 
                checked={settings.letter_delivery_email_enabled}
                onCheckedChange={(checked) => updateSetting('letter_delivery_email_enabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Payment Settings</CardTitle>
            <CardDescription>Configure pricing and payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="singlePrice">Single Letter Price ($)</Label>
                <Input 
                  id="singlePrice" 
                  value={settings.single_letter_price}
                  onChange={(e) => updateSetting('single_letter_price', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="packPrice">Letter Pack Price (5) ($)</Label>
                <Input 
                  id="packPrice" 
                  value={settings.letter_pack_price}
                  onChange={(e) => updateSetting('letter_pack_price', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unlimitedPrice">Unlimited Monthly Price ($)</Label>
              <Input 
                id="unlimitedPrice" 
                value={settings.unlimited_monthly_price}
                onChange={(e) => updateSetting('unlimited_monthly_price', e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Free Trial</Label>
                <p className="text-sm text-muted-foreground">
                  Enable 7-day free trial for new subscribers
                </p>
              </div>
              <Switch 
                checked={settings.free_trial_enabled}
                onCheckedChange={(checked) => updateSetting('free_trial_enabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button variant="accent" className="w-full" onClick={saveSettings} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
