import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Unlink, Mail, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
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

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const LinkedAccountsCard = () => {
  const { user, unlinkIdentity } = useAuth();
  const { toast } = useToast();
  const [isUnlinking, setIsUnlinking] = useState<string | null>(null);

  const identities = user?.identities || [];
  const hasEmail = identities.some(i => i.provider === 'email');
  const hasGoogle = identities.some(i => i.provider === 'google');
  const canUnlink = identities.length > 1;

  const handleUnlink = async (identityId: string, provider: string) => {
    if (!canUnlink) {
      toast({
        title: 'Cannot unlink',
        description: 'You must have at least one sign-in method connected.',
        variant: 'destructive',
      });
      return;
    }

    setIsUnlinking(identityId);
    const { error } = await unlinkIdentity(identityId);
    if (error) {
      toast({
        title: 'Failed to unlink',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Account unlinked',
        description: `${provider === 'google' ? 'Google' : 'Email'} sign-in has been removed.`,
      });
    }
    setIsUnlinking(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-xl flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Linked Accounts
        </CardTitle>
        <CardDescription>
          Manage your sign-in methods. Link multiple providers to access your account in different ways.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email Identity */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Email & Password</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasEmail ? (
              <>
                <Badge variant="secondary" className="text-xs">Connected</Badge>
                {canUnlink && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={isUnlinking !== null}>
                        <Unlink className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Unlink email sign-in?</AlertDialogTitle>
                        <AlertDialogDescription>
                          You'll no longer be able to sign in with email and password. Make sure you have another sign-in method connected.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            const emailIdentity = identities.find(i => i.provider === 'email');
                            if (emailIdentity) handleUnlink(emailIdentity.id, 'email');
                          }}
                        >
                          Unlink
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </>
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground">Not connected</Badge>
            )}
          </div>
        </div>

        {/* Google Identity */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
              <GoogleIcon />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Google</p>
              <p className="text-xs text-muted-foreground">
                {hasGoogle
                  ? identities.find(i => i.provider === 'google')?.identity_data?.email || 'Connected'
                  : 'Not connected'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasGoogle ? (
              <>
                <Badge variant="secondary" className="text-xs">Connected</Badge>
                {canUnlink && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={isUnlinking !== null}>
                        {isUnlinking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unlink className="h-3.5 w-3.5" />}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Unlink Google?</AlertDialogTitle>
                        <AlertDialogDescription>
                          You'll no longer be able to sign in with Google. Make sure you have a password set for email sign-in.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            const googleIdentity = identities.find(i => i.provider === 'google');
                            if (googleIdentity) handleUnlink(googleIdentity.id, 'google');
                          }}
                        >
                          Unlink
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <Badge variant="outline" className="text-xs text-muted-foreground">Not connected</Badge>
                <p className="text-xs text-muted-foreground max-w-[200px] text-right">
                  Sign in with Google using your account email to link automatically
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground pt-2">
          To link your Google account, sign out and sign back in using "Continue with Google" with the same email address. Your accounts will merge automatically.
        </p>
      </CardContent>
    </Card>
  );
};

export default LinkedAccountsCard;
