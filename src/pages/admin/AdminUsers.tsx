import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, MoreHorizontal, Mail, Ban, 
  UserCheck, Calendar, Loader2, Shield, ShieldOff, Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import UserDetailModal from '@/components/admin/users/UserDetailModal';
import DeleteUserDialog from '@/components/admin/users/DeleteUserDialog';
import EmailUserDialog from '@/components/admin/users/EmailUserDialog';
import ExportButton from '@/components/admin/export/ExportButton';

export interface UserProfile {
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

const AdminUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [adminAction, setAdminAction] = useState<'grant' | 'revoke'>('grant');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'admins'>('all');
  const [stats, setStats] = useState({
    total: 0,
    pro: 0,
    unlimited: 0,
    admins: 0,
  });
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error fetching users',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setUsers(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const pro = data?.filter(u => u.plan === 'pro').length || 0;
      const unlimited = data?.filter(u => u.plan === 'unlimited').length || 0;
      const admins = data?.filter(u => u.is_admin).length || 0;
      setStats({ total, pro, unlimited, admins });
    }
    setIsLoading(false);
  };

  const updateUserStatus = async (userId: string, status: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', userId);

    if (error) {
      toast({
        title: 'Error updating user',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'User updated',
        description: `User status changed to ${status}`,
      });
      fetchUsers();
    }
    setSuspendDialogOpen(false);
  };

  const handleSuspendAction = (user: UserProfile) => {
    setSelectedUser(user);
    setSuspendDialogOpen(true);
  };

  const handleAdminAction = (user: UserProfile, action: 'grant' | 'revoke') => {
    setSelectedUser(user);
    setAdminAction(action);
    setAdminDialogOpen(true);
  };

  const confirmAdminAction = async () => {
    if (!selectedUser) return;

    const isGranting = adminAction === 'grant';
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_admin: isGranting,
        role: isGranting ? 'admin' : 'user'
      })
      .eq('id', selectedUser.id);

    if (error) {
      toast({
        title: 'Error updating admin status',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: isGranting ? 'Admin granted' : 'Admin revoked',
        description: `${selectedUser.email} ${isGranting ? 'is now an admin' : 'is no longer an admin'}`,
      });
      fetchUsers();
    }
    setAdminDialogOpen(false);
  };

  const filteredUsers = users.filter(user => {
    const name = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    const email = (user.email || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = name.includes(query) || email.includes(query);
    
    if (statusFilter === 'active') {
      return matchesSearch && user.status === 'active';
    }
    if (statusFilter === 'admins') {
      return matchesSearch && user.is_admin;
    }
    return matchesSearch;
  });

  const handleViewDetails = (user: UserProfile) => {
    setSelectedUser(user);
    setDetailModalOpen(true);
  };

  const handleEmailFromDetail = () => {
    setDetailModalOpen(false);
    setEmailDialogOpen(true);
  };

  const handleDeleteFromDetail = () => {
    setDetailModalOpen(false);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = (user: UserProfile) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleEmailUser = (user: UserProfile) => {
    setSelectedUser(user);
    setEmailDialogOpen(true);
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

  const getDisplayName = (user: UserProfile) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.email || 'Anonymous User';
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
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground">Manage user accounts, subscriptions, and admin access</p>
        </div>
        <ExportButton exportType="users" label="Export Users" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">{stats.admins}</div>
            <p className="text-sm text-muted-foreground">Administrators</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">{stats.pro}</div>
            <p className="text-sm text-muted-foreground">Pro Subscribers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">{stats.unlimited}</div>
            <p className="text-sm text-muted-foreground">Unlimited Subscribers</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search users..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button 
                variant={statusFilter === 'all' ? 'outline' : 'ghost'}
                onClick={() => setStatusFilter('all')}
                className="w-full sm:w-auto"
              >
                All
              </Button>
              <Button 
                variant={statusFilter === 'active' ? 'outline' : 'ghost'}
                onClick={() => setStatusFilter('active')}
                className="w-full sm:w-auto"
              >
                Active
              </Button>
              <Button 
                variant={statusFilter === 'admins' ? 'outline' : 'ghost'}
                onClick={() => setStatusFilter('admins')}
                className="w-full sm:w-auto"
              >
                Admins
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {filteredUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Letters</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {getInitials(user.first_name, user.last_name, user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{getDisplayName(user)}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.is_admin ? (
                        <Badge className="bg-primary">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline">User</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.status === 'active' ? 'default' : 'secondary'}
                        className={user.status === 'active' ? 'bg-green-600' : ''}
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.plan}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.letters_count}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                            <UserCheck className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEmailUser(user)}>
                            <Mail className="h-4 w-4 mr-2" />
                            Email User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.is_admin ? (
                            <DropdownMenuItem 
                              onClick={() => handleAdminAction(user, 'revoke')}
                              disabled={user.user_id === currentUser?.id}
                            >
                              <ShieldOff className="h-4 w-4 mr-2" />
                              Revoke Admin
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleAdminAction(user, 'grant')}>
                              <Shield className="h-4 w-4 mr-2" />
                              Make Admin
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleSuspendAction(user)}
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            {user.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteUser(user)}
                            disabled={user.user_id === currentUser?.id}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Confirmation Dialog */}
      <AlertDialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {adminAction === 'grant' ? 'Grant Admin Access' : 'Revoke Admin Access'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {adminAction === 'grant' 
                ? `Are you sure you want to make ${selectedUser?.email} an administrator? They will have full access to the admin dashboard.`
                : `Are you sure you want to revoke admin access from ${selectedUser?.email}? They will no longer be able to access the admin dashboard.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAdminAction}>
              {adminAction === 'grant' ? 'Grant Admin' : 'Revoke Admin'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend/Unsuspend Confirmation Dialog */}
      <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedUser?.status === 'suspended' ? 'Unsuspend User' : 'Suspend User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.status === 'suspended'
                ? `Are you sure you want to unsuspend ${selectedUser?.email}? They will regain access to their account.`
                : `Are you sure you want to suspend ${selectedUser?.email}? They will be unable to access their account.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedUser && updateUserStatus(selectedUser.id, selectedUser.status === 'suspended' ? 'active' : 'suspended')}
              className={selectedUser?.status !== 'suspended' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {selectedUser?.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Detail Modal */}
      <UserDetailModal
        user={selectedUser}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onEmailUser={handleEmailFromDetail}
        onDeleteUser={handleDeleteFromDetail}
      />

      {/* Delete User Dialog */}
      <DeleteUserDialog
        user={selectedUser}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSuccess={fetchUsers}
      />

      {/* Email User Dialog */}
      <EmailUserDialog
        user={selectedUser}
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
      />
    </div>
  );
};

export default AdminUsers;
