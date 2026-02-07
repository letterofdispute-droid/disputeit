import { useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Gift, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useUserCredits, UserCredit } from '@/hooks/useUserCredits';
import GrantCreditDialog from './GrantCreditDialog';

interface UserCreditsSectionProps {
  userId: string;
  userEmail: string;
}

const UserCreditsSection = ({ userId, userEmail }: UserCreditsSectionProps) => {
  const { credits, activeCount, isLoading, refetch } = useUserCredits({ userId });
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);

  const getStatusBadge = (credit: UserCredit) => {
    const now = new Date();
    const expiresAt = new Date(credit.expires_at);

    if (credit.status === 'used') {
      return (
        <Badge variant="secondary" className="text-xs">
          <CheckCircle className="h-3 w-3 mr-1" />
          Used
        </Badge>
      );
    }

    if (expiresAt < now || credit.status === 'expired') {
      return (
        <Badge variant="outline" className="text-xs text-muted-foreground">
          <XCircle className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    }

    return (
      <Badge className="bg-success text-xs">
        <Clock className="h-3 w-3 mr-1" />
        Active
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Separator />
      
      <div>
        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Gift className="h-4 w-4" />
          Goodwill Credits
        </h4>

        {/* Active credits summary */}
        <div className="p-3 bg-muted/50 rounded-lg mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active credits</p>
              <p className="text-2xl font-bold text-foreground">
                {activeCount}
                <span className="text-sm font-normal text-muted-foreground">/2</span>
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setGrantDialogOpen(true)}
              disabled={activeCount >= 2}
            >
              <Gift className="h-4 w-4 mr-2" />
              Grant Credit
            </Button>
          </div>
        </div>

        {/* Credit history */}
        {credits.length > 0 ? (
          <ScrollArea className="h-[150px]">
            <div className="space-y-2">
              {credits.map((credit) => (
                <div
                  key={credit.id}
                  className="p-3 border rounded-lg text-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    {getStatusBadge(credit)}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(credit.granted_at), 'PP')}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>
                      Expires: {format(new Date(credit.expires_at), 'PP')}
                    </p>
                    {credit.used_at && (
                      <p>
                        Used: {format(new Date(credit.used_at), 'PP')}
                      </p>
                    )}
                    {credit.reason && (
                      <p className="italic mt-1">"{credit.reason}"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No credits granted yet
          </p>
        )}
      </div>

      <GrantCreditDialog
        open={grantDialogOpen}
        onOpenChange={setGrantDialogOpen}
        userId={userId}
        userEmail={userEmail}
        currentActiveCredits={activeCount}
        onSuccess={refetch}
      />
    </div>
  );
};

export default UserCreditsSection;
