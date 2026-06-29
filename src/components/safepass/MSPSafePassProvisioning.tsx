import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Send, 
  Copy, 
  Check, 
  Clock, 
  XCircle,
  Users,
  Mail,
  Link,
  RefreshCw,
  Trash2,
  Key
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface VaultInvite {
  id: string;
  email: string;
  full_name: string | null;
  client_id: string | null;
  invite_token: string;
  invite_expires_at: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  accepted_at: string | null;
  created_at: string;
}

interface VaultAccount {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  subscription_status: string;
  linked_vanguard_client_id: string | null;
  linked_at: string | null;
  provisioned_at: string | null;
  msp_client_id: string | null;
  created_at: string;
}

interface LinkRequest {
  id: string;
  safepass_user_id: string;
  requested_vanguard_client_id: string | null;
  request_type: 'upgrade' | 'link_existing';
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  created_at: string;
  // Joined data
  account?: VaultAccount;
}

export default function MSPVaultProvisioning() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<VaultInvite[]>([]);
  const [accounts, setAccounts] = useState<VaultAccount[]>([]);
  const [linkRequests, setLinkRequests] = useState<LinkRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  
  // New invite form
  const [newInvite, setNewInvite] = useState({
    email: '',
    full_name: '',
    client_id: ''
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch invites
      const { data: invitesData, error: invitesError } = await supabase
        .from('safepass_msp_invites')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (invitesError) throw invitesError;
      setInvites((invitesData || []) as VaultInvite[]);

      // Fetch provisioned accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('safepass_accounts')
        .select('*')
        .not('provisioned_by_msp', 'is', null)
        .order('created_at', { ascending: false });
      
      if (!accountsError && accountsData) {
        setAccounts(accountsData as VaultAccount[]);
      }

      // Fetch link requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('safepass_vanguard_link_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (!requestsError && requestsData) {
        setLinkRequests(requestsData as LinkRequest[]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async () => {
    if (!user || !newInvite.email) {
      toast.error('Email is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('safepass_msp_invites')
        .insert({
          msp_user_id: user.id,
          email: newInvite.email,
          full_name: newInvite.full_name || null,
          client_id: newInvite.client_id || null
        })
        .select()
        .single();

      if (error) throw error;

      setInvites(prev => [data as VaultInvite, ...prev]);
      setShowInviteDialog(false);
      setNewInvite({ email: '', full_name: '', client_id: '' });
      toast.success('Invite created successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create invite');
    }
  };

  const handleCopyInviteLink = async (token: string) => {
    const inviteUrl = `${window.location.origin}/safepass-app/auth?invite=${token}`;
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast.success('Invite link copied to clipboard');
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('safepass_msp_invites')
        .update({ status: 'cancelled' })
        .eq('id', inviteId);

      if (error) throw error;

      setInvites(prev => prev.map(inv => 
        inv.id === inviteId ? { ...inv, status: 'cancelled' } : inv
      ));
      toast.success('Invite cancelled');
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel invite');
    }
  };

  const handleApproveLinkRequest = async (requestId: string, clientId: string) => {
    try {
      const { error } = await supabase
        .from('safepass_vanguard_link_requests')
        .update({ 
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      setLinkRequests(prev => prev.filter(r => r.id !== requestId));
      toast.success('Link request approved');
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve request');
    }
  };

  const handleRejectLinkRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('safepass_vanguard_link_requests')
        .update({ 
          status: 'rejected',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      setLinkRequests(prev => prev.filter(r => r.id !== requestId));
      toast.success('Link request rejected');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject request');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" /> Accepted</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800"><XCircle className="h-3 w-3 mr-1" /> Expired</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" /> Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Key className="h-6 w-6 text-primary" />
            Vault User Management
          </h2>
          <p className="text-muted-foreground">
            Provision Vault accounts for clients and manage Vanguard linking
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Vault User</DialogTitle>
                <DialogDescription>
                  Create a Vault account for a client. They'll receive an invite link to set up their account.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newInvite.email}
                    onChange={(e) => setNewInvite(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="client@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={newInvite.full_name}
                    onChange={(e) => setNewInvite(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_id">Link to Vanguard Client (Optional)</Label>
                  <Input
                    id="client_id"
                    value={newInvite.client_id}
                    onChange={(e) => setNewInvite(prev => ({ ...prev, client_id: e.target.value }))}
                    placeholder="Client ID"
                  />
                  <p className="text-xs text-muted-foreground">
                    Pre-link this Vault account to a Vanguard client
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateInvite}>
                    <Send className="h-4 w-4 mr-2" />
                    Create Invite
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Accounts</p>
                <p className="text-2xl font-bold">{accounts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Mail className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Invites</p>
                <p className="text-2xl font-bold">
                  {invites.filter(i => i.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Link className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Linked to Vanguard</p>
                <p className="text-2xl font-bold">
                  {accounts.filter(a => a.linked_vanguard_client_id).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Link Requests</p>
                <p className="text-2xl font-bold">{linkRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="invites" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invites">Invites</TabsTrigger>
          <TabsTrigger value="accounts">Provisioned Accounts</TabsTrigger>
          <TabsTrigger value="link-requests">
            Link Requests
            {linkRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {linkRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invites">
          <Card>
            <CardHeader>
              <CardTitle>Vault Invites</CardTitle>
              <CardDescription>
                Invites you've sent to provision Vault accounts for clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invites.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No invites yet. Click "Invite User" to create one.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell className="font-medium">{invite.email}</TableCell>
                        <TableCell>{invite.full_name || '-'}</TableCell>
                        <TableCell>{invite.client_id || '-'}</TableCell>
                        <TableCell>{getStatusBadge(invite.status)}</TableCell>
                        <TableCell>
                          {format(new Date(invite.invite_expires_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {invite.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCopyInviteLink(invite.invite_token)}
                                >
                                  {copiedToken === invite.invite_token ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCancelInvite(invite.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <CardTitle>Provisioned Vault Accounts</CardTitle>
              <CardDescription>
                Vault accounts you've created for clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No provisioned accounts yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Vanguard Linked</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.email}</TableCell>
                        <TableCell>{account.full_name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{account.subscription_status}</Badge>
                        </TableCell>
                        <TableCell>
                          {account.linked_vanguard_client_id ? (
                            <Badge className="bg-green-100 text-green-800">
                              <Link className="h-3 w-3 mr-1" />
                              Linked
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(account.created_at), 'MMM d, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="link-requests">
          <Card>
            <CardHeader>
              <CardTitle>Vanguard Link Requests</CardTitle>
              <CardDescription>
                Vault users requesting to link their accounts to Vanguard
              </CardDescription>
            </CardHeader>
            <CardContent>
              {linkRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending link requests.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Request Type</TableHead>
                      <TableHead>Requested Client</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linkRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.account?.email || request.safepass_user_id}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {request.request_type === 'upgrade' ? 'Upgrade' : 'Link Existing'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {request.requested_vanguard_client_id || 'New Client'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {request.notes || '-'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(request.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveLinkRequest(request.id, request.requested_vanguard_client_id || '')}
                              className="text-green-600"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectLinkRequest(request.id)}
                              className="text-destructive"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
