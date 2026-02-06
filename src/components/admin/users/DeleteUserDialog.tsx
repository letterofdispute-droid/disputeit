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
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface DeleteUserDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const DeleteUserDialog = ({ 
  user, 
  open, 
  onOpenChange,
  onSuccess
}: DeleteUserDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [anonymizeData, setAnonymizeData] = useState(true);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!user || !confirmChecked) return;

    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { 
          userId: user.user_id,
          anonymize: anonymizeData
        }
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'User deleted',
        description: anonymizeData 
          ? 'User data has been anonymized successfully.'
          : 'User has been permanently deleted.',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error deleting user',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setConfirmChecked(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setConfirmChecked(false);
    }
    onOpenChange(open);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete User Account
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              You are about to delete the account for <strong>{user?.email}</strong>.
            </p>
            
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-destructive">
                This action will:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Remove the user's authentication credentials</li>
                <li>Delete their profile from the system</li>
                <li>{anonymizeData ? 'Anonymize' : 'Delete'} their letters and saved data</li>
                <li>Revoke any admin or special roles</li>
              </ul>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <Checkbox 
                  id="anonymize"
                  checked={anonymizeData}
                  onCheckedChange={(checked) => setAnonymizeData(checked === true)}
                />
                <div className="grid gap-1">
                  <Label htmlFor="anonymize" className="text-sm font-medium">
                    Anonymize order history
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Keep purchase records for analytics but remove identifying information
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox 
                  id="confirm"
                  checked={confirmChecked}
                  onCheckedChange={(checked) => setConfirmChecked(checked === true)}
                />
                <div className="grid gap-1">
                  <Label htmlFor="confirm" className="text-sm font-medium text-destructive">
                    I understand this action cannot be undone
                  </Label>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="w-full sm:w-auto" disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!confirmChecked || isDeleting}
            className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete User'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteUserDialog;
