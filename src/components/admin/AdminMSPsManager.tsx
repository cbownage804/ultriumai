import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Edit, Eye, Plus, Building2 } from 'lucide-react';

export const AdminMSPsManager = () => {
  const [msps, setMsps] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMSP, setSelectedMSP] = useState<any>(null);
  const [showClients, setShowClients] = useState(false);
  const { toast } = useToast();

  const fetchMSPs = async () => {
    try {
      console.log('🔍 Fetching MSPs for admin dashboard...');
      
      // Simplified query to avoid JOIN issues
      const { data, error } = await supabase
        .from('msps')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('🏢 MSPs data:', { count: data?.length, error: error?.message });

      if (error) throw error;
      setMsps(data || []);
    } catch (error: any) {
      console.error('❌ Error fetching MSPs:', error);
      toast({
        title: "Error",
        description: `Failed to fetch MSPs: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMSPClients = async (mspId: string) => {
    try {
      const { data, error } = await supabase
        .from('msp_clients')
        .select('*')
        .eq('msp_id', mspId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch MSP clients",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchMSPs();
  }, []);

  const handleUpdateMSP = async (mspId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('msps')
        .update(updates)
        .eq('id', mspId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "MSP updated successfully",
      });
      
      fetchMSPs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update MSP",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      starter: 'bg-gray-100 text-gray-800',
      professional: 'bg-blue-100 text-blue-800',
      enterprise: 'bg-purple-100 text-purple-800'
    };
    return (
      <Badge className={colors[tier as keyof typeof colors] || colors.starter}>
        {tier?.toUpperCase() || 'STARTER'}
      </Badge>
    );
  };

  const calculateTotalRevenue = (msp: any) => {
    if (!msp.msp_clients) return 0;
    return msp.msp_clients.reduce((total: number, client: any) => {
      return total + (client.is_active ? client.monthly_rate : 0);
    }, 0);
  };

  const filteredMSPs = msps.filter(msp => 
    msp.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msp.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msp.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>MSP Management</CardTitle>
          <CardDescription>
            Manage MSP accounts, their clients, and revenue tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search MSPs by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>MSP</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Clients</TableHead>
                  <TableHead>Monthly Revenue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMSPs.map((msp) => (
                  <TableRow key={msp.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{msp.company_name}</p>
                        <p className="text-sm text-muted-foreground">{msp.brand_name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{msp.profiles?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{msp.profiles?.email}</p>
                        <p className="text-xs text-muted-foreground">{msp.contact_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTierBadge(msp.subscription_tier)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="font-medium">{msp.msp_clients?.length || 0}</span>
                        <span className="text-muted-foreground"> / {msp.max_clients}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono">${calculateTotalRevenue(msp).toFixed(2)}</span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(msp.is_active)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setSelectedMSP(msp);
                                fetchMSPClients(msp.id);
                                setShowClients(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>MSP Details: {msp.company_name}</DialogTitle>
                              <DialogDescription>
                                View MSP information and manage their clients
                              </DialogDescription>
                            </DialogHeader>
                            {selectedMSP && (
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                    <h4 className="font-medium">MSP Information</h4>
                                    <div className="space-y-2 text-sm">
                                      <div><strong>Company:</strong> {selectedMSP.company_name}</div>
                                      <div><strong>Brand:</strong> {selectedMSP.brand_name}</div>
                                      <div><strong>Contact:</strong> {selectedMSP.contact_email}</div>
                                      <div><strong>Phone:</strong> {selectedMSP.phone || 'N/A'}</div>
                                      <div><strong>Domain:</strong> {selectedMSP.domain || 'N/A'}</div>
                                      <div><strong>Tier:</strong> {selectedMSP.subscription_tier}</div>
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <h4 className="font-medium">Billing Information</h4>
                                    <div className="space-y-2 text-sm">
                                      <div><strong>Rate per User:</strong> ${selectedMSP.monthly_rate_per_user}/month</div>
                                      <div><strong>Commission:</strong> {(selectedMSP.commission_rate * 100).toFixed(1)}%</div>
                                      <div><strong>Max Clients:</strong> {selectedMSP.max_clients}</div>
                                      <div><strong>Trial Ends:</strong> {selectedMSP.trial_ends_at ? new Date(selectedMSP.trial_ends_at).toLocaleDateString() : 'N/A'}</div>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <h4 className="font-medium">Clients ({clients.length})</h4>
                                  <div className="rounded-md border">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Company</TableHead>
                                          <TableHead>Contact</TableHead>
                                          <TableHead>Rate</TableHead>
                                          <TableHead>Status</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {clients.map((client) => (
                                          <TableRow key={client.id}>
                                            <TableCell>{client.company_name}</TableCell>
                                            <TableCell>{client.contact_email}</TableCell>
                                            <TableCell className="font-mono">${client.monthly_rate}</TableCell>
                                            <TableCell>
                                              <Badge variant={client.is_active ? "default" : "secondary"}>
                                                {client.billing_status}
                                              </Badge>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleUpdateMSP(msp.id, { is_active: !msp.is_active })}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredMSPs.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No MSPs found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};