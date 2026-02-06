import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Mail, Calendar, FileText, CreditCard, 
  Shield, User, Loader2, ExternalLink 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  status: string;
  plan: string;
  letters_count: number;
  created_at: string;
  is_admin: boolean;
  role: string | null;
}

interface Purchase {
  id: string;
  template_name: string;
  purchase_type: string;
  amount_cents: number;
  status: string;
  created_at: string;
}

interface UserDetailModalProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmailUser: () => void;
  onDeleteUser: () => void;
}

const UserDetailModal = ({ 
  user, 
  open, 
  onOpenChange,
  onEmailUser,
  onDeleteUser
}: UserDetailModalProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && open) {
      fetchUserPurchases();
    }
  }, [user, open]);

  const fetchUserPurchases = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data } = await supabase
      .from('letter_purchases')
      .select('id, template_name, purchase_type, amount_cents, status, created_at')
      .or(`user_id.eq.${user.user_id},email.eq.${user.email}`)
      .order('created_at', { ascending: false })
      .limit(10);
    
    setPurchases(data || []);
    setIsLoading(false);
  };

  const getInitials = (firstName?: string | null, lastName?: string | null, email?: string | null) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.email || 'Anonymous User';
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const totalSpent = purchases
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount_cents, 0);

  const content = user ? (
    <div className="space-y-6">
      {/* User Header */}
      <div className="flex flex-col items-center text-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarFallback className="bg-primary/10 text-primary text-2xl">
            {getInitials(user.first_name, user.last_name, user.email)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-xl font-semibold text-foreground">{getDisplayName()}</h3>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {user.is_admin && (
            <Badge className="bg-primary">
              <Shield className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          )}
          <Badge 
            variant={user.status === 'active' ? 'default' : 'secondary'}
            className={user.status === 'active' ? 'bg-green-600' : ''}
          >
            {user.status}
          </Badge>
          <Badge variant="outline">{user.plan}</Badge>
        </div>
      </div>

      <Separator />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-foreground">{user.letters_count}</div>
          <p className="text-sm text-muted-foreground">Letters Created</p>
        </div>
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-foreground">{formatCurrency(totalSpent)}</div>
          <p className="text-sm text-muted-foreground">Total Spent</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Joined:</span>
          <span className="text-foreground">{format(new Date(user.created_at), 'PPP')}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">User ID:</span>
          <code className="text-xs bg-muted px-2 py-1 rounded">{user.user_id}</code>
        </div>
      </div>

      <Separator />

      {/* Purchase History */}
      <div>
        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Purchase History
        </h4>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : purchases.length > 0 ? (
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {purchases.map((purchase) => (
                <div 
                  key={purchase.id} 
                  className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => {
                    onOpenChange(false);
                    navigate(`/admin/orders?search=${encodeURIComponent(user.email || '')}`);
                  }}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-foreground truncate">
                        {purchase.template_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(purchase.created_at), 'PP')}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-medium text-sm text-foreground">
                        {formatCurrency(purchase.amount_cents)}
                      </p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          purchase.status === 'completed' ? 'border-green-500 text-green-600' :
                          purchase.status === 'refunded' ? 'border-orange-500 text-orange-600' :
                          ''
                        }`}
                      >
                        {purchase.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No purchases yet
          </p>
        )}
        {purchases.length > 0 && (
          <Button 
            variant="link" 
            className="w-full mt-2"
            onClick={() => {
              onOpenChange(false);
              navigate(`/admin/orders?search=${encodeURIComponent(user.email || '')}`);
            }}
          >
            View all orders
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={onEmailUser}
        >
          <Mail className="h-4 w-4 mr-2" />
          Send Email
        </Button>
        <Button 
          variant="destructive" 
          className="w-full"
          onClick={onDeleteUser}
        >
          Delete User
        </Button>
      </div>
    </div>
  ) : null;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>User Details</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="px-4 pb-6 max-h-[calc(90vh-80px)]">
            {content}
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailModal;
