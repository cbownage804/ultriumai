import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  UserPlus, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Loader2,
  Trash2,
  Mail,
  Timer,
  HeartPulse
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface EmergencyAccessRecord {
  id: string;
  vault_owner_id: string;
  emergency_contact_id: string;
  vault_id: string | null;
  access_type: string;
  wait_period_hours: number;
  status: string;
  requested_at: string | null;
  approved_at: string | null;
  expires_at: string | null;
  reason: string | null;
  created_at: string;
}

export const EmergencyAccess = () => {
  const { user } = useAuth();
  const [myContacts, setMyContacts] = useState<EmergencyAccessRecord[]>([]);
  const [pendingRequests, setPendingRequests] = useState<EmergencyAccessRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newContact, setNewContact] = useState({ email: '', waitHours: '168' });

  const loadData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load emergency access I've set up
      const { data: contacts, error: contactsError } = await supabase
        .from('safepass_emergency_access')
        .select('*')
        .eq('vault_owner_id', user.id)
        .order('created_at', { ascending: false });

      if (contactsError) throw contactsError;
      setMyContacts(contacts || []);

      // Load requests where I'm the emergency contact
      const { data: requests, error: requestsError } = await supabase
        .from('safepass_emergency_access')
        .select('*')
        .eq('emergency_contact_id', user.id)
        .in('status', ['pending', 'requested'])
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;
      setPendingRequests(requests || []);
    } catch (error) {
      console.error('Failed to load emergency access data');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddContact = async () => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    toast.info('Emergency access setup requires the contact to have a Vault account', {
      description: 'They will receive an invitation email.',
      duration: 5000
    });

    setIsAddDialogOpen(false);
  };

  const handleRemoveContact = async (contactId: string) => {
    if (!confirm('Remove this emergency contact?')) return;

    try {
      const { error } = await supabase
        .from('safepass_emergency_access')
        .delete()
        .eq('id', contactId);

      if (error) throw error;
      toast.success('Contact removed');
      loadData();
    } catch (error) {
      toast.error('Failed to remove contact');
    }
  };

  const handleDenyRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('safepass_emergency_access')
        .update({ status: 'denied' })
        .eq('id', requestId);

      if (error) throw error;
      toast.success('Emergency access denied');
      loadData();
    } catch (error) {
      toast.error('Failed to deny request');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-red-500" />
            Emergency Access
          </h2>
          <p className="text-muted-foreground">
            Allow trusted contacts to request access to your vault in emergencies
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary text-black">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Trusted Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Emergency Contact</DialogTitle>
              <DialogDescription>
                This person can request access to your vault. You'll have time to deny the request.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Contact Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="trusted@example.com"
                />
              </div>
              <div>
                <Label htmlFor="waitHours">Wait Time Before Access</Label>
                <Select 
                  value={newContact.waitHours} 
                  onValueChange={(value) => setNewContact(prev => ({ ...prev, waitHours: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">1 Day</SelectItem>
                    <SelectItem value="72">3 Days</SelectItem>
                    <SelectItem value="168">7 Days (Recommended)</SelectItem>
                    <SelectItem value="336">14 Days</SelectItem>
                    <SelectItem value="720">30 Days</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Time to deny the request before access is granted
                </p>
              </div>
              <Button onClick={handleAddContact} disabled={isAdding} className="w-full bg-primary hover:bg-primary text-black">
                {isAdding ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</>
                ) : (
                  <><UserPlus className="w-4 h-4 mr-2" /> Add Contact</>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-red-500/10 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-medium">How Emergency Access Works</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Your trusted contact can request emergency access</li>
                <li>• You'll have the wait period to deny the request</li>
                <li>• If not denied, access is granted automatically</li>
                <li>• Designed for situations where you may be incapacitated</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* My Trusted Contacts */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">My Trusted Contacts</h3>
        {myContacts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <Shield className="w-10 h-10 mx-auto text-violet-400/70 mb-3" />
              <p className="text-foreground font-medium">Nominate someone you trust</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                If something ever happens to you, I can grant a trusted contact access to your vault after a waiting period you set.
              </p>

            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            <AnimatePresence>
              {myContacts.map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">Emergency Contact</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Timer className="w-3.5 h-3.5" />
                              <span>{Math.round(contact.wait_period_hours / 24)} day wait period</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {contact.status === 'requested' ? (
                            <>
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Access Requested
                              </Badge>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleDenyRequest(contact.id)}
                              >
                                Deny Access
                              </Button>
                            </>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </Badge>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRemoveContact(contact.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {contact.status === 'requested' && contact.expires_at && (
                        <div className="mt-3 p-2 bg-destructive/10 rounded-lg">
                          <p className="text-sm text-destructive flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Access will be granted {formatDistanceToNow(new Date(contact.expires_at), { addSuffix: true })} unless denied
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Pending Requests (where I can request access) */}
      {pendingRequests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Pending Access Requests</h3>
          <div className="grid gap-3">
            {pendingRequests.map((request) => (
              <Card key={request.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <HeartPulse className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Emergency Access Request</p>
                        <p className="text-sm text-muted-foreground">
                          {Math.round(request.wait_period_hours / 24)} day wait period
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
