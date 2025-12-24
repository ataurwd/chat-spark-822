import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useUsers } from '@/hooks/useUsers';
import { useReports } from '@/hooks/useReports';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Ban, UserCheck, Bell, Send, Users, AlertTriangle, Shield } from 'lucide-react';
import { Profile } from '@/types/chat';

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading, blockUser, unblockUser, sendNotification } = useAdmin(user?.id);
  const { users } = useUsers(user?.id);
  const { getReportCount, isUserBlocked } = useReports(user?.id);
  const { toast } = useToast();

  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [sendingNotification, setSendingNotification] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Include current user in the list for admin management
  const [allUsers, setAllUsers] = useState<Profile[]>([]);

  useEffect(() => {
    const fetchAllUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');

      if (data && !error) {
        setAllUsers(data as Profile[]);
      }
    };

    fetchAllUsers();
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      navigate('/');
      toast({
        title: 'Access Denied',
        description: 'You do not have admin privileges.',
        variant: 'destructive'
      });
    }
  }, [adminLoading, isAdmin, user, navigate, toast]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleBlockUser = async (userId: string) => {
    const { error } = await blockUser(userId);
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to block user.',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'User Blocked',
        description: 'User has been blocked successfully.'
      });
    }
  };

  const handleUnblockUser = async (userId: string) => {
    const { error } = await unblockUser(userId);
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to unblock user.',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'User Unblocked',
        description: 'User has been unblocked successfully.'
      });
    }
  };

  const handleSendNotification = async () => {
    if (!selectedUser || !notificationTitle || !notificationMessage) return;

    setSendingNotification(true);
    const { error } = await sendNotification(selectedUser.user_id, notificationTitle, notificationMessage);
    setSendingNotification(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to send notification.',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Notification Sent',
        description: `Notification sent to ${selectedUser.name}`
      });
      setNotificationTitle('');
      setNotificationMessage('');
      setDialogOpen(false);
    }
  };

  const handleSendToAll = async () => {
    if (!notificationTitle || !notificationMessage) return;

    setSendingNotification(true);
    
    for (const user of allUsers) {
      await sendNotification(user.user_id, notificationTitle, notificationMessage);
    }
    
    setSendingNotification(false);
    toast({
      title: 'Notifications Sent',
      description: `Notification sent to ${allUsers.length} users`
    });
    setNotificationTitle('');
    setNotificationMessage('');
    setDialogOpen(false);
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const blockedUsers = allUsers.filter(u => isUserBlocked(u.user_id));
  const totalReports = allUsers.reduce((acc, u) => acc + getReportCount(u.user_id), 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-4 px-6 py-4 bg-primary text-primary-foreground shadow-md">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Shield className="h-6 w-6" />
        <h1 className="text-xl font-bold">Admin Panel</h1>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allUsers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blocked Users</CardTitle>
              <Ban className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{blockedUsers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReports}</div>
            </CardContent>
          </Card>
        </div>

        {/* Send Notification to All */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Send Broadcast Notification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Notification title"
              value={notificationTitle}
              onChange={(e) => setNotificationTitle(e.target.value)}
            />
            <Textarea
              placeholder="Notification message"
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
            />
            <Button
              onClick={handleSendToAll}
              disabled={!notificationTitle || !notificationMessage || sendingNotification}
              className="w-full sm:w-auto"
            >
              <Send className="h-4 w-4 mr-2" />
              {sendingNotification ? 'Sending...' : 'Send to All Users'}
            </Button>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reports</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers.map((u) => {
                  const reportCount = getReportCount(u.user_id);
                  const blocked = isUserBlocked(u.user_id);

                  return (
                    <TableRow key={u.user_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback 
                              className={blocked ? 'bg-destructive/20 text-destructive' : ''}
                            >
                              {getInitials(u.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{u.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        {blocked ? (
                          <Badge variant="destructive">Blocked</Badge>
                        ) : u.is_online ? (
                          <Badge className="bg-green-500">Online</Badge>
                        ) : (
                          <Badge variant="secondary">Offline</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={reportCount >= 3 ? 'destructive' : reportCount > 0 ? 'secondary' : 'outline'}
                        >
                          {reportCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Dialog open={dialogOpen && selectedUser?.user_id === u.user_id} onOpenChange={(open) => {
                            setDialogOpen(open);
                            if (open) setSelectedUser(u);
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Bell className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Send Notification to {u.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <Input
                                  placeholder="Title"
                                  value={notificationTitle}
                                  onChange={(e) => setNotificationTitle(e.target.value)}
                                />
                                <Textarea
                                  placeholder="Message"
                                  value={notificationMessage}
                                  onChange={(e) => setNotificationMessage(e.target.value)}
                                />
                                <Button
                                  onClick={handleSendNotification}
                                  disabled={!notificationTitle || !notificationMessage || sendingNotification}
                                  className="w-full"
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  {sendingNotification ? 'Sending...' : 'Send Notification'}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          {blocked ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnblockUser(u.user_id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleBlockUser(u.user_id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
