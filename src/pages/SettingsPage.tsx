import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, User, Lock, Settings, Trash2, Loader2, Save } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import LinkedAccountsCard from '@/components/settings/LinkedAccountsCard';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  created_at: string;
  plan: string;
}

const SettingsPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Profile state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Preferences state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('first_name, last_name, email, created_at, plan')
      .eq('user_id', user!.id)
      .single();

    if (!error && data) {
      setProfile(data);
      setFirstName(data.first_name || '');
      setLastName(data.last_name || '');
    }
    setIsLoadingProfile(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
      })
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully.',
      });
      setProfile(prev => prev ? {
        ...prev,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
      } : null);
    }
    setIsSavingProfile(false);
  };

  const handleChangePassword = async () => {
    setPasswordError('');

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Password Changed',
        description: 'Your password has been updated successfully.',
      });
      setNewPassword('');
      setConfirmPassword('');
    }
    setIsChangingPassword(false);
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    // Note: Full account deletion requires server-side implementation
    // For now, we'll sign out the user and show a message
    toast({
      title: 'Account Deletion Request',
      description: 'Please contact support to complete account deletion.',
    });
    setIsDeletingAccount(false);
  };

  if (authLoading || isLoadingProfile) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title="Account Settings | Letter of Dispute"
        description="Manage your Letter of Dispute account settings, profile, and preferences"
        canonicalPath="/settings"
        noIndex={true}
      />

      <div className="bg-background min-h-screen">
        {/* Header */}
        <section className="bg-card border-b border-border py-8">
          <div className="container-wide">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
              Account Settings
            </h1>
            <p className="text-muted-foreground">
              Manage your profile, security, and preferences
            </p>
          </div>
        </section>

        {/* Settings Content */}
        <section className="py-8">
          <div className="container-wide">
            <div className="max-w-3xl">
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="mb-6 w-full justify-start">
                  <TabsTrigger value="profile" className="gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="security" className="gap-2">
                    <Lock className="h-4 w-4" />
                    Security
                  </TabsTrigger>
                  <TabsTrigger value="preferences" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Preferences
                  </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile">
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-serif text-xl">Profile Information</CardTitle>
                      <CardDescription>
                        Update your personal information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Enter your first name"
                            maxLength={50}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Enter your last name"
                            maxLength={50}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          value={user?.email || ''}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-sm text-muted-foreground">
                          Email address cannot be changed
                        </p>
                      </div>

                      <Separator />

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">Member Since</p>
                          <p className="text-sm text-muted-foreground">
                            {profile?.created_at
                              ? new Date(profile.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Current Plan</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {profile?.plan || 'Free'}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex justify-end">
                        <Button
                          onClick={handleSaveProfile}
                          disabled={isSavingProfile}
                          variant="accent"
                        >
                          {isSavingProfile ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Save Changes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security">
                  <div className="space-y-6">
                  <LinkedAccountsCard />
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-serif text-xl">Change Password</CardTitle>
                      <CardDescription>
                        Update your password to keep your account secure
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value);
                            setPasswordError('');
                          }}
                          placeholder="Enter new password"
                        />
                        <p className="text-sm text-muted-foreground">
                          Must be at least 6 characters
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setPasswordError('');
                          }}
                          placeholder="Confirm new password"
                        />
                      </div>

                      {passwordError && (
                        <p className="text-sm text-destructive">{passwordError}</p>
                      )}

                      <div className="flex justify-end">
                        <Button
                          onClick={handleChangePassword}
                          disabled={isChangingPassword || !newPassword || !confirmPassword}
                          variant="accent"
                        >
                          {isChangingPassword ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Lock className="h-4 w-4 mr-2" />
                          )}
                          Update Password
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  </div>
                </TabsContent>

                {/* Preferences Tab */}
                <TabsContent value="preferences">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-serif text-xl">Notifications</CardTitle>
                        <CardDescription>
                          Manage how you receive updates and communications
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="emailNotifications">Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive updates about your letters and account
                            </p>
                          </div>
                          <Switch
                            id="emailNotifications"
                            checked={emailNotifications}
                            onCheckedChange={setEmailNotifications}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-destructive/50">
                      <CardHeader>
                        <CardTitle className="font-serif text-xl text-destructive">
                          Danger Zone
                        </CardTitle>
                        <CardDescription>
                          Irreversible actions that affect your account
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="space-y-0.5">
                            <p className="font-medium text-foreground">Delete Account</p>
                            <p className="text-sm text-muted-foreground">
                              Permanently delete your account and all associated data
                            </p>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" className="gap-2">
                                <Trash2 className="h-4 w-4" />
                                Delete Account
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete your
                                  account and remove all your data from our servers, including
                                  all letters and purchase history.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDeleteAccount}
                                  disabled={isDeletingAccount}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {isDeletingAccount ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : null}
                                  Yes, delete my account
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default SettingsPage;
