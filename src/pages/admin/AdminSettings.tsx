import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Save, Loader2, Database, Download, Users, ShoppingCart, BarChart3, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ExportButton from '@/components/admin/export/ExportButton';
import ImageOptimizer from '@/components/admin/storage/ImageOptimizer';

interface Settings {
  site_name: string;
  site_url: string;
  site_description: string;
  from_email: string;
  support_email: string;
  welcome_email_enabled: boolean;
  letter_delivery_email_enabled: boolean;
  pdf_only_price: string;
  pdf_editable_price: string;
}

const defaultSettings: Settings = {
  site_name: 'Letter of Dispute',
  site_url: 'https://letterofdispute.com',
  site_description: 'Professional AI-powered dispute letters, without the guesswork.',
  from_email: 'noreply@letterofdispute.com',
  support_email: 'support@letterofdispute.com',
  welcome_email_enabled: true,
  letter_delivery_email_enabled: true,
  pdf_only_price: '5.99',
  pdf_editable_price: '9.99',
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
          pdf_only_price: settingsMap.pdf_only_price || defaultSettings.pdf_only_price,
          pdf_editable_price: settingsMap.pdf_editable_price || defaultSettings.pdf_editable_price,
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
        { key: 'pdf_only_price', value: settings.pdf_only_price },
        { key: 'pdf_editable_price', value: settings.pdf_editable_price },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('site_settings')
          .upsert({ key: update.key, value: update.value }, { onConflict: 'key' });

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
    <div className="p-4 sm:p-6 lg:p-8 overflow-x-hidden max-w-full">
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
            <CardDescription>Configure per-letter pricing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pdfOnlyPrice">PDF Only Price ($)</Label>
                <Input 
                  id="pdfOnlyPrice" 
                  value={settings.pdf_only_price}
                  onChange={(e) => updateSetting('pdf_only_price', e.target.value)}
                  placeholder="5.99"
                />
                <p className="text-xs text-muted-foreground">Letter as PDF download</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdfEditablePrice">PDF + Editable Price ($)</Label>
                <Input 
                  id="pdfEditablePrice" 
                  value={settings.pdf_editable_price}
                  onChange={(e) => updateSetting('pdf_editable_price', e.target.value)}
                  placeholder="9.99"
                />
                <p className="text-xs text-muted-foreground">PDF + Word document</p>
              </div>
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

        {/* Image Storage Optimizer */}
        <ImageOptimizer />

        {/* Data Export Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Export & Backup
            </CardTitle>
            <CardDescription>
              Download your platform data as CSV files for backup or analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Export Dropdown */}
            <div className="flex flex-col gap-3">
              <Label>Quick Export</Label>
              <ExportButton 
                showAll 
                label="Export All Data" 
                variant="default"
                showDatePicker
              />
              <p className="text-xs text-muted-foreground">
                Select a data type to download as CSV. Orders and analytics support date filtering.
              </p>
            </div>

            {/* Individual Export Options */}
            <div className="border-t border-border pt-4 mt-4">
              <Label className="mb-3 block">Individual Exports</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Users</p>
                      <p className="text-xs text-muted-foreground">All profiles</p>
                    </div>
                  </div>
                  <ExportButton exportType="users" size="sm" variant="ghost" label="" />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Orders</p>
                      <p className="text-xs text-muted-foreground">All purchases</p>
                    </div>
                  </div>
                  <ExportButton exportType="orders" size="sm" variant="ghost" label="" showDatePicker />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Analytics</p>
                      <p className="text-xs text-muted-foreground">Event data</p>
                    </div>
                  </div>
                  <ExportButton exportType="analytics" size="sm" variant="ghost" label="" showDatePicker />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Blog Posts</p>
                      <p className="text-xs text-muted-foreground">All articles</p>
                    </div>
                  </div>
                  <ExportButton exportType="blog_posts" size="sm" variant="ghost" label="" />
                </div>
              </div>
            </div>

            {/* Backup Info */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-3">
                <Download className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Regular Backups Recommended</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    We recommend exporting your data regularly for safekeeping. All exports are in CSV format 
                    and can be opened in Excel, Google Sheets, or any spreadsheet application.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;
