import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Shield, 
  ArrowRight, 
  Check, 
  Clock, 
  XCircle,
  Zap,
  Network,
  Lock,
  Bug,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

interface LinkRequest {
  id: string;
  request_type: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  created_at: string;
}

interface VaultAccount {
  linked_vanguard_client_id: string | null;
  linked_at: string | null;
}

export default function VanguardLinkingCard() {
  const { user } = useAuth();
  const [account, setAccount] = useState<VaultAccount | null>(null);
  const [linkRequests, setLinkRequests] = useState<LinkRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [upgradeForm, setUpgradeForm] = useState({
    request_type: 'upgrade' as 'upgrade' | 'link_existing',
    existing_client_id: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Check if user has a Vault account
      const { data: accountData } = await supabase
        .from('safepass_accounts')
        .select('linked_vanguard_client_id, linked_at')
        .eq('user_id', user.id)
        .single();
      
      if (accountData) {
        setAccount(accountData as VaultAccount);
      }

      // Fetch existing link requests
      const { data: requestsData } = await supabase
        .from('safepass_vanguard_link_requests')
        .select('*')
        .eq('safepass_user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (requestsData) {
        setLinkRequests(requestsData as LinkRequest[]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLinkRequest = async () => {
    if (!user) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('safepass_vanguard_link_requests')
        .insert({
          safepass_user_id: user.id,
          request_type: upgradeForm.request_type,
          requested_vanguard_client_id: upgradeForm.existing_client_id || null,
          notes: upgradeForm.notes || null
        });

      if (error) throw error;

      toast.success('Upgrade request submitted! Our team will review it shortly.');
      setShowUpgradeDialog(false);
      setUpgradeForm({ request_type: 'upgrade', existing_client_id: '', notes: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingRequest = linkRequests.find(r => r.status === 'pending');
  const isLinked = account?.linked_vanguard_client_id;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Already linked
  if (isLinked) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Check className="h-5 w-5" />
            Connected to Vanguard
          </CardTitle>
          <CardDescription className="text-green-700">
            Your Vault account is linked to Vanguard. Access the full security platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full bg-green-600 hover:bg-green-700">
            <a href="/vanguard/dashboard">
              Open Vanguard Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Pending request
  if (pendingRequest) {
    return (
      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Clock className="h-5 w-5" />
            Upgrade Request Pending
          </CardTitle>
          <CardDescription className="text-yellow-700">
            Your request to upgrade to Vanguard is being reviewed. We'll notify you once it's approved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-yellow-800">
            <p>Submitted: {new Date(pendingRequest.created_at).toLocaleDateString()}</p>
            {pendingRequest.notes && (
              <p className="mt-1">Notes: {pendingRequest.notes}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show upgrade option
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Upgrade to Vanguard
        </CardTitle>
        <CardDescription>
          Unlock the full power of enterprise security with Vanguard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Features */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-primary" />
            <span>XDR/EDR Protection</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Network className="h-4 w-4 text-primary" />
            <span>Network Scanning</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Bug className="h-4 w-4 text-primary" />
            <span>Penetration Testing</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span>Security Analytics</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Lock className="h-4 w-4 text-primary" />
            <span>Compliance Tools</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-500" />
            <span className="font-medium">Vault Included</span>
          </div>
        </div>

        <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
          <DialogTrigger asChild>
            <Button className="w-full">
              Request Upgrade
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upgrade to Vanguard</DialogTitle>
              <DialogDescription>
                Submit a request to link your Vault account to Vanguard and unlock enterprise security features.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-3">
                <Label>Request Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={upgradeForm.request_type === 'upgrade' ? 'default' : 'outline'}
                    onClick={() => setUpgradeForm(prev => ({ ...prev, request_type: 'upgrade', existing_client_id: '' }))}
                    className="h-auto py-3 flex flex-col items-start"
                  >
                    <span className="font-medium">New Customer</span>
                    <span className="text-xs opacity-80">Create new Vanguard account</span>
                  </Button>
                  <Button
                    type="button"
                    variant={upgradeForm.request_type === 'link_existing' ? 'default' : 'outline'}
                    onClick={() => setUpgradeForm(prev => ({ ...prev, request_type: 'link_existing' }))}
                    className="h-auto py-3 flex flex-col items-start"
                  >
                    <span className="font-medium">Existing Customer</span>
                    <span className="text-xs opacity-80">Link to existing client</span>
                  </Button>
                </div>
              </div>

              {upgradeForm.request_type === 'link_existing' && (
                <div className="space-y-2">
                  <Label htmlFor="client_id">Your Client/Company ID</Label>
                  <Input
                    id="client_id"
                    value={upgradeForm.existing_client_id}
                    onChange={(e) => setUpgradeForm(prev => ({ ...prev, existing_client_id: e.target.value }))}
                    placeholder="Enter your Vanguard client ID"
                  />
                  <p className="text-xs text-muted-foreground">
                    Contact your IT provider if you don't know your client ID
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={upgradeForm.notes}
                  onChange={(e) => setUpgradeForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Tell us about your security needs..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitLinkRequest} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
