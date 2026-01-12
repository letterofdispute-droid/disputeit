import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Save } from 'lucide-react';

const AdminSettings = () => {
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
              <Input id="siteName" defaultValue="DisputeLetters" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteUrl">Site URL</Label>
              <Input id="siteUrl" defaultValue="https://disputeletters.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteDescription">Site Description</Label>
              <Textarea 
                id="siteDescription" 
                defaultValue="Professional dispute letters, without the guesswork."
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
              <Input id="fromEmail" type="email" defaultValue="noreply@disputeletters.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input id="supportEmail" type="email" defaultValue="support@disputeletters.com" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Welcome Email</Label>
                <p className="text-sm text-muted-foreground">
                  Send welcome email to new users
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Letter Delivery Email</Label>
                <p className="text-sm text-muted-foreground">
                  Email letters to users after generation
                </p>
              </div>
              <Switch defaultChecked />
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
                <Label htmlFor="singlePrice">Single Letter Price</Label>
                <Input id="singlePrice" defaultValue="$4.99" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="packPrice">Letter Pack Price (5)</Label>
                <Input id="packPrice" defaultValue="$12.99" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unlimitedPrice">Unlimited Monthly Price</Label>
              <Input id="unlimitedPrice" defaultValue="$29.99" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Free Trial</Label>
                <p className="text-sm text-muted-foreground">
                  Enable 7-day free trial for new subscribers
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button variant="accent" className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
