/**
 * Vanguard SafeSuite Admin - MSP management of client SafeSuite deployments
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Shield, 
  Users, 
  Search, 
  Plus, 
  Crown, 
  Sparkles, 
  Key, 
  ScanSearch,
  Globe,
  Package,
  RefreshCw,
  ExternalLink,
  MoreHorizontal,
  Mail,
  Calendar,
  TrendingUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ClientSubscription {
  id: string;
  user_id: string;
  email: string;
  tier: 'free' | 'pro' | 'business';
  status: string;
  current_period_end: string | null;
  created_at: string;
  usage?: {
    passwords_count: number;
    scans_count: number;
    web_assets_count: number;
  };
}

const tierConfig = {
  free: { 
    label: 'Free', 
    color: 'bg-muted text-muted-foreground',
    icon: Shield 
  },
  pro: { 
    label: 'Pro', 
    color: 'bg-primary/10 text-primary border-primary/20',
    icon: Sparkles 
  },
  business: { 
    label: 'Business', 
    color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    icon: Crown 
  },
};

export default function VanguardSafeSuiteAdmin() {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [provisionDialogOpen, setProvisionDialogOpen] = useState(false);
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientTier, setNewClientTier] = useState<string>('pro');
  const [provisioning, setProvisioning] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      // Fetch all SafeSuite subscriptions (MSP can see all)
      const { data: subscriptions, error } = await supabase
        .from('safesuite_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich with user emails
      const enrichedClients: ClientSubscription[] = [];
      
      for (const sub of subscriptions || []) {
        // For now, we'll use a placeholder - in production, this would be from profiles table
        enrichedClients.push({
          id: sub.id,
          user_id: sub.user_id,
          email: `user-${sub.user_id.slice(0, 8)}@client.com`, // Placeholder
          tier: sub.tier as 'free' | 'pro' | 'business',
          status: sub.status,
          current_period_end: sub.current_period_end,
          created_at: sub.created_at,
          usage: {
            passwords_count: Math.floor(Math.random() * 50), // Mock data
            scans_count: Math.floor(Math.random() * 20),
            web_assets_count: Math.floor(Math.random() * 10),
          },
        });
      }

      setClients(enrichedClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load client data');
    } finally {
      setLoading(false);
    }
  };

  const handleProvisionClient = async () => {
    if (!newClientEmail) {
      toast.error('Please enter a client email');
      return;
    }

    setProvisioning(true);
    try {
      // In production, this would:
      // 1. Create or find the user
      // 2. Create a subscription record
      // 3. Optionally create a Stripe subscription
      
      toast.success(`SafeSuite ${newClientTier} provisioned for ${newClientEmail}`);
      setProvisionDialogOpen(false);
      setNewClientEmail('');
      setNewClientTier('pro');
      fetchClients();
    } catch (error) {
      toast.error('Failed to provision SafeSuite');
    } finally {
      setProvisioning(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = filterTier === 'all' || client.tier === filterTier;
    return matchesSearch && matchesTier;
  });

  const stats = {
    total: clients.length,
    free: clients.filter(c => c.tier === 'free').length,
    pro: clients.filter(c => c.tier === 'pro').length,
    business: clients.filter(c => c.tier === 'business').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="h-7 w-7 text-cyan-400" />
            SafeSuite Management
          </h1>
          <p className="text-white/60 mt-1">
            Manage client SafeSuite deployments and subscriptions
          </p>
        </div>
        
        <Dialog open={provisionDialogOpen} onOpenChange={setProvisionDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600">
              <Plus className="h-4 w-4" />
              Provision SafeSuite
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1a2e] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Provision SafeSuite for Client</DialogTitle>
              <DialogDescription className="text-white/60">
                Add SafeSuite access for a new or existing client
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm text-white/80">Client Email</label>
                <Input
                  placeholder="client@example.com"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/80">Subscription Tier</label>
                <Select value={newClientTier} onValueChange={setNewClientTier}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro ($9.99/mo)</SelectItem>
                    <SelectItem value="business">Business ($29.99/mo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleProvisionClient}
                disabled={provisioning}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500"
              >
                {provisioning ? 'Provisioning...' : 'Provision SafeSuite'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/60">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-400" />
              <span className="text-2xl font-bold text-white">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/60">Free Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-gray-400" />
              <span className="text-2xl font-bold text-white">{stats.free}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/60">Pro Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold text-white">{stats.pro}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/60">Business Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold text-white">{stats.business}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client List */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-white">Client Subscriptions</CardTitle>
              <CardDescription className="text-white/60">
                View and manage all SafeSuite client deployments
              </CardDescription>
            </div>
            
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 text-white w-64"
                />
              </div>
              
              <Select value={filterTier} onValueChange={setFilterTier}>
                <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="All Tiers" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10">
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                onClick={fetchClients}
                className="text-white/60 hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-white/60">Client</TableHead>
                <TableHead className="text-white/60">Tier</TableHead>
                <TableHead className="text-white/60">Status</TableHead>
                <TableHead className="text-white/60">Usage</TableHead>
                <TableHead className="text-white/60">Renewal</TableHead>
                <TableHead className="text-white/60 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-white/40">
                    Loading clients...
                  </TableCell>
                </TableRow>
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState
                      icon={Users}
                      title="No clients found"
                      description="Add your first SafeSuite client to get started"
                      size="sm"
                      action={{
                        label: "Add Client",
                        onClick: () => {}
                      }}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => {
                  const TierIcon = tierConfig[client.tier].icon;
                  return (
                    <TableRow key={client.id} className="border-white/10">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                            {client.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-medium">{client.email}</p>
                            <p className="text-white/40 text-xs">ID: {client.user_id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1 ${tierConfig[client.tier].color}`}>
                          <TierIcon className="h-3 w-3" />
                          {tierConfig[client.tier].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={client.status === 'active' 
                            ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }
                        >
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 text-sm text-white/60">
                          <span className="flex items-center gap-1">
                            <Key className="h-3 w-3" />
                            {client.usage?.passwords_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <ScanSearch className="h-3 w-3" />
                            {client.usage?.scans_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {client.usage?.web_assets_count}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-white/60">
                        {client.current_period_end 
                          ? format(new Date(client.current_period_end), 'MMM d, yyyy')
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1a1a2e] border-white/10">
                            <DropdownMenuItem className="text-white/80 hover:text-white focus:text-white">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View Dashboard
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-white/80 hover:text-white focus:text-white">
                              <TrendingUp className="mr-2 h-4 w-4" />
                              Upgrade Tier
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-white/80 hover:text-white focus:text-white">
                              <Mail className="mr-2 h-4 w-4" />
                              Send Invite
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
