import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Shield, Users, Crown, Zap, Search, Edit, RefreshCw, 
  CheckCircle, XCircle, ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface Subscription {
  id: string;
  user_id: string;
  tier: string;
  seat_count: number;
  status: string;
  admin_override: boolean;
  admin_override_reason: string | null;
  current_period_end: string | null;
  created_at: string;
  user_email?: string;
}

const TIERS = [
  { value: 'free', label: 'Free', icon: Shield, color: 'text-gray-400' },
  { value: 'starter', label: 'Starter', icon: Shield, color: 'text-blue-400' },
  { value: 'professional', label: 'Professional', icon: Zap, color: 'text-purple-400' },
  { value: 'enterprise', label: 'Enterprise', icon: Crown, color: 'text-yellow-400' },
];

const VanguardSubscriptionAdmin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editDialog, setEditDialog] = useState<{ open: boolean; subscription: Subscription | null }>({ open: false, subscription: null });
  const [editForm, setEditForm] = useState({ tier: '', seats: 1, reason: '' });
  const [addDialog, setAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({ email: '', tier: 'starter', seats: 1, reason: '' });

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vanguard_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch user emails from profiles
      const userIds = data?.map(s => s.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      const emailMap = new Map(profiles?.map(p => [p.id, p.email]) || []);
      
      const enriched = (data || []).map(sub => ({
        ...sub,
        user_email: emailMap.get(sub.user_id) || 'Unknown',
      }));

      setSubscriptions(enriched);
    } catch (error: any) {
      toast({
        title: "Error loading subscriptions",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subscription: Subscription) => {
    setEditForm({
      tier: subscription.tier,
      seats: subscription.seat_count,
      reason: '',
    });
    setEditDialog({ open: true, subscription });
  };

  const saveEdit = async () => {
    if (!editDialog.subscription) return;
    
    try {
      const { error } = await supabase
        .from('vanguard_subscriptions')
        .update({
          tier: editForm.tier,
          seat_count: editForm.seats,
          admin_override: true,
          admin_override_by: user?.id,
          admin_override_reason: editForm.reason,
          status: 'manual',
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        })
        .eq('id', editDialog.subscription.id);

      if (error) throw error;

      toast({
        title: "Subscription updated",
        description: `Set to ${editForm.tier} tier with ${editForm.seats} seats`,
      });
      
      setEditDialog({ open: false, subscription: null });
      loadSubscriptions();
    } catch (error: any) {
      toast({
        title: "Error updating subscription",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addSubscription = async () => {
    try {
      // First find user by email
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', addForm.email)
        .single();

      if (!profile) {
        toast({
          title: "User not found",
          description: "No user found with that email address",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('vanguard_subscriptions')
        .upsert({
          user_id: profile.id,
          tier: addForm.tier,
          seat_count: addForm.seats,
          admin_override: true,
          admin_override_by: user?.id,
          admin_override_reason: addForm.reason || 'Manual assignment by admin',
          status: 'manual',
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Subscription created",
        description: `${addForm.email} now has ${addForm.tier} tier`,
      });
      
      setAddDialog(false);
      setAddForm({ email: '', tier: 'starter', seats: 1, reason: '' });
      loadSubscriptions();
    } catch (error: any) {
      toast({
        title: "Error creating subscription",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => 
    sub.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.tier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTierIcon = (tier: string) => {
    const tierConfig = TIERS.find(t => t.value === tier);
    if (!tierConfig) return Shield;
    return tierConfig.icon;
  };

  const getTierColor = (tier: string) => {
    const tierConfig = TIERS.find(t => t.value === tier);
    return tierConfig?.color || 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/admin')}
              className="text-white/60 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6 text-cyan-400" />
                Vanguard Subscription Management
              </h1>
              <p className="text-white/60">Manually assign and manage user subscription tiers</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={loadSubscriptions}
              className="border-white/20 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={addDialog} onOpenChange={setAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-cyan-500 to-purple-600">
                  <Users className="h-4 w-4 mr-2" />
                  Add Subscription
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0d0d12] border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle>Add Manual Subscription</DialogTitle>
                  <DialogDescription className="text-white/60">
                    Assign a subscription tier to a user for testing or special access
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>User Email</Label>
                    <Input 
                      placeholder="user@example.com"
                      value={addForm.email}
                      onChange={(e) => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tier</Label>
                    <Select value={addForm.tier} onValueChange={(v) => setAddForm(prev => ({ ...prev, tier: v }))}>
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d0d12] border-white/10">
                        {TIERS.map(tier => (
                          <SelectItem key={tier.value} value={tier.value}>
                            {tier.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Seat Count</Label>
                    <Input 
                      type="number"
                      min={1}
                      value={addForm.seats}
                      onChange={(e) => setAddForm(prev => ({ ...prev, seats: parseInt(e.target.value) || 1 }))}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reason (optional)</Label>
                    <Textarea 
                      placeholder="Testing, demo account, etc."
                      value={addForm.reason}
                      onChange={(e) => setAddForm(prev => ({ ...prev, reason: e.target.value }))}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddDialog(false)} className="border-white/20">
                    Cancel
                  </Button>
                  <Button onClick={addSubscription} className="bg-gradient-to-r from-cyan-500 to-purple-600">
                    Create Subscription
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {TIERS.map(tier => {
            const count = subscriptions.filter(s => s.tier === tier.value).length;
            const TierIcon = tier.icon;
            return (
              <Card key={tier.value} className="bg-white/5 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white/70">{tier.label}</CardTitle>
                  <TierIcon className={`h-4 w-4 ${tier.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{count}</div>
                  <p className="text-xs text-white/50">active subscriptions</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search & Table */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">All Subscriptions</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  placeholder="Search by email or tier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-white/70">User</TableHead>
                  <TableHead className="text-white/70">Tier</TableHead>
                  <TableHead className="text-white/70">Seats</TableHead>
                  <TableHead className="text-white/70">Status</TableHead>
                  <TableHead className="text-white/70">Override</TableHead>
                  <TableHead className="text-white/70">Expires</TableHead>
                  <TableHead className="text-white/70">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-white/40 py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-white/40 py-8">
                      No subscriptions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscriptions.map((sub) => {
                    const TierIcon = getTierIcon(sub.tier);
                    return (
                      <TableRow key={sub.id} className="border-white/10">
                        <TableCell className="text-white">{sub.user_email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TierIcon className={`h-4 w-4 ${getTierColor(sub.tier)}`} />
                            <span className="text-white capitalize">{sub.tier}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-white">{sub.seat_count}</TableCell>
                        <TableCell>
                          <Badge className={sub.status === 'active' || sub.status === 'manual' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                            {sub.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {sub.admin_override ? (
                            <CheckCircle className="h-4 w-4 text-yellow-400" />
                          ) : (
                            <XCircle className="h-4 w-4 text-white/30" />
                          )}
                        </TableCell>
                        <TableCell className="text-white/60">
                          {sub.current_period_end 
                            ? new Date(sub.current_period_end).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(sub)}
                            className="text-white/60 hover:text-white"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, subscription: editDialog.subscription })}>
          <DialogContent className="bg-[#0d0d12] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Edit Subscription</DialogTitle>
              <DialogDescription className="text-white/60">
                Update tier for {editDialog.subscription?.user_email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tier</Label>
                <Select value={editForm.tier} onValueChange={(v) => setEditForm(prev => ({ ...prev, tier: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d0d12] border-white/10">
                    {TIERS.map(tier => (
                      <SelectItem key={tier.value} value={tier.value}>
                        {tier.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Seat Count</Label>
                <Input 
                  type="number"
                  min={1}
                  value={editForm.seats}
                  onChange={(e) => setEditForm(prev => ({ ...prev, seats: parseInt(e.target.value) || 1 }))}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Reason for change</Label>
                <Textarea 
                  placeholder="Reason for manual override..."
                  value={editForm.reason}
                  onChange={(e) => setEditForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog({ open: false, subscription: null })} className="border-white/20">
                Cancel
              </Button>
              <Button onClick={saveEdit} className="bg-gradient-to-r from-cyan-500 to-purple-600">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default VanguardSubscriptionAdmin;
