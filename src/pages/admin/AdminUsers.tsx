import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, MoreHorizontal, Mail, Ban, 
  UserCheck, Calendar, Loader2, Shield, ShieldOff, Trash2, Gift,
  ChevronLeft, ChevronRight
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
import { useUsersCreditCounts } from '@/hooks/useUserCredits';
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

const USERS_PER_PAGE = 50;

const AdminUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [adminAction, setAdminAction] = useState<'grant' | 'revoke'>('grant');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'admins'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setDebouncedSearch(val);
      setCurrentPage(1);
    }, 300);
    setSearchTimeout(timeout);
  };

  const handleStatusFilterChange = (val: 'all' | 'active' | 'admins') => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const offset = (currentPage - 1) * USERS_PER_PAGE;

  // Server-side stats
  const { data: stats } = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: async () => {
      const [total, admins, pro, unlimited] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_admin', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'pro'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'unlimited'),
      ]);
      return {
        total: total.count || 0,
        admins: admins.count || 0,
        pro: pro.count || 0,
        unlimited: unlimited.count || 0,
      };
    },
    staleTime: 30000,
  });

  // Server-side paginated + filtered query
  const { data: usersData, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', debouncedSearch, statusFilter, currentPage],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('id, user_id, first_name, last_name, email, status, plan, letters_count, created_at, is_admin, role', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (debouncedSearch) {
        query = query.or(`email.ilike.%${debouncedSearch}%,first_name.ilike.%${debouncedSearch}%,last_name.ilike.%${debouncedSearch}%`);
      }

      if (statusFilter === 'active') {
        query = query.eq('status', 'active');
      } else if (statusFilter === 'admins') {
        query = query.eq('is_admin', true);
      }

      query = query.range(offset, offset + USERS_PER_PAGE - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return { users: (data || []) as UserProfile[], totalCount: count || 0 };
    },
  });

  const users = usersData?.users || [];
  const totalCount = usersData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / USERS_PER_PAGE);

  const updateUserStatus = async (userId: string, status: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', userId);

    if (error) {
      toast({ title: 'Error updating user', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'User updated', description: `User status changed to ${status}` });
      refetch();
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
      .update({ is_admin: isGranting, role: isGranting ? 'admin' : 'user' })
      .eq('id', selectedUser.id);

    if (error) {
      toast({ title: 'Error updating admin status', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: isGranting ? 'Admin granted' : 'Admin revoked',
        description: `${selectedUser.email} ${isGranting ? 'is now an admin' : 'is no longer an admin'}`,
      });
      refetch();
    }
    setAdminDialogOpen(false);
  };

  // Get all user_ids for credit count fetching
  const userIds = users.map(u => u.user_id);
  const { creditCounts, isLoading: creditsLoading } = useUsersCreditCounts(userIds);

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
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (email) return email[0].toUpperCase();
    return 'U';
  };

  const getDisplayName = (user: UserProfile) => {
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    return user.email || 'Anonymous User';
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 overflow-x-hidden max-w-full">
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
            <div className="text-2xl font-bold text-foreground">{stats?.total ?? '—'}</div>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">{stats?.admins ?? '—'}</div>
            <p className="text-sm text-muted-foreground">Administrators</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">{stats?.pro ?? '—'}</div>
            <p className="text-sm text-muted-foreground">Pro Subscribers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">{stats?.unlimited ?? '—'}</div>
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
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button variant={statusFilter === 'all' ? 'outline' : 'ghost'} onClick={() => handleStatusFilterChange('all')} className="w-full sm:w-auto">All</Button>
              <Button variant={statusFilter === 'active' ? 'outline' : 'ghost'} onClick={() => handleStatusFilterChange('active')} className="w-full sm:w-auto">Active</Button>
              <Button variant={statusFilter === 'admins' ? 'outline' : 'ghost'} onClick={() => handleStatusFilterChange('admins')} className="w-full sm:w-auto">Admins</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Letters</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
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
                        <Badge className="bg-primary"><Shield className="h-3 w-3 mr-1" />Admin</Badge>
                      ) : (
                        <Badge variant="outline">User</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className={user.status === 'active' ? 'bg-green-600' : ''}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell><Badge variant="outline">{user.plan}</Badge></TableCell>
                    <TableCell>
                      {creditsLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : creditCounts[user.user_id] ? (
                        <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">
                          <Gift className="h-3 w-3 mr-1" />{creditCounts[user.user_id]}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.letters_count}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                            <UserCheck className="h-4 w-4 mr-2" />View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEmailUser(user)}>
                            <Mail className="h-4 w-4 mr-2" />Email User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.is_admin ? (
                            <DropdownMenuItem onClick={() => handleAdminAction(user, 'revoke')} disabled={user.user_id === currentUser?.id}>
                              <ShieldOff className="h-4 w-4 mr-2" />Revoke Admin
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleAdminAction(user, 'grant')}>
                              <Shield className="h-4 w-4 mr-2" />Make Admin
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleSuspendAction(user)}>
                            <Ban className="h-4 w-4 mr-2" />{user.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(user)} disabled={user.user_id === currentUser?.id}>
                            <Trash2 className="h-4 w-4 mr-2" />Delete User
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}–{Math.min(offset + USERS_PER_PAGE, totalCount)} of {totalCount}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex items-center text-sm px-2">{currentPage} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Admin Confirmation Dialog */}
      <AlertDialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{adminAction === 'grant' ? 'Grant Admin Access' : 'Revoke Admin Access'}</AlertDialogTitle>
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
            <AlertDialogTitle>{selectedUser?.status === 'suspended' ? 'Unsuspend User' : 'Suspend User'}</AlertDialogTitle>
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
        onSuccess={() => refetch()}
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
